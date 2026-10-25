import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Crosshair, Navigation, MapPin, School, Compass, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../config/api';
import { FORMAL_TEST_ROUTES } from '../data/formalTestData';

const SCHOOL_LOCATION = {
  lat: 17.4560,
  lng: 78.6830,
  name: 'Ghatkesar Central School (Main Campus)',
  description: 'Single Central School & Fleet Depot - Ghatkesar, Hyderabad'
};

export default function MapView({ 
  buses = [], 
  selectedBus = null, 
  onBusClick, 
  highlightStopId = null,
  highlightBusId = null 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineLayersRef = useRef({});
  const stopMarkersRef = useRef({});
  const schoolMarkerRef = useRef(null);
  const routesDataRef = useRef([]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if Leaflet was already attached to this DOM container
    if (mapContainerRef.current._leaflet_id && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Centered to view Uppal, Ghatkesar, and Bhonigir corridors
    const map = L.map(mapContainerRef.current, {
      center: [17.460, 78.720],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false
    });

    // 100% Free, high-detail OpenStreetMap tile layer (No API key required, full Telangana road details)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    // Fit bounds across all 3 school bus corridors
    map.fitBounds([[17.39, 78.54], [17.52, 78.90]], { padding: [30, 30] });

    // Repeated invalidateSize timers to guarantee complete tile coverage across grid layout
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 700);
    const t4 = setTimeout(() => map.invalidateSize(), 1500);

    // Window resize handler
    const handleWinResize = () => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    };
    window.addEventListener('resize', handleWinResize);

    // ResizeObserver ensures map is never grey or distorted
    let resizeObserver = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // 2. Add Prominent Single School Beacon Marker at Ghatkesar
    const schoolIconHtml = `
      <div class="school-campus-marker">
        <div class="school-pulse-halo"></div>
        <div class="school-icon-badge">
          🏫
        </div>
        <div class="school-label-chip">
          <span>Ghatkesar Central School</span>
        </div>
      </div>
    `;

    const schoolIcon = L.divIcon({
      html: schoolIconHtml,
      className: 'school-div-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    const schoolMarker = L.marker([SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng], { 
      icon: schoolIcon,
      zIndexOffset: 1000 
    })
      .addTo(map)
      .bindTooltip(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 6px 8px; text-align: center;">
          <strong style="color: #0f172a; font-size: 13px;">🏫 ${SCHOOL_LOCATION.name}</strong><br/>
          <span style="color: #059669; font-weight: 700; font-size: 11px;">Single Central School & Fleet Depot</span><br/>
          <small style="color: #64748b;">All buses originate and terminate here</small>
        </div>
      `, { direction: 'top', offset: [0, -20] });

    schoolMarkerRef.current = schoolMarker;

    // 3. Render Road Polylines & Stops with instant fallback
    const renderRoutes = (routesToDraw) => {
      if (!Array.isArray(routesToDraw) || !mapInstanceRef.current) return;
      routesDataRef.current = routesToDraw;

      routesToDraw.forEach(route => {
        const baseCode = (route.code || '').replace('-FWD', '').replace('-REV', '');
        if (polylineLayersRef.current[baseCode]) return;

        let routeColor = route.color || '#10b981';
        if (route.code?.includes('UPPAL')) routeColor = '#6366f1';
        if (route.code?.includes('ECIL')) routeColor = '#f59e0b';

        const latLngs = (route.polyline || []).map(p => [p.lat, p.lng]);
        if (latLngs.length === 0) return;

        // Road glow line
        const glowLine = L.polyline(latLngs, {
          color: routeColor,
          weight: 8,
          opacity: 0.3,
          smoothFactor: 1
        }).addTo(map);

        // Road core line
        const coreLine = L.polyline(latLngs, {
          color: routeColor,
          weight: 4,
          opacity: 0.9,
          smoothFactor: 1
        }).addTo(map);

        polylineLayersRef.current[baseCode] = { glowLine, coreLine, color: routeColor };

        // Stops pins
        (route.stops || []).forEach((stop, index) => {
          const stopKey = `${baseCode}_${stop.stopId}`;
          if (stopMarkersRef.current[stopKey]) return;

          const stopLat = stop.coordinates?.lat ?? stop.lat;
          const stopLng = stop.coordinates?.lng ?? stop.lng;
          if (typeof stopLat !== 'number' || typeof stopLng !== 'number') return;

          const isChildStop = highlightStopId === stop.stopId;
          const isSchoolStop = stopLat === SCHOOL_LOCATION.lat && stopLng === SCHOOL_LOCATION.lng;

          if (isSchoolStop) return; // already represented by the central school beacon

          const stopHtml = `
            <div class="clay-stop-marker ${isChildStop ? 'parent-child-stop' : ''}" id="marker-${stop.stopId}">
              ${index + 1}
            </div>
          `;

          const icon = L.divIcon({
            html: stopHtml,
            className: 'custom-stop-div-icon',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });

          const marker = L.marker([stopLat, stopLng], { icon })
            .addTo(map)
            .bindTooltip(`
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px 6px;">
                <strong style="color: #0f172a; font-size: 12px;">${stop.name}</strong><br/>
                <span style="color: #4f46e5; font-size: 11px; font-weight: 700;">Stop #${stop.sequence || index + 1}</span> &bull; 
                <small style="color: #64748b;">${stop.landmark || route.name}</small>
              </div>
            `, { direction: 'top', offset: [0, -10] });

          stopMarkersRef.current[stopKey] = marker;
        });
      });
    };

    // Draw instant formal test routes first so map is immediately populated
    renderRoutes(FORMAL_TEST_ROUTES);

    // Then attempt API fetch to get live/Atlas geometry
    fetch(apiUrl('/api/routes'))
      .then(r => r.json())
      .then(routes => {
        if (Array.isArray(routes) && routes.length > 0) {
          renderRoutes(routes);
        }
      })
      .catch(err => console.log('Using default formal routes for map.'));

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', handleWinResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = {};
      polylineLayersRef.current = {};
      stopMarkersRef.current = {};
      schoolMarkerRef.current = null;
    };
  }, []);

  // 4. Update Bus Markers with heading rotation and stop indicators
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !buses || buses.length === 0) return;

    buses.forEach(bus => {
      const loc = bus.lastLocation;
      if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return;

      const isCurrentSelected = selectedBus?._id === bus._id;
      const isParentChildBus = highlightBusId === bus._id;
      const heading = loc.heading || 0;
      const isAtStop = loc.isDwell || bus.status === 'stopped';

      // Custom Clay Bus HTML Marker with dynamic stop badge
      const busMarkerHtml = `
        <div class="bus-marker-pin ${isCurrentSelected ? 'selected' : ''} ${isParentChildBus ? 'parent-bus' : ''}" style="transform: rotate(${heading}deg);">
          <div class="bus-marker-pulse"></div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
          <div class="bus-marker-badge" style="transform: rotate(${-heading}deg) translateX(-50%);">
            ${bus.busNumber} ${isAtStop ? '🛑' : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: busMarkerHtml,
        className: 'clay-bus-marker-icon',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const tooltipContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; min-width: 170px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13px;">${bus.busNumber}</strong>
            <span style="font-family: monospace; font-size: 10px; color: #b45309; font-weight: 700;">${bus.plateNumber}</span>
          </div>
          <div style="color: #047857; font-weight: 700; margin-bottom: 2px;">
            ${isAtStop ? `🛑 Stopped at: ${loc.currentStopName || loc.nextStopName}` : `📍 Next: ${loc.nextStopName || 'En route'}`}
          </div>
          <div style="color: #64748b; font-size: 11px;">
            <span>ETA: ${loc.etaMinutes || 1} min &bull; Speed: ${loc.speed || 0} km/h</span><br/>
            <span>School: Ghatkesar Campus</span>
          </div>
        </div>
      `;

      if (markersRef.current[bus._id]) {
        const marker = markersRef.current[bus._id];
        marker.setLatLng([loc.lat, loc.lng]);
        marker.setIcon(customIcon);
        marker.setTooltipContent(tooltipContent);
      } else {
        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon, zIndexOffset: 800 })
          .addTo(map)
          .on('click', () => {
            if (onBusClick) onBusClick(bus);
          });

        marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -18] });
        markersRef.current[bus._id] = marker;
      }
    });
  }, [buses, selectedBus, highlightBusId]);

  // 5. Center on Selected Bus if chosen
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedBus?.lastLocation) return;
    const { lat, lng } = selectedBus.lastLocation;
    if (typeof lat === 'number' && typeof lng === 'number') {
      map.flyTo([lat, lng], 14, { duration: 1.2 });
    }
  }, [selectedBus]);

  // Quick Map Navigation
  const focusSchool = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng], 14, { duration: 1 });
    }
  };

  const focusBhongir = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([17.485, 78.785], 11.5, { duration: 1 });
    }
  };

  const focusUppal = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([17.430, 78.620], 12, { duration: 1 });
    }
  };

  const focusECIL = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([17.475, 78.600], 12.5, { duration: 1 });
    }
  };

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.fitBounds([[17.39, 78.54], [17.52, 78.90]], { padding: [30, 30] });
    }
  };

  return (
    <div className="map-container-wrapper">
      <div 
        ref={mapContainerRef} 
        className="leaflet-map street-map-tiles" 
      />

      {/* Floating Quick Navigation & Legend */}
      <div className="map-floating-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Central School Fleet
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              className="clay-btn clay-btn-dark" 
              style={{ padding: '3px 8px', fontSize: '0.7rem' }}
              onClick={handleRecenter}
              title="Fit Full Corridor View"
            >
              <Crosshair size={11} /> Reset
            </button>
          </div>
        </div>

        {/* Central School Header */}
        <div 
          onClick={focusSchool}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', 
            background: 'rgba(251, 191, 36, 0.12)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)',
            cursor: 'pointer', transition: 'all 0.2s ease'
          }}
          title="Click to zoom to School Campus in Ghatkesar"
        >
          <span style={{ fontSize: '1rem' }}>🏫</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#fbbf24' }}>Ghatkesar Campus</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Single Central School & Depot</span>
          </div>
        </div>

        {/* Routes Quick Jumps & Legend */}
        <div className="map-legend-item" onClick={focusBhongir} style={{ cursor: 'pointer' }} title="Focus Bhonigir Corridor">
          <div className="legend-line" style={{ background: '#10b981' }}></div>
          <span>Route 1: Ghatkesar &harr; Bhongir</span>
        </div>

        <div className="map-legend-item" onClick={focusUppal} style={{ cursor: 'pointer' }} title="Focus Uppal Corridor">
          <div className="legend-line" style={{ background: '#6366f1' }}></div>
          <span>Route 2: Ghatkesar &harr; Uppal</span>
        </div>

        <div className="map-legend-item" onClick={focusECIL} style={{ cursor: 'pointer' }} title="Focus ECIL Corridor">
          <div className="legend-line" style={{ background: '#f59e0b' }}></div>
          <span>Route 3: Ghatkesar &harr; ECIL</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#fbbf24' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="clay-pulse-dot yellow"></span>
            <span>{buses.length} Buses Moving</span>
          </div>
          <span style={{ color: '#34d399', fontSize: '0.7rem', fontWeight: '700' }}>● Live</span>
        </div>
      </div>
    </div>
  );
}
