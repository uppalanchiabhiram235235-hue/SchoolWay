import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import MapView from '../components/MapView';
import BusCard from '../components/BusCard';
import BusDetailModal from '../components/BusDetailModal';
import { Bus, Navigation, Filter, Radio } from 'lucide-react';

export default function LiveBusesPage() {
  const { buses } = useSocket();
  const [selectedBus, setSelectedBus] = useState(null);
  const [modalBus, setModalBus] = useState(null);
  const [routeFilter, setRouteFilter] = useState('ALL');

  const filteredBuses = buses.filter(b => {
    if (routeFilter === 'ALL') return true;
    const code = (b.routeCode || b.route?.code || '').toUpperCase();
    const name = (b.route?.name || '').toUpperCase();
    const num = (b.busNumber || '').toUpperCase();

    if (routeFilter === 'ROUTE-BHONIGIR') {
      return code.includes('BHONIGIR') || name.includes('BHONIGIR') || name.includes('BHONGIR') || num === 'SW-01' || num === 'SW-02';
    }
    if (routeFilter === 'ROUTE-UPPAL') {
      return code.includes('UPPAL') || name.includes('UPPAL') || num === 'SW-03' || num === 'SW-04';
    }
    if (routeFilter === 'ROUTE-ECIL') {
      return code.includes('ECIL') || name.includes('ECIL') || num === 'SW-05' || num === 'SW-06';
    }
    return true;
  });

  return (
    <div className="live-layout">
      {/* Left Sidebar Panel */}
      <aside className="sidebar-panel">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                Ghatkesar School Fleet
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Single Central School at Ghatkesar &bull; Live Stops
              </p>
            </div>
            <div className="clay-badge clay-badge-emerald">
              <span className="clay-pulse-dot emerald"></span>
              {buses.length} Running
            </div>
          </div>

          {/* Quick Stats Chips */}
          <div className="fleet-stat-chips">
            <div className="stat-chip">
              <div className="number">1</div>
              <div className="label">School (Ghatkesar)</div>
            </div>
            <div className="stat-chip">
              <div className="number">{buses.length}</div>
              <div className="label">Live Buses</div>
            </div>
            <div className="stat-chip">
              <div className="number">3</div>
              <div className="label">Destinations</div>
            </div>
          </div>
        </div>

        {/* Route Filter Tabs */}
        <div className="route-filter-bar">
          <button 
            className={`filter-tab ${routeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setRouteFilter('ALL')}
          >
            All Fleet ({buses.length})
          </button>
          <button 
            className={`filter-tab ${routeFilter === 'ROUTE-BHONIGIR' ? 'active' : ''}`}
            onClick={() => setRouteFilter('ROUTE-BHONIGIR')}
          >
            Ghatkesar &harr; Bhonigir
          </button>
          <button 
            className={`filter-tab ${routeFilter === 'ROUTE-UPPAL' ? 'active' : ''}`}
            onClick={() => setRouteFilter('ROUTE-UPPAL')}
          >
            Ghatkesar &harr; Uppal
          </button>
          <button 
            className={`filter-tab ${routeFilter === 'ROUTE-ECIL' ? 'active' : ''}`}
            onClick={() => setRouteFilter('ROUTE-ECIL')}
          >
            Ghatkesar &harr; ECIL
          </button>
        </div>

        {/* Scrollable Bus Cards */}
        <div className="bus-list-scroll">
          {filteredBuses.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No buses found matching filter.
            </div>
          ) : (
            filteredBuses.map(bus => (
              <BusCard
                key={bus._id}
                bus={bus}
                isSelected={selectedBus?._id === bus._id}
                onClick={(b) => {
                  setSelectedBus(b);
                  setModalBus(b);
                }}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Map View */}
      <main style={{ height: '100%', position: 'relative' }}>
        <MapView 
          buses={buses}
          selectedBus={selectedBus}
          onBusClick={(b) => {
            setSelectedBus(b);
            setModalBus(b);
          }}
        />
      </main>

      {/* Bus Detail Modal */}
      {modalBus && (
        <BusDetailModal 
          bus={modalBus}
          onClose={() => setModalBus(null)}
          onFocusMap={(b) => setSelectedBus(b)}
        />
      )}
    </div>
  );
}
