import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiUrl } from '../config/api';
import { Bus, AlertTriangle, Play, Square, Users, Check, X, ShieldAlert, Navigation, Gauge } from 'lucide-react';

export default function DriverDashboard() {
  const { user, token } = useAuth();
  const { buses, socket } = useSocket();
  const [assignedBus, setAssignedBus] = useState(null);
  const [students, setStudents] = useState([]);
  const [isManualDriving, setIsManualDriving] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  // Find driver's assigned bus
  useEffect(() => {
    if (!user) return;
    const bus = buses.find(b => b.driverId?._id === user._id || b.driverId === user._id || b.busNumber === user.assignedBus?.busNumber);
    if (bus) {
      setAssignedBus(bus);
      setIsManualDriving(bus.activeTripSource === 'driver');
    } else if (buses.length > 0) {
      // Fallback to first bus for demo
      setAssignedBus(buses[0]);
    }
  }, [user, buses]);

  // Fetch students for this bus
  useEffect(() => {
    if (!token) return;
    fetch(apiUrl('/api/students'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setStudents(data))
      .catch(err => console.error('Error fetching driver students:', err));
  }, [token]);

  const handleStartManualTrip = async () => {
    if (!assignedBus) return;
    try {
      const res = await fetch(apiUrl('/api/trips/start'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ busId: assignedBus._id })
      });
      if (res.ok) {
        setIsManualDriving(true);
        alert(`Manual driving mode active for Bus ${assignedBus.busNumber}. Autonomous simulator paused.`);
      }
    } catch (err) {
      alert('Error starting manual trip: ' + err.message);
    }
  };

  const handleEndManualTrip = async () => {
    if (!assignedBus) return;
    try {
      const res = await fetch(apiUrl('/api/trips/end'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ busId: assignedBus._id })
      });
      if (res.ok) {
        setIsManualDriving(false);
        alert(`Trip ended. Autonomous simulator has resumed for Bus ${assignedBus.busNumber}.`);
      }
    } catch (err) {
      alert('Error ending trip: ' + err.message);
    }
  };

  const handleUpdateStudent = async (studentId, status) => {
    try {
      const res = await fetch(apiUrl(`/api/students/${studentId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setStudents(prev => prev.map(s => s._id === studentId ? { ...s, status } : s));
      }
    } catch (err) {
      alert('Error updating student: ' + err.message);
    }
  };

  const handleEmergencySOS = async () => {
    if (!assignedBus) return;
    const confirmSOS = window.confirm(`Trigger IMMEDIATE EMERGENCY SOS broadcast for Bus ${assignedBus.busNumber}?`);
    if (!confirmSOS) return;

    try {
      const res = await fetch(apiUrl('/api/trips/sos'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          busId: assignedBus._id,
          message: `URGENT SOS: Driver ${user.name} reported emergency for Bus ${assignedBus.busNumber}!`
        })
      });
      if (res.ok) {
        setSosSent(true);
        setTimeout(() => setSosSent(false), 5000);
      }
    } catch (err) {
      alert('Error triggering SOS: ' + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1>Driver Cockpit & Roster</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Welcome, Captain <strong>{user?.name}</strong>. Manage attendance, manual trip takeovers, and SOS safety.
          </p>
        </div>
        <div>
          {isManualDriving && (
            <span className="clay-badge clay-badge-yellow" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              Manual Driver Control Active
            </span>
          )}
        </div>
      </div>

      {/* Emergency SOS Banner Button */}
      <button 
        className="sos-banner-btn"
        onClick={handleEmergencySOS}
        style={{ width: '100%', cursor: 'pointer' }}
      >
        <ShieldAlert size={28} />
        {sosSent ? '🚨 SOS BROADCAST ACTIVE TO FLEET & PARENTS!' : 'EMERGENCY SOS — BROADCAST IMMEDIATE ALARM'}
      </button>

      <div className="dash-grid-2">
        {/* Bus Controls Card */}
        <div className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="bus-avatar" style={{ width: '48px', height: '48px' }}>
                <Bus size={24} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
                  {assignedBus?.busNumber || 'Bus SW-01'}
                </h3>
                <span className="plate">{assignedBus?.plateNumber || 'TS-08-UB-4122'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Route</div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#ffffff' }}>
                {assignedBus?.route?.name || 'Ghatkesar Central School Route'}
              </div>
            </div>
          </div>

          {/* Telemetry info */}
          <div style={{ background: '#0f1524', padding: '16px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SPEED</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#38bdf8' }}>
                {assignedBus?.lastLocation?.speed || 30} km/h
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CURRENT / NEXT STOP</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {assignedBus?.lastLocation?.currentStopName || assignedBus?.lastLocation?.nextStopName || 'Ghatkesar Campus'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STOP ETA</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fbbf24' }}>
                {assignedBus?.lastLocation?.etaMinutes || 2} min
              </div>
            </div>
          </div>

          {/* Drive Mode Controls */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', display: 'flex', gap: '12px' }}>
            {!isManualDriving ? (
              <button 
                className="clay-btn clay-btn-yellow" 
                style={{ flex: 1, padding: '12px' }}
                onClick={handleStartManualTrip}
              >
                <Play size={16} /> Take Over & Drive Manually
              </button>
            ) : (
              <button 
                className="clay-btn clay-btn-emerald" 
                style={{ flex: 1, padding: '12px' }}
                onClick={handleEndManualTrip}
              >
                <Square size={16} /> Finish Trip & Resume Simulator
              </button>
            )}
          </div>
        </div>

        {/* Student Attendance Checklist */}
        <div className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} color="#fbbf24" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
                Passenger Attendance Sheet
              </h3>
            </div>
            <span className="clay-badge clay-badge-indigo">
              {students.length} Students
            </span>
          </div>

          <div className="student-checklist" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {students.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading students roster...
              </div>
            ) : (
              students.map(st => (
                <div key={st._id} className="student-row">
                  <div>
                    <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '0.9rem' }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {st.grade}-{st.section} &bull; Stop: {st.stopName}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className={`clay-btn ${st.status === 'boarded' ? 'clay-btn-emerald' : 'clay-btn-dark'}`}
                      style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                      onClick={() => handleUpdateStudent(st._id, 'boarded')}
                      title="Mark Boarded"
                    >
                      <Check size={12} /> Boarded
                    </button>
                    <button
                      className={`clay-btn ${st.status === 'dropped' ? 'clay-btn-indigo' : 'clay-btn-dark'}`}
                      style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                      onClick={() => handleUpdateStudent(st._id, 'dropped')}
                      title="Mark Dropped"
                    >
                      Dropped
                    </button>
                    <button
                      className={`clay-btn ${st.status === 'absent' ? 'clay-btn-rose' : 'clay-btn-dark'}`}
                      style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                      onClick={() => handleUpdateStudent(st._id, 'absent')}
                      title="Mark Absent"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
