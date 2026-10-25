const fs = require('fs');
const path = require('path');

const RAW_ROUTES = [
  // 1. Ghatkesar School <-> Bhongir (Bhonigir)
  {
    name: 'Route 1: Ghatkesar School to Bhongir',
    code: 'ROUTE-BHONIGIR-FWD',
    origin: 'Ghatkesar School Campus',
    destination: 'Bhongir',
    direction: 'forward',
    pairedRouteCode: 'ROUTE-BHONIGIR-REV',
    stops: [
      { stopId: 'ST-BG1', name: 'School Campus (Ghatkesar)', coordinates: { lat: 17.4560, lng: 78.6830 }, sequence: 1, landmark: 'Schoolway Central Campus Gate' },
      { stopId: 'ST-BG2', name: 'Ghatkesar RTC Bus Stand', coordinates: { lat: 17.4510, lng: 78.6855 }, sequence: 2, landmark: 'Ghatkesar Town Center' },
      { stopId: 'ST-BG3', name: 'Kondamadugu X Roads', coordinates: { lat: 17.4680, lng: 78.7420 }, sequence: 3, landmark: 'Warangal Highway NH-163' },
      { stopId: 'ST-BG4', name: 'Bibinagar AIIMS & Junction', coordinates: { lat: 17.4770, lng: 78.7930 }, sequence: 4, landmark: 'Bibinagar Flyover / Hospital' },
      { stopId: 'ST-BG5', name: 'Pagidipalli Junction', coordinates: { lat: 17.4920, lng: 78.8450 }, sequence: 5, landmark: 'Pagidipalli Station Road' },
      { stopId: 'ST-BG6', name: 'Bhongir Bypass', coordinates: { lat: 17.5050, lng: 78.8780 }, sequence: 6, landmark: 'Bhongir Town Approach' },
      { stopId: 'ST-BG7', name: 'Bhongir Bus Station & Fort', coordinates: { lat: 17.5120, lng: 78.8920 }, sequence: 7, landmark: 'Bhongir RTC Central Depot' }
    ]
  },
  {
    name: 'Route 1: Bhongir to Ghatkesar School',
    code: 'ROUTE-BHONIGIR-REV',
    origin: 'Bhongir',
    destination: 'Ghatkesar School Campus',
    direction: 'reverse',
    pairedRouteCode: 'ROUTE-BHONIGIR-FWD',
    stops: [
      { stopId: 'ST-BGR1', name: 'Bhongir Bus Station & Fort', coordinates: { lat: 17.5120, lng: 78.8920 }, sequence: 1, landmark: 'Bhongir RTC Central Depot' },
      { stopId: 'ST-BGR2', name: 'Bhongir Bypass', coordinates: { lat: 17.5050, lng: 78.8780 }, sequence: 2, landmark: 'Bhongir Town Approach' },
      { stopId: 'ST-BGR3', name: 'Pagidipalli Junction', coordinates: { lat: 17.4920, lng: 78.8450 }, sequence: 3, landmark: 'Pagidipalli Station Road' },
      { stopId: 'ST-BGR4', name: 'Bibinagar AIIMS & Junction', coordinates: { lat: 17.4770, lng: 78.7930 }, sequence: 4, landmark: 'Bibinagar Flyover / Hospital' },
      { stopId: 'ST-BGR5', name: 'Kondamadugu X Roads', coordinates: { lat: 17.4680, lng: 78.7420 }, sequence: 5, landmark: 'Warangal Highway NH-163' },
      { stopId: 'ST-BGR6', name: 'Ghatkesar RTC Bus Stand', coordinates: { lat: 17.4510, lng: 78.6855 }, sequence: 6, landmark: 'Ghatkesar Town Center' },
      { stopId: 'ST-BGR7', name: 'School Campus (Ghatkesar)', coordinates: { lat: 17.4560, lng: 78.6830 }, sequence: 7, landmark: 'Schoolway Central Campus Gate' }
    ]
  },
  // 2. Ghatkesar School <-> Uppal
  {
    name: 'Route 2: Ghatkesar School to Uppal',
    code: 'ROUTE-UPPAL-FWD',
    origin: 'Ghatkesar School Campus',
    destination: 'Uppal',
    direction: 'forward',
    pairedRouteCode: 'ROUTE-UPPAL-REV',
    stops: [
      { stopId: 'ST-UP1', name: 'School Campus (Ghatkesar)', coordinates: { lat: 17.4560, lng: 78.6830 }, sequence: 1, landmark: 'Schoolway Central Campus Gate' },
      { stopId: 'ST-UP2', name: 'Pocharam Infosys SEZ', coordinates: { lat: 17.4430, lng: 78.6470 }, sequence: 2, landmark: 'Infosys Gate 1' },
      { stopId: 'ST-UP3', name: 'Narapally Junction', coordinates: { lat: 17.4260, lng: 78.6180 }, sequence: 3, landmark: 'Vignan College Stop' },
      { stopId: 'ST-UP4', name: 'Medipally', coordinates: { lat: 17.4180, lng: 78.6010 }, sequence: 4, landmark: 'Medipally Police Station' },
      { stopId: 'ST-UP5', name: 'Peerzadiguda', coordinates: { lat: 17.4120, lng: 78.5830 }, sequence: 5, landmark: 'Peerzadiguda Kaman' },
      { stopId: 'ST-UP6', name: 'Boduppal X Roads', coordinates: { lat: 17.4085, lng: 78.5710 }, sequence: 6, landmark: 'Boduppal Arch' },
      { stopId: 'ST-UP7', name: 'Uppal Ring Road & Metro', coordinates: { lat: 17.4058, lng: 78.5591 }, sequence: 7, landmark: 'Uppal Metro Station' }
    ]
  },
  {
    name: 'Route 2: Uppal to Ghatkesar School',
    code: 'ROUTE-UPPAL-REV',
    origin: 'Uppal',
    destination: 'Ghatkesar School Campus',
    direction: 'reverse',
    pairedRouteCode: 'ROUTE-UPPAL-FWD',
    stops: [
      { stopId: 'ST-UPR1', name: 'Uppal Ring Road & Metro', coordinates: { lat: 17.4058, lng: 78.5591 }, sequence: 1, landmark: 'Uppal Metro Station' },
      { stopId: 'ST-UPR2', name: 'Boduppal X Roads', coordinates: { lat: 17.4085, lng: 78.5710 }, sequence: 2, landmark: 'Boduppal Arch' },
      { stopId: 'ST-UPR3', name: 'Peerzadiguda', coordinates: { lat: 17.4120, lng: 78.5830 }, sequence: 3, landmark: 'Peerzadiguda Kaman' },
      { stopId: 'ST-UPR4', name: 'Medipally', coordinates: { lat: 17.4180, lng: 78.6010 }, sequence: 4, landmark: 'Medipally Police Station' },
      { stopId: 'ST-UPR5', name: 'Narapally Junction', coordinates: { lat: 17.4260, lng: 78.6180 }, sequence: 5, landmark: 'Vignan College Stop' },
      { stopId: 'ST-UPR6', name: 'Pocharam Infosys SEZ', coordinates: { lat: 17.4430, lng: 78.6470 }, sequence: 6, landmark: 'Infosys Gate 1' },
      { stopId: 'ST-UPR7', name: 'School Campus (Ghatkesar)', coordinates: { lat: 17.4560, lng: 78.6830 }, sequence: 7, landmark: 'Schoolway Central Campus Gate' }
    ]
  },
  // 3. Ghatkesar School <-> ECIL
  {
    name: 'Route 3: Ghatkesar School to ECIL',
    code: 'ROUTE-ECIL-FWD',
    origin: 'Ghatkesar School Campus',
    destination: 'ECIL',
    direction: 'forward',
    pairedRouteCode: 'ROUTE-ECIL-REV',
    stops: [
      { stopId: 'ST-EC1', name: 'School Campus (Ghatkesar)', coordinates: { lat: 17.4560, lng: 78.6830 }, sequence: 1, landmark: 'Schoolway Central Campus Gate' },
      { stopId: 'ST-EC2', name: 'Ghatkesar ORR Junction', coordinates: { lat: 17.4480, lng: 78.6650 }, sequence: 2, landmark: 'ORR Exit 9' },
      { stopId: 'ST-EC3', name: 'Rampally X Roads', coordinates: { lat: 17.4650, lng: 78.6320 }, sequence: 3, landmark: 'Rampally Junction' },
      { stopId: 'ST-EC4', name: 'Nagaram Junction', coordinates: { lat: 17.4810, lng: 78.5980 }, sequence: 4, landmark: 'Nagaram Main Road' },
      { stopId: 'ST-EC5', name: 'Dammaiguda Circle', coordinates: { lat: 17.4920, lng: 78.5790 }, sequence: 5, landmark: 'Dammaiguda Arch' },
      { stopId: 'ST-EC6', name: 'ECIL X Roads & Depot', coordinates: { lat: 17.4735, lng: 78.5685 }, sequence: 6, landmark: 'ECIL Bus Station' }
    ]
  },
  {
    name: 'Route 3: ECIL to Ghatkesar School',
    code: 'ROUTE-ECIL-REV',
    origin: 'ECIL',
    destination: 'Ghatkesar School Campus',
    direction: 'reverse',
    pairedRouteCode: 'ROUTE-ECIL-FWD',
    stops: [
      { stopId: 'ST-ECR1', name: 'ECIL X Roads & Depot', coordinates: { lat: 17.4735, lng: 78.5685 }, sequence: 1, landmark: 'ECIL Bus Station' },
      { stopId: 'ST-ECR2', name: 'Dammaiguda Circle', coordinates: { lat: 17.4920, lng: 78.5790 }, sequence: 2, landmark: 'Dammaiguda Arch' },
      { stopId: 'ST-ECR3', name: 'Nagaram Junction', coordinates: { lat: 17.4810, lng: 78.5980 }, sequence: 3, landmark: 'Nagaram Main Road' },
      { stopId: 'ST-ECR4', name: 'Rampally X Roads', coordinates: { lat: 17.4650, lng: 78.6320 }, sequence: 4, landmark: 'Rampally Junction' },
      { stopId: 'ST-ECR5', name: 'Ghatkesar ORR Junction', coordinates: { lat: 17.4480, lng: 78.6650 }, sequence: 5, landmark: 'ORR Exit 9' },
      { stopId: 'ST-ECR6', name: 'School Campus (Ghatkesar)', coordinates: { lat: 17.4560, lng: 78.6830 }, sequence: 6, landmark: 'Schoolway Central Campus Gate' }
    ]
  }
];

