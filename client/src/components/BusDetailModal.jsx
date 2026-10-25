import React, { useEffect, useState } from 'react';
import { apiUrl } from '../config/api';
import { X, Phone, Users, MapPin, Gauge, Shield, Clock, CheckCircle2, ChevronRight, Navigation } from 'lucide-react';

export default function BusDetailModal({ bus, onClose, onFocusMap }) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bus?._id) return;
    setLoading(true);
    fetch(apiUrl(`/api/buses/${bus._id}`))
      .then(r => r.json())
      .then(data => {
        setDetailData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching bus detail:', err);
        setLoading(false);
      });
  }, [bus?._id]);

  if (!bus) return null;

  const currentBus = detailData?.bus || bus;
  const stops = currentBus.routeId?.stops || currentBus.route?.stops || [];
  const currentStopId = currentBus.lastLocation?.nextStopId;
  const students = detailData?.students || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="clay-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="bus-avatar" style={{ width: '50px', height: '50px' }}>
              <Navigation size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2>Bus {currentBus.busNumber}</h2>
                <span className="clay-badge clay-badge-yellow">{currentBus.plateNumber}</span>
                {currentBus.status === 'delayed' ? (
                  <span className="clay-badge clay-badge-rose">Delayed</span>
                ) : (
                  <span className="clay-badge clay-badge-emerald">Active</span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {currentBus.route?.name || currentBus.routeId?.name || (currentBus.busNumber === 'SW-01' || currentBus.busNumber === 'SW-02' ? 'Route 1: Ghatkesar ⇋ Bhonigir' : currentBus.busNumber === 'SW-03' || currentBus.busNumber === 'SW-04' ? 'Route 2: Ghatkesar ⇋ Uppal' : 'Route 3: Ghatkesar ⇋ ECIL')}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '16px 0' }}>
          <div className="clay-card" style={{ padding: '12px', textAlign: 'center', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.78rem' }}>
              <Gauge size={14} /> Speed
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
              {currentBus.lastLocation?.speed || 0} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>km/h</span>
            </div>
          </div>

          <div className="clay-card" style={{ padding: '12px', textAlign: 'center', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.78rem' }}>
              <Clock size={14} /> Next ETA
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '800', color: '#fbbf24', marginTop: '2px' }}>
              {currentBus.lastLocation?.etaMinutes || 1} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>min</span>
            </div>
          </div>

          <div className="clay-card" style={{ padding: '12px', textAlign: 'center', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#34d399', fontSize: '0.78rem' }}>
              <Users size={14} /> Students
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
              {students.length || 3} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>assigned</span>
            </div>
          </div>
        </div>

        {/* Driver Contact Card */}
        <div className="clay-card" style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800' }}>
              {currentBus.driver?.name ? currentBus.driver.name[0] : 'D'}
            </div>
            <div>
              <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '0.95rem' }}>
                {currentBus.driver?.name || currentBus.driverName || 'Designated Driver'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {currentBus.driver?.phone || currentBus.driverPhone || '+91 98490 12345'}
              </div>
            </div>
          </div>
          <a 
            href={`tel:${currentBus.driver?.phone || currentBus.driverPhone || '+919849012345'}`}
            className="clay-btn clay-btn-emerald" 
            style={{ padding: '8px 14px', fontSize: '0.78rem' }}
          >
            <Phone size={14} /> Call Driver
          </a>
        </div>

        {/* Stop Progress Timeline */}
        <div style={{ marginTop: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: '800', color: '#ffffff', marginBottom: '10px' }}>
            Live Route Itinerary
          </h3>

          <div className="stop-timeline">
            {stops.map((stop, index) => {
              const isCurrent = stop.stopId === currentStopId;
              const isCompleted = stop.polyIndex < (currentBus.simulationState?.polyIndex || 0) && !isCurrent;
              
              // Students at this stop
              const stopStudents = students.filter(s => s.stopId === stop.stopId);

              return (
                <div 
                  key={stop.stopId || index}
                  className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="timeline-node">
                    {isCompleted ? <CheckCircle2 size={18} /> : index + 1}
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#ffffff' }}>
                          {stop.name}
                        </div>
                        {stop.landmark && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {stop.landmark}
                          </div>
                        )}
                      </div>
                      <div>
                        {isCurrent ? (
                          currentBus.lastLocation?.isDwell ? (
                            <span className="clay-badge clay-badge-yellow" style={{ fontSize: '0.74rem', fontWeight: '800' }}>
                              🛑 Bus at Stop (Boarding)
                            </span>
                          ) : (
                            <span className="clay-badge clay-badge-yellow" style={{ fontSize: '0.72rem' }}>
                              Approaching (~{currentBus.lastLocation?.etaMinutes || 1}m)
                            </span>
                          )
                        ) : isCompleted ? (
                          <span className="clay-badge clay-badge-emerald" style={{ fontSize: '0.72rem' }}>
                            ✓ Passed
                          </span>
                        ) : (
                          <span className="clay-badge clay-badge-indigo" style={{ fontSize: '0.72rem' }}>
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>

                    {stopStudents.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {stopStudents.map(st => (
                          <span 
                            key={st._id} 
                            className={`clay-badge ${st.status === 'boarded' ? 'clay-badge-emerald' : 'clay-badge-yellow'}`}
                            style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                          >
                            {st.name} ({st.grade}-{st.section}) &bull; {st.status.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          {onFocusMap && (
            <button 
              className="clay-btn clay-btn-indigo"
              onClick={() => {
                onFocusMap(currentBus);
                onClose();
              }}
            >
              <MapPin size={16} /> Focus on Map
            </button>
          )}
          <button className="clay-btn clay-btn-dark" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
