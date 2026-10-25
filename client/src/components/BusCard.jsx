import React, { useEffect, useState } from 'react';
import { Bus, Clock, Gauge, ChevronRight, Navigation } from 'lucide-react';

export default function BusCard({ bus, isSelected, onClick, onSelect }) {
  const [timeAgo, setTimeAgo] = useState('just now');

  // Compute "Updated X min ago"
  useEffect(() => {
    const updateLabel = () => {
      if (!bus?.lastLocation?.lastUpdated) {
        setTimeAgo('just now');
        return;
      }
      const diffSec = Math.max(0, Math.round((Date.now() - new Date(bus.lastLocation.lastUpdated).getTime()) / 1000));
      if (diffSec < 10) setTimeAgo('just now');
      else if (diffSec < 60) setTimeAgo(`${diffSec}s ago`);
      else {
        const mins = Math.floor(diffSec / 60);
        setTimeAgo(`${mins} min ago`);
      }
    };

    updateLabel();
    const interval = setInterval(updateLabel, 5000);
    return () => clearInterval(interval);
  }, [bus?.lastLocation?.lastUpdated]);

  const loc = bus.lastLocation || {};
  const isDelayed = bus.status === 'delayed';
  const isDwell = loc.dwellUntil && new Date() < new Date(loc.dwellUntil);

  const getCorridorInfo = () => {
    const code = (bus.routeCode || bus.route?.code || '').toUpperCase();
    const name = (bus.route?.name || '').toUpperCase();
    const num = (bus.busNumber || '').toUpperCase();

    if (code.includes('BHONIGIR') || name.includes('BHONIGIR') || name.includes('BHONGIR') || num === 'SW-01' || num === 'SW-02') {
      return { text: 'Corridor: Ghatkesar ⇋ Bhonigir', color: '#34d399' };
    }
    if (code.includes('UPPAL') || name.includes('UPPAL') || num === 'SW-03' || num === 'SW-04') {
      return { text: 'Corridor: Ghatkesar ⇋ Uppal', color: '#818cf8' };
    }
    if (code.includes('ECIL') || name.includes('ECIL') || num === 'SW-05' || num === 'SW-06') {
      return { text: 'Corridor: Ghatkesar ⇋ ECIL', color: '#fbbf24' };
    }
    return { text: 'Corridor: Ghatkesar Central', color: '#818cf8' };
  };

  const getRouteTitle = () => {
    if (bus.route?.name) return bus.route.name;
    const num = (bus.busNumber || '').toUpperCase();
    if (num === 'SW-01') return 'Route 1: Ghatkesar School to Bhongir';
    if (num === 'SW-02') return 'Route 1: Bhongir to Ghatkesar School';
    if (num === 'SW-03') return 'Route 2: Ghatkesar School to Uppal';
    if (num === 'SW-04') return 'Route 2: Uppal to Ghatkesar School';
    if (num === 'SW-05') return 'Route 3: Ghatkesar School to ECIL';
    if (num === 'SW-06') return 'Route 3: ECIL to Ghatkesar School';
    return 'School Bus Route';
  };

  const corridor = getCorridorInfo();

  return (
    <div 
      className={`clay-card clay-bus-card clay-card-interactive ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(bus)}
      style={{
        border: isSelected ? '2px solid var(--clay-yellow)' : '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      {/* Top Meta */}
      <div className="bus-card-top">
        <div className="bus-title-group">
          <div className="bus-avatar">
            <Bus size={22} />
          </div>
          <div className="bus-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>{bus.busNumber}</h3>
              <span className="plate">{bus.plateNumber}</span>
            </div>
            <div className="bus-route-name">
              {getRouteTitle()}
            </div>
          </div>
        </div>

        <div>
          {isDelayed ? (
            <span className="clay-badge clay-badge-rose">Delayed</span>
          ) : isDwell ? (
            <span className="clay-badge clay-badge-yellow">At Stop</span>
          ) : (
            <span className="clay-badge clay-badge-emerald">
              <span className="clay-pulse-dot emerald"></span> Live
            </span>
          )}
        </div>
      </div>

      {/* Progress & Next Stop - Location at each stop */}
      <div className="bus-progress-row">
        <div className="next-stop-info">
          {isDwell ? (
            <>
              <span className="sub" style={{ color: '#fbbf24', fontWeight: '800' }}>
                🛑 Currently Stopped At
              </span>
              <span className="name" style={{ color: '#fbbf24' }}>
                {loc.currentStopName || loc.nextStopName || 'Ghatkesar Campus'}
              </span>
            </>
          ) : (
            <>
              <span className="sub">
                {loc.lastStopName ? `Departed ${loc.lastStopName} ➔` : 'En Route To'}
              </span>
              <span className="name">
                {loc.nextStopName || 'Ghatkesar School Campus'}
              </span>
            </>
          )}
        </div>
        <div className="eta-pill" style={{ background: isDwell ? 'rgba(251, 191, 36, 0.2)' : undefined, color: isDwell ? '#fbbf24' : undefined }}>
          <Clock size={13} />
          <span>{isDwell ? 'Boarding' : `${loc.etaMinutes || 1} min`}</span>
        </div>
      </div>

      {/* Stop Sequence Progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span>Stop #{loc.currentStopSequence || 1} of {loc.totalStops || 7}</span>
        <span style={{ color: corridor.color, fontWeight: '700' }}>
          {corridor.text}
        </span>
      </div>

      {/* Footer Details */}
      <div className="bus-card-footer">
        <div className="footer-speed">
          <Gauge size={13} />
          <span>{loc.speed || 0} km/h</span>
        </div>
        <div>
          <span>Updated {timeAgo}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--clay-yellow)', fontWeight: '700' }}>
          <span>View Stops</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}