// Distance helper
function distanceMeters(p1, p2) {
  const R = 6371000;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find closest polyline index for each stop
function mapStopsToPolyline(stops, polyline) {
  return stops.map(stop => {
    let closestIndex = 0;
    let minDistance = Infinity;
    polyline.forEach((pt, idx) => {
      const d = distanceMeters(stop.coordinates, pt);
      if (d < minDistance) {
        minDistance = d;
        closestIndex = idx;
      }
    });
    return {
      ...stop,
      polyIndex: closestIndex
    };
  });
}

async function fetchRouteFromOSRM(stops) {
  const coordString = stops.map(s => `${s.coordinates.lng},${s.coordinates.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`OSRM HTTP error: ${resp.status}`);
  }
  const data = await resp.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error(`No route found in OSRM response`);
  }

  const routeData = data.routes[0];
  const polyline = routeData.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
  return {
    polyline,
    distanceKm: parseFloat((routeData.distance / 1000).toFixed(2)),
    durationMinutes: Math.round(routeData.duration / 60)
  };
}

async function generateAllRoutes() {
  console.log('[RouteGenerator] Fetching road-following geometry from OSRM for all routes...');
  const compiledRoutes = [];

  for (const rawRoute of RAW_ROUTES) {
    try {
      console.log(`[RouteGenerator] Fetching OSRM road geometry for: ${rawRoute.name}...`);
      const { polyline, distanceKm, durationMinutes } = await fetchRouteFromOSRM(rawRoute.stops);
      const stopsWithPolyIndex = mapStopsToPolyline(rawRoute.stops, polyline);

      compiledRoutes.push({
        ...rawRoute,
        distanceKm,
        durationMinutes,
        stops: stopsWithPolyIndex,
        polyline
      });
      console.log(`  -> ${rawRoute.code}: ${polyline.length} road-snapped points, ${distanceKm} km, ~${durationMinutes} mins.`);
      // Small pause to be gentle with public OSRM server
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`  -> Failed fetching OSRM for ${rawRoute.code}: ${err.message}`);
      throw err;
    }
  }

  const outputPath = path.join(__dirname, 'routes.json');
  fs.writeFileSync(outputPath, JSON.stringify(compiledRoutes, null, 2), 'utf8');
  console.log(`[RouteGenerator] Successfully wrote road-snapped routes to ${outputPath}`);
  return compiledRoutes;
}

if (require.main === module) {
  generateAllRoutes()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { RAW_ROUTES, generateAllRoutes, mapStopsToPolyline };
