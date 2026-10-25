import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { apiUrl } from '../config/api';
import { Shield, Bus, Users, Clock, AlertTriangle, RefreshCw, CheckCircle2, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import BusDetailModal from '../components/BusDetailModal';

export default function AdminDashboard() {
  const { buses, notifications, refreshFleet } = useSocket();
  const [selectedBus, setSelectedBus] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [routesList, setRoutesList] = useState([]);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New bus form state
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newPlateNumber, setNewPlateNumber] = useState('');
  const [newRouteCode, setNewRouteCode] = useState('ROUTE-BHONIGIR-FWD');
  const [newCapacity, setNewCapacity] = useState('36');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverEmail, setNewDriverEmail] = useState('');

  // Fetch routes for selection
  useEffect(() => {
    fetch(apiUrl('/api/routes'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRoutesList(data);
          if (!newRouteCode) setNewRouteCode(data[0].code);
        }
      })
      .catch(err => console.error('Error fetching routes:', err));
  }, []);

  const totalCapacity = buses.reduce((acc, b) => acc + (b.capacity || 36), 0);
  const avgSpeed = buses.length > 0 
    ? Math.round(buses.reduce((acc, b) => acc + (b.lastLocation?.speed || 0), 0) / buses.length)
    : 32;

  const handleCreateBus = async (e) => {
    e.preventDefault();
    if (!newBusNumber.trim() || !newPlateNumber.trim() || !newRouteCode) {
      setActionMsg({ type: 'error', text: 'Please fill in the bus number, registration plate, and route.' });
      return;
    }

    setIsSubmitting(true);
    setActionMsg({ type: '', text: '' });

    try {
      const res = await fetch(apiUrl('/api/buses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busNumber: newBusNumber.trim(),
          plateNumber: newPlateNumber.trim(),
          routeCode: newRouteCode,
          capacity: Number(newCapacity) || 36,
          driverName: newDriverName.trim(),
          driverPhone: newDriverPhone.trim(),
          driverEmail: newDriverEmail.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add bus');
      }

      setActionMsg({ type: 'success', text: data.message || `Bus ${newBusNumber} successfully added!` });
      // Reset form
      setNewBusNumber('');
      setNewPlateNumber('');
      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverEmail('');
      refreshFleet();

      setTimeout(() => {
        setShowAddModal(false);
        setActionMsg({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBus = async (bus) => {
    const confirmed = window.confirm(`Are you sure you want to remove Bus ${bus.busNumber} (${bus.plateNumber}) from the active fleet?`);
    if (!confirmed) return;

    try {
      const res = await fetch(apiUrl(`/api/buses/${bus._id}`), {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove bus');
      }

      alert(data.message || `Bus ${bus.busNumber} removed.`);
      refreshFleet();
    } catch (err) {
      alert(`Error removing bus: ${err.message}`);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1>Fleet Commander Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Principal Fleet Control, vehicle management & live telemetry for Ghatkesar Central School.
          </p>
        </div>

        {/* Live Tracking Status Badge */}
        <div className="clay-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-full)' }}>
          <span className="clay-pulse-dot emerald" style={{ margin: 0 }}></span>
          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#34d399' }}>Live Telemetry Active</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="dash-grid-3">
        <div className="clay-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Active Fleet</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-clay-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
              <Bus size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800', color: '#ffffff', marginTop: '10px' }}>
            {buses.length} / {buses.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} /> 100% Vehicles Operational
          </div>
        </div>

        <div className="clay-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Average Speed</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-clay-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800', color: '#ffffff', marginTop: '10px' }}>
            {avgSpeed} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Hyderabad Urban Corridor Limits
          </div>
        </div>

        <div className="clay-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Fleet Capacity</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-clay-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800', color: '#ffffff', marginTop: '10px' }}>
            {totalCapacity} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Seats</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            18 Students Active Today
          </div>
        </div>
      </div>

      {/* Fleet Live Table */}
      <div className="clay-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
              Fleet Vehicles & Live Telemetry
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time GPS coordinates, speed, route assignment, and vehicle controls
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button"
              className="clay-btn clay-btn-indigo"
              style={{ padding: '8px 16px', fontSize: '0.82rem', gap: '6px' }}
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={15} />
              <span>Add Bus</span>
            </button>
            <button 
              type="button"
              className="clay-btn clay-btn-dark"
              style={{ padding: '8px 14px', fontSize: '0.78rem' }}
              onClick={refreshFleet}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>Bus</th>
                <th style={{ padding: '12px 14px' }}>Plate Number</th>
                <th style={{ padding: '12px 14px' }}>Route</th>
                <th style={{ padding: '12px 14px' }}>Driver</th>
                <th style={{ padding: '12px 14px' }}>Speed</th>
                <th style={{ padding: '12px 14px' }}>Next Stop (ETA)</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.map(bus => (
                <tr key={bus._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '14px', fontWeight: '800', color: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="clay-pulse-dot emerald"></span>
                      {bus.busNumber}
                    </div>
                  </td>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', color: 'var(--clay-yellow)', fontWeight: '700' }}>
                    {bus.plateNumber}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                    {bus.route?.name || 'Route'}
                  </td>
                  <td style={{ padding: '14px', color: '#ffffff' }}>
                    {bus.driver?.name || bus.driverName || 'Assigned Driver'}
                  </td>
                  <td style={{ padding: '14px', color: '#38bdf8', fontWeight: '800' }}>
                    {bus.lastLocation?.speed || 0} km/h
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: '700', color: bus.lastLocation?.isDwell ? '#fbbf24' : '#ffffff' }}>
                      {bus.lastLocation?.isDwell 
                        ? `🛑 At: ${bus.lastLocation?.currentStopName || bus.lastLocation?.nextStopName}` 
                        : `Next: ${bus.lastLocation?.nextStopName || 'Ghatkesar Campus'}`}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: bus.lastLocation?.isDwell ? '#34d399' : '#fbbf24' }}>
                      {bus.lastLocation?.isDwell ? 'Boarding Students' : `ETA: ~${bus.lastLocation?.etaMinutes || 1} min`}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    {bus.activeTripSource === 'driver' ? (
                      <span className="clay-badge clay-badge-yellow" style={{ fontSize: '0.72rem' }}>Manual Driver</span>
                    ) : bus.lastLocation?.isDwell ? (
                      <span className="clay-badge clay-badge-yellow" style={{ fontSize: '0.72rem' }}>Boarding at Stop</span>
                    ) : (
                      <span className="clay-badge clay-badge-emerald" style={{ fontSize: '0.72rem' }}>Live En Route</span>
                    )}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        type="button"
                        className="clay-btn clay-btn-indigo"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        onClick={() => setSelectedBus(bus)}
                        title="Inspect Itinerary"
                      >
                        Inspect
                      </button>
                      <button 
                        type="button"
                        className="clay-btn clay-btn-rose"
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        onClick={() => handleRemoveBus(bus)}
                        title="Remove Bus from Fleet"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bus Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div 
            className="clay-modal" 
            style={{ maxWidth: '520px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff'
                }}>
                  <Bus size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.18rem', fontWeight: '800', color: '#ffffff', margin: 0, fontFamily: 'var(--font-display)' }}>
                    Add Bus to Fleet
                  </h2>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Register a new bus and assign its route & driver
                  </p>
                </div>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowAddModal(false)} title="Close">
                <X size={18} />
              </button>
            </div>

            {/* Alert message */}
            {actionMsg.text && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', marginBottom: '14px',
                background: actionMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: actionMsg.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                color: actionMsg.type === 'error' ? '#fca5a5' : '#6ee7b7',
                fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                {actionMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{actionMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateBus} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Bus Number *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder=""
                    autoComplete="off"
                    value={newBusNumber}
                    onChange={(e) => setNewBusNumber(e.target.value)}
                    className="auth-input-field"
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>e.g. SW-07</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Plate Number *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder=""
                    autoComplete="off"
                    value={newPlateNumber}
                    onChange={(e) => setNewPlateNumber(e.target.value)}
                    className="auth-input-field"
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>e.g. TS-08-UB-9123</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Corridor Route *
                </label>
                <select 
                  value={newRouteCode} 
                  onChange={(e) => setNewRouteCode(e.target.value)}
                  className="auth-select-field"
                  style={{ width: '100%' }}
                >
                  {routesList.length > 0 ? (
                    routesList.map(r => (
                      <option key={r.code} value={r.code}>
                        {r.name} ({r.origin} ➔ {r.destination})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="ROUTE-BHONIGIR-FWD">Route 1: Bhongir to Ghatkesar School</option>
                      <option value="ROUTE-UPPAL-FWD">Route 2: Uppal to Ghatkesar School</option>
                      <option value="ROUTE-ECIL-FWD">Route 3: Ghatkesar School to ECIL</option>
                    </>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Driver Name
                  </label>
                  <input 
                    type="text"
                    placeholder=""
                    autoComplete="off"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    className="auth-input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Driver Phone
                  </label>
                  <input 
                    type="tel"
                    placeholder=""
                    autoComplete="off"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    className="auth-input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Driver Account Email (Optional)
                  </label>
                  <input 
                    type="email"
                    placeholder=""
                    autoComplete="off"
                    value={newDriverEmail}
                    onChange={(e) => setNewDriverEmail(e.target.value)}
                    className="auth-input-field"
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Creates driver login with password: driver123</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Capacity
                  </label>
                  <input 
                    type="number"
                    min="10"
                    max="80"
                    placeholder=""
                    autoComplete="off"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="auth-input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="clay-btn clay-btn-dark"
                  style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="clay-btn clay-btn-indigo"
                  style={{ flex: 2, padding: '10px', justifyContent: 'center' }}
                >
                  {isSubmitting ? 'Adding Bus...' : 'Add Bus to Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bus Detail Modal */}
      {selectedBus && (
        <BusDetailModal
          bus={selectedBus}
          onClose={() => setSelectedBus(null)}
        />
      )}
    </div>
  );
}
