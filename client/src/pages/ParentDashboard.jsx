import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiUrl } from '../config/api';
import MapView from '../components/MapView';
import { User, Bus, MapPin, Clock, Phone, ShieldCheck, CheckCircle2, Bell, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ParentDashboard() {
  const { user, token } = useAuth();
  const { buses, socket, notifications } = useSocket();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch parent's children
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(apiUrl('/api/students'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setStudents(data);
          setSelectedStudent(data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching parent students:', err);
        setLoading(false);
      });
  }, [token]);

  // 2. Real-time sync when child boards or drops
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join_parent', user._id);

    const handleStudentUpdate = (updatedStudent) => {
      setStudents(prev => prev.map(s => s._id === updatedStudent._id ? { ...s, ...updatedStudent } : s));
      setSelectedStudent(prev => prev && prev._id === updatedStudent._id ? { ...prev, ...updatedStudent } : prev);
    };

    socket.on('student:status_updated', handleStudentUpdate);

    return () => {
      socket.off('student:status_updated', handleStudentUpdate);
    };
  }, [socket, user]);

  // Find child's bus from live buses
  const childBus = buses.find(b => b.busNumber === selectedStudent?.busNumber) || null;
  const loc = childBus?.lastLocation || {};

  // Filter notifications relevant to this parent & child
  const parentAlerts = notifications.filter(n => {
    if (!selectedStudent) return false;
    const isChildAlert = n.studentId === selectedStudent._id || n.studentName === selectedStudent.name;
    const isBusAlert = n.busNumber === selectedStudent.busNumber;
    const isForParent = n.recipientRole === 'parent' || n.recipientId === user?._id;
    return isChildAlert || (isBusAlert && (isForParent || n.type === 'arrived_stop' || n.type === 'approaching_stop'));
  });

  // Recent boarding alert banner
  const latestBoardingAlert = parentAlerts.find(n => n.type === 'student_boarded');

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1>Parent Safety Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Live journey telemetry, safe zone proximity & boarding verification for Ghatkesar Central School.
          </p>
        </div>
        <div className="clay-badge clay-badge-emerald">
          <ShieldCheck size={16} /> Verified Safe Transit
        </div>
      </div>

      {/* Child Selector if multiple children */}
      {students.length > 1 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {students.map(st => (
            <button
              key={st._id}
              className={`clay-btn ${selectedStudent?._id === st._id ? 'clay-btn-emerald' : 'clay-btn-dark'}`}
              onClick={() => setSelectedStudent(st)}
            >
              {st.name} ({st.grade}-{st.section})
            </button>
          ))}
        </div>
      )}

      {/* Prominent Live Boarding Banner if Child is Boarded */}
      {selectedStudent?.status === 'boarded' && (
        <div 
          className="clay-card" 
          style={{ 
            padding: '16px 20px', 
            marginBottom: '20px', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', 
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' 
            }}>
              <CheckCircle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '0.96rem' }}>
                Boarding Confirmed: {selectedStudent.name} is Safely Onboard Bus {selectedStudent.busNumber}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '2px' }}>
                {latestBoardingAlert?.message || `Boarded at designated stop (${selectedStudent.stopName}). En route safely.`}
              </div>
            </div>
          </div>
          <span className="clay-badge clay-badge-emerald" style={{ fontSize: '0.78rem' }}>
            Onboard & Verified
          </span>
        </div>
      )}

      {!selectedStudent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="clay-card" style={{ padding: '24px', textAlign: 'center' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>
              Ghatkesar Central School &bull; Live Fleet Telemetry
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Tracking buses connecting Ghatkesar Campus to Bhonigir, Uppal, and ECIL.
            </p>
          </div>
          <div className="clay-card" style={{ height: '480px', overflow: 'hidden', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
            <MapView buses={buses} />
          </div>
        </div>
      ) : (
        <>
          <div className="dash-grid-2">
            {/* Child Status Card */}
            <div className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ 
                    width: '54px', height: '54px', borderRadius: '18px', 
                    background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    boxShadow: 'var(--clay-button-shadow)'
                  }}>
                    <User size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '800', color: '#ffffff' }}>
                      {selectedStudent.name}
                    </h2>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Roll: <strong>{selectedStudent.rollNumber}</strong> &bull; {selectedStudent.grade} - Section {selectedStudent.section}
                    </div>
                  </div>
                </div>

                <div>
                  {selectedStudent.status === 'boarded' ? (
                    <span className="clay-badge clay-badge-emerald" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                      <CheckCircle2 size={16} /> Onboard Bus
                    </span>
                  ) : selectedStudent.status === 'dropped' ? (
                    <span className="clay-badge clay-badge-indigo" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                      <CheckCircle2 size={16} /> Dropped Safely
                    </span>
                  ) : (
                    <span className="clay-badge clay-badge-yellow" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                      <Clock size={16} /> Awaiting Pickup
                    </span>
                  )}
                </div>
              </div>

              {/* Stop & ETA Info */}
              <div style={{ background: '#0f1524', padding: '16px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                    Designated Stop
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} color="#f43f5e" />
                    {selectedStudent.stopName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                    Live Bus ETA
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fbbf24', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={18} />
                    {loc.etaMinutes ? `~${loc.etaMinutes} mins` : 'Calculating...'}
                  </div>
                </div>
              </div>

              {/* Bus & Driver Detail */}
              {childBus && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="bus-avatar" style={{ width: '40px', height: '40px' }}>
                      <Bus size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: '#ffffff' }}>
                        {childBus.busNumber} &bull; {childBus.plateNumber}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Driver: {childBus.driver?.name || childBus.driverName}
                      </div>
                    </div>
                  </div>

                  <a 
                    href={`tel:${childBus.driver?.phone || childBus.driverPhone || '+919849012345'}`}
                    className="clay-btn clay-btn-emerald"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                  >
                    <Phone size={14} /> Call Driver
                  </a>
                </div>
              )}
            </div>

            {/* Mini Interactive Tracking Map */}
            <div className="clay-card" style={{ height: '360px', overflow: 'hidden', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
              <MapView 
                buses={childBus ? [childBus] : buses}
                selectedBus={childBus}
                highlightStopId={selectedStudent.stopId}
                highlightBusId={childBus?._id}
              />
            </div>
          </div>

          {/* Dedicated Parent Notifications Feed for Child */}
          <div className="clay-card" style={{ padding: '24px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' 
                }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '800' }}>
                    Parent Alerts for {selectedStudent.name}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Instant verification notifications when your child boards the bus, reaches stops, or completes transit.
                  </p>
                </div>
              </div>
              <span className="clay-badge clay-badge-emerald" style={{ fontSize: '0.75rem' }}>
                {parentAlerts.length} Alerts
              </span>
            </div>

            {parentAlerts.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                No notifications yet for Bus {selectedStudent.busNumber}. As soon as the bus reaches {selectedStudent.stopName} and your child boards, real-time alerts will appear right here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {parentAlerts.slice(0, 6).map((n, i) => {
                  const isBoarded = n.type === 'student_boarded';
                  const isDropped = n.type === 'student_dropped';
                  const isArrived = n.type === 'arrived_stop';

                  return (
                    <div 
                      key={n._id || i}
                      className="clay-card"
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        borderLeft: isBoarded ? '4px solid #10b981' : (isDropped ? '4px solid #6366f1' : '4px solid #f59e0b'),
                        background: '#111728'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                          {isBoarded ? (
                            <CheckCircle size={18} color="#10b981" />
                          ) : isDropped ? (
                            <CheckCircle size={18} color="#6366f1" />
                          ) : (
                            <Clock size={18} color="#f59e0b" />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '0.88rem' }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {n.message}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {formatTime(n.timestamp)}
                        </div>
                        <span 
                          className={`clay-badge ${isBoarded ? 'clay-badge-emerald' : (isDropped ? 'clay-badge-indigo' : 'clay-badge-yellow')}`}
                          style={{ fontSize: '0.66rem', padding: '2px 8px', marginTop: '4px', display: 'inline-block' }}
                        >
                          Bus {n.busNumber || selectedStudent.busNumber}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
