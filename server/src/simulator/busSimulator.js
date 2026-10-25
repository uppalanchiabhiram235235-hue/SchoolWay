const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const GpsPoint = require('../models/GpsPoint');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { seedDatabase } = require('../seed/seed');

// Helper to calculate distance in meters
function distanceMeters(p1, p2) {
  if (!p1 || !p2) return 0;
  const R = 6371000;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate bearing/heading in degrees
function calculateHeading(p1, p2) {
  if (!p1 || !p2) return 0;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const lat1 = p1.lat * Math.PI / 180;
  const lat2 = p2.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return Math.round((brng + 360) % 360);
}

class BusSimulator {
  constructor() {
    this.mode = 'live';
    this.intervalId = null;
    this.io = null;
    this.routesCache = {};
    this.notifiedStops = new Set(); // track notified approaching/arrived per trip
    this.isRunning = false;
  }

  getMode() {
    return 'live';
  }

  setMode(newMode, io = null) {
    this.mode = 'live';
    console.log(`[Simulator] Running in continuous LIVE mode.`);
    if (io || this.io) {
      (io || this.io).emit('simulator:mode_changed', { mode: 'live' });
    }
  }

  getIntervalMs() {
    // Continuous live GPS point stream every 3 seconds
    return 3000;
  }

  async init(io) {
    this.io = io;
    console.log(`[Simulator] Initializing SchoolWay Bus Simulator (Mode: ${this.mode.toUpperCase()})...`);

    // Ensure database has default routes & buses
    const busCount = await Bus.countDocuments();
    if (busCount === 0) {
      console.log('[Simulator] No buses found! Running initial seed so app is never empty...');
      await seedDatabase(true);
    }

    // Cache routes
    const routes = await Route.find();
    routes.forEach(r => {
      this.routesCache[r.code] = r;
    });
    console.log(`[Simulator] Cached ${Object.keys(this.routesCache).length} route geometries.`);

    // Resume buses - calculate elapsed positions if server was restarted
    await this.resumeAllBuses();

    this.startLoop();
    this.isRunning = true;
  }

  async resumeAllBuses() {
    const buses = await Bus.find();
    for (const bus of buses) {
      const route = this.routesCache[bus.routeCode];
      if (!route || !route.polyline || route.polyline.length === 0) continue;

      const poly = route.polyline;
      let polyIdx = bus.simulationState?.polyIndex || 0;
      if (polyIdx >= poly.length) polyIdx = 0;

      const currPt = poly[polyIdx];
      const nextPt = poly[Math.min(polyIdx + 1, poly.length - 1)] || currPt;
      const heading = calculateHeading(currPt, nextPt);

      bus.simulationState = {
        ...bus.simulationState,
        polyIndex: polyIdx,
        subPolyIndex: polyIdx,
        isDwell: false,
        dwellUntil: null
      };

      bus.lastLocation = {
        ...bus.lastLocation,
        lat: currPt.lat,
        lng: currPt.lng,
        heading,
        lastUpdated: new Date()
      };
      await bus.save();
    }
    console.log('[Simulator] All default buses ready and resumed.');
  }

  restartLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.startLoop();
  }

  startLoop() {
    const intervalMs = this.getIntervalMs();
    console.log(`[Simulator] Loop active with interval: ${intervalMs / 1000}s`);

    this.intervalId = setInterval(async () => {
      try {
        await this.tick();
      } catch (err) {
        console.error('[Simulator] Error in simulation tick:', err.message);
      }
    }, intervalMs);
  }

  async tick() {
    const buses = await Bus.find();
    for (const bus of buses) {
      // If a real driver has taken control, skip simulator
      if (bus.activeTripSource === 'driver') {
        continue;
      }
      await this.advanceBus(bus);
    }
  }

  async advanceBus(bus) {
    let route = this.routesCache[bus.routeCode];
    if (!route) {
      route = await Route.findOne({ code: bus.routeCode });
      if (route) this.routesCache[bus.routeCode] = route;
      else return;
    }

    const polyline = route.polyline;
    const totalPoints = polyline.length;
    let simState = bus.simulationState || { polyIndex: 0, subPolyIndex: 0, isDwell: false, dwellUntil: null };

    // Initialize subPolyIndex if missing
    if (typeof simState.subPolyIndex !== 'number' || isNaN(simState.subPolyIndex)) {
      simState.subPolyIndex = simState.polyIndex || 0;
    }

    // 1. Check if bus is currently dwelling at a stop
    if (simState.isDwell && simState.dwellUntil) {
      if (new Date() < new Date(simState.dwellUntil)) {
        // Still dwelling at stop for boarding
        return;
      } else {
        // Dwell finished, resume moving
        simState.isDwell = false;
        simState.dwellUntil = null;
      }
    }

    const stops = route.stops || [];
    const currentPolyIndex = Math.min(Math.floor(simState.subPolyIndex), totalPoints - 1);

    // Identify next upcoming stop and previous stop passed
    let nextStop = stops.find(s => s.polyIndex > currentPolyIndex) || stops[stops.length - 1];
    let prevStop = [...stops].reverse().find(s => s.polyIndex <= currentPolyIndex) || stops[0];

    // Calculate natural travel duration based on real distance between stops:
    // Distance rule: 2 min to 3 min for normal stops, 5 min if distance between stops is far (>3.2 km)
    let segmentDist = 2000;
    if (prevStop && nextStop && prevStop.stopId !== nextStop.stopId) {
      segmentDist = Math.round(distanceMeters(prevStop.coordinates, nextStop.coordinates));
    } else if (nextStop) {
      segmentDist = Math.round(distanceMeters(polyline[currentPolyIndex], nextStop.coordinates));
    }

    let targetDurationSec = 180; // default 3 min
    if (segmentDist <= 1800) {
      targetDurationSec = 120; // 2 min for close stops (<1.8 km)
    } else if (segmentDist <= 3200) {
      targetDurationSec = 180; // 3 min for moderate stops (1.8 - 3.2 km)
    } else {
      targetDurationSec = 300; // 5 min for far stops (>3.2 km)
    }

    // Occasional traffic delay event (5% chance adds 2 min)
    let isDelayed = false;
    if (Math.random() < 0.05 && bus.status !== 'delayed') {
      isDelayed = true;
      targetDurationSec += 120;
      this.triggerDelayNotification(bus);
    }

    // 2. Advance smoothly along road geometry
    const tickIntervalSec = 3.0; // 3s telemetry interval
    const segmentPoints = Math.max(1, (nextStop ? nextStop.polyIndex : totalPoints) - (prevStop ? prevStop.polyIndex : 0));
    const segmentTicks = Math.max(1, Math.round(targetDurationSec / tickIntervalSec));
    const step = segmentPoints / segmentTicks;

    simState.subPolyIndex += step;
    let newPolyIndex = Math.min(Math.floor(simState.subPolyIndex), totalPoints - 1);
    simState.polyIndex = newPolyIndex;

    // Realistic vehicle speed in km/h based on distance and duration
    let baseSpeed = Math.round((segmentDist / targetDurationSec) * 3.6);
    baseSpeed = Math.max(25, Math.min(58, baseSpeed + (Math.floor(Math.random() * 5) - 2)));

    // 3. Check if reached destination (end of route)
    if (newPolyIndex >= totalPoints - 1) {
      // Reached destination terminus!
      const pairedCode = route.pairedRouteCode || (route.direction === 'forward' ? route.code.replace('FWD', 'REV') : route.code.replace('REV', 'FWD'));
      const pairedRoute = this.routesCache[pairedCode] || await Route.findOne({ code: pairedCode });

      // End current simulated trip
      if (bus.currentTripId) {
        await Trip.findByIdAndUpdate(bus.currentTripId, {
          status: 'completed',
          endTime: new Date()
        });
      }

      this.triggerTripEndedNotification(bus, route);

      // Mark onboard students on this bus as dropped safely
      try {
        const onboardStudents = await Student.find({
          $or: [{ busId: bus._id }, { busNumber: bus.busNumber }],
          status: 'boarded'
        });
        for (const student of onboardStudents) {
          student.status = 'dropped';
          student.lastStatusUpdate = new Date();
          await student.save();

          const dropNotif = await Notification.create({
            title: 'Child Dropped Safely',
            message: `${student.name} (${student.grade}-${student.section}) has arrived safely at destination via Bus ${bus.busNumber}.`,
            type: 'student_dropped',
            busId: bus._id,
            busNumber: bus.busNumber,
            studentId: student._id,
            studentName: student.name,
            stopName: route.destination || 'School Campus',
            recipientRole: 'parent',
            recipientId: student.parentId,
            timestamp: new Date()
          });

          if (this.io) {
            this.io.to('fleet:all').emit('notification:new', dropNotif);
            if (student.parentId) {
              this.io.to(`parent:${student.parentId}`).emit('notification:new', dropNotif);
            }
            this.io.to('fleet:all').emit('student:status_updated', student);
          }
        }

        // Reset dropped students for the next route cycle after brief interval
        setTimeout(async () => {
          try {
            await Student.updateMany(
              { $or: [{ busId: bus._id }, { busNumber: bus.busNumber }], status: 'dropped' },
              { status: 'waiting', lastStatusUpdate: new Date() }
            );
          } catch (e) {
            console.error('Error resetting student status cycle:', e);
          }
        }, 20000);
      } catch (err) {
        console.error('Error processing student dropoff:', err);
      }

      if (pairedRoute) {
        bus.routeId = pairedRoute._id;
        bus.routeCode = pairedRoute.code;
        simState.polyIndex = 0;
        simState.subPolyIndex = 0;
        simState.isDwell = true;
        // Dwell at terminus before starting return trip (25s)
        const terminusWaitMs = 25000;
        simState.dwellUntil = new Date(Date.now() + terminusWaitMs);

        // Start new trip for reverse route
        const newTrip = await Trip.create({
          busId: bus._id,
          busNumber: bus.busNumber,
          routeId: pairedRoute._id,
          routeCode: pairedRoute.code,
          routeName: pairedRoute.name,
          driverId: bus.driverId,
          source: 'simulated',
          status: 'in_progress',
          startTime: new Date(),
          currentSpeed: baseSpeed,
          stopsCompleted: []
        });
        bus.currentTripId = newTrip._id;
        this.triggerTripStartNotification(bus, pairedRoute);
      } else {
        // Loop back
        simState.polyIndex = 0;
        simState.subPolyIndex = 0;
      }

      bus.simulationState = simState;
      await bus.save();
      return;
    }

    // Normal progression along polyline
    const currentCoord = polyline[newPolyIndex];
    const nextCoord = polyline[Math.min(newPolyIndex + 1, totalPoints - 1)];
    const heading = calculateHeading(currentCoord, nextCoord);

    // 4. Check stops along the route with natural ETA calculation
    let currentStop = null;
    let lastStop = prevStop;

    let distToNextStop = 0;
    let etaMinutes = 1;

    if (nextStop) {
      distToNextStop = Math.round(distanceMeters(currentCoord, nextStop.coordinates));

      // Calculate ETA directly from progress towards next stop
      const remainingPoints = Math.max(0, nextStop.polyIndex - simState.subPolyIndex);
      const remainingSec = Math.round((remainingPoints / segmentPoints) * targetDurationSec);
      etaMinutes = Math.max(1, Math.ceil(remainingSec / 60));

      const stopKey = `${bus.busNumber}:${bus.routeCode}:${nextStop.stopId}`;

      // Check ARRIVAL at stop (within 40m or reached stop polyIndex)
      if ((distToNextStop <= 40 || newPolyIndex >= nextStop.polyIndex) && !simState.isDwell) {
        // Arrived at stop! Snap position directly to stop & dwell for natural student boarding
        newPolyIndex = nextStop.polyIndex;
        simState.subPolyIndex = nextStop.polyIndex;
        simState.polyIndex = nextStop.polyIndex;
        simState.isDwell = true;
        currentStop = nextStop;

        const dwellDurationMs = 25000; // 25s natural boarding dwell
        simState.dwellUntil = new Date(Date.now() + dwellDurationMs);
        baseSpeed = 0;
        etaMinutes = 0;

        // Trigger arrival notification & update students
        this.handleStopArrival(bus, nextStop);
      } else if (distToNextStop <= 450 && !this.notifiedStops.has(`appr:${stopKey}`)) {
        // Approaching stop notification
        this.notifiedStops.add(`appr:${stopKey}`);
        this.triggerApproachingNotification(bus, nextStop, etaMinutes);
      }
    }

    if (simState.isDwell && nextStop) {
      currentStop = nextStop;
      baseSpeed = 0;
      etaMinutes = 0;
    }

    const completedStopsList = stops.filter(s => s.polyIndex < newPolyIndex).map(s => s.stopId);

    // 5. Update bus record
    bus.lastLocation = {
      lat: currentCoord.lat,
      lng: currentCoord.lng,
      heading,
      speed: baseSpeed,
      currentStopId: currentStop ? currentStop.stopId : '',
      currentStopName: currentStop ? currentStop.name : '',
      lastStopName: lastStop ? lastStop.name : (stops[0]?.name || ''),
      nextStopId: nextStop ? nextStop.stopId : '',
      nextStopName: nextStop ? nextStop.name : '',
      etaMinutes,
      distanceToNextStopMeters: distToNextStop,
      isDwell: simState.isDwell,
      dwellUntil: simState.dwellUntil,
      stopsCompleted: completedStopsList,
      totalStops: stops.length,
      currentStopSequence: currentStop ? currentStop.sequence : (lastStop ? lastStop.sequence : 1),
      lastUpdated: new Date()
    };
    bus.status = isDelayed ? 'delayed' : (simState.isDwell ? 'stopped' : 'in_transit');
    bus.simulationState = simState;

    await bus.save();

    // 6. Record GpsPoint history
    await GpsPoint.create({
      busId: bus._id,
      tripId: bus.currentTripId,
      lat: currentCoord.lat,
      lng: currentCoord.lng,
      speed: baseSpeed,
      heading,
      source: 'simulated',
      timestamp: new Date()
    });

    // 7. Emit real-time Socket.IO update
    if (this.io) {
      const payload = {
        busId: bus._id,
        busNumber: bus.busNumber,
        plateNumber: bus.plateNumber,
        routeCode: bus.routeCode,
        routeName: route.name,
        lat: currentCoord.lat,
        lng: currentCoord.lng,
        heading,
        speed: baseSpeed,
        currentStopId: currentStop ? currentStop.stopId : '',
        currentStopName: currentStop ? currentStop.name : '',
        lastStopName: lastStop ? lastStop.name : '',
        nextStopId: nextStop ? nextStop.stopId : '',
        nextStopName: nextStop ? nextStop.name : '',
        etaMinutes,
        distanceToNextStopMeters: distToNextStop,
        isDwell: simState.isDwell,
        dwellUntil: simState.dwellUntil,
        stopsCompleted: completedStopsList,
        totalStops: stops.length,
        currentStopSequence: currentStop ? currentStop.sequence : (lastStop ? lastStop.sequence : 1),
        status: bus.status,
        lastUpdated: bus.lastLocation.lastUpdated
      };

      // Broadcast to bus specific room and global fleet room
      this.io.to(`bus:${bus._id}`).emit('bus:location_update', payload);
      this.io.to('fleet:all').emit('bus:location_update', payload);
    }
  }

  async handleStopArrival(bus, stop) {
    // 1. Create notification
    const notif = await Notification.create({
      title: 'Arrived at Stop',
      message: `Bus ${bus.busNumber} has arrived at ${stop.name}.`,
      type: 'arrived_stop',
      busId: bus._id,
      busNumber: bus.busNumber,
      stopName: stop.name,
      recipientRole: 'all',
      timestamp: new Date()
    });

    // 2. Mark students assigned to this stop as boarded
    const studentsAtStop = await Student.find({ 
      $or: [{ busId: bus._id }, { busNumber: bus.busNumber }], 
      stopId: stop.stopId, 
      status: 'waiting' 
    });

    for (const student of studentsAtStop) {
      student.status = 'boarded';
      student.lastStatusUpdate = new Date();
      await student.save();

      // Parent notification
      const parentNotif = await Notification.create({
        title: 'Child Boarded Bus',
        message: `${student.name} (${student.grade}-${student.section}) has safely boarded Bus ${bus.busNumber} at ${stop.name}.`,
        type: 'student_boarded',
        busId: bus._id,
        busNumber: bus.busNumber,
        studentId: student._id,
        studentName: student.name,
        stopName: stop.name,
        recipientRole: 'parent',
        recipientId: student.parentId,
        timestamp: new Date()
      });

      // Dispatch directly to fleet & parent rooms
      if (this.io) {
        this.io.to('fleet:all').emit('notification:new', parentNotif);
        if (student.parentId) {
          this.io.to(`parent:${student.parentId}`).emit('notification:new', parentNotif);
        }
        this.io.to('fleet:all').emit('student:status_updated', student);
      }
    }

    if (this.io) {
      this.io.to('fleet:all').emit('notification:new', notif);
      this.io.to(`bus:${bus._id}`).emit('bus:stop_arrived', {
        busNumber: bus.busNumber,
        stopId: stop.stopId,
        stopName: stop.name
      });
    }
  }

  async triggerApproachingNotification(bus, stop, etaMinutes) {
    const notif = await Notification.create({
      title: 'Bus Approaching',
      message: `Bus ${bus.busNumber} is approaching ${stop.name} (ETA: ~${etaMinutes} mins).`,
      type: 'approaching_stop',
      busId: bus._id,
      busNumber: bus.busNumber,
      stopName: stop.name,
      recipientRole: 'all',
      timestamp: new Date()
    });
    if (this.io) {
      this.io.to('fleet:all').emit('notification:new', notif);
    }
  }

  async triggerTripStartNotification(bus, route) {
    const notif = await Notification.create({
      title: 'Trip Started',
      message: `Bus ${bus.busNumber} has started its journey on ${route.name}.`,
      type: 'trip_start',
      busId: bus._id,
      busNumber: bus.busNumber,
      recipientRole: 'all',
      timestamp: new Date()
    });
    if (this.io) {
      this.io.to('fleet:all').emit('notification:new', notif);
    }
  }

  async triggerTripEndedNotification(bus, route) {
    const notif = await Notification.create({
      title: 'Trip Completed',
      message: `Bus ${bus.busNumber} has reached terminus for ${route.name}. Preparing return leg.`,
      type: 'trip_ended',
      busId: bus._id,
      busNumber: bus.busNumber,
      recipientRole: 'all',
      timestamp: new Date()
    });
    if (this.io) {
      this.io.to('fleet:all').emit('notification:new', notif);
    }
  }

  async triggerDelayNotification(bus) {
    const notif = await Notification.create({
      title: 'Traffic Delay Advisory',
      message: `Bus ${bus.busNumber} is experiencing moderate traffic congestion near ${bus.lastLocation.nextStopName || 'Hyderabad Outer Road'}.`,
      type: 'delayed',
      busId: bus._id,
      busNumber: bus.busNumber,
      recipientRole: 'all',
      timestamp: new Date()
    });
    if (this.io) {
      this.io.to('fleet:all').emit('notification:new', notif);
    }
  }
}

const simulatorInstance = new BusSimulator();
module.exports = simulatorInstance;
