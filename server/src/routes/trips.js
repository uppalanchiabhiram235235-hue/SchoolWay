const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// POST /api/trips/start (Driver starts a manual trip - simulator pauses for this bus)
router.post('/start', protect, async (req, res) => {
  try {
    const { busId, routeId } = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    const route = routeId ? await Route.findById(routeId) : await Route.findById(bus.routeId);
    if (!route) return res.status(404).json({ message: 'Route not found' });

    // End previous trip if any
    if (bus.currentTripId) {
      await Trip.findByIdAndUpdate(bus.currentTripId, {
        status: 'completed',
        endTime: new Date()
      });
    }

    const trip = await Trip.create({
      busId: bus._id,
      busNumber: bus.busNumber,
      routeId: route._id,
      routeCode: route.code,
      routeName: route.name,
      driverId: req.user._id,
      source: 'driver',
      status: 'in_progress',
      startTime: new Date(),
      currentSpeed: 30,
      stopsCompleted: []
    });

    bus.currentTripId = trip._id;
    bus.activeTripSource = 'driver'; // PAUSE SIMULATOR
    bus.status = 'in_transit';
    bus.driverId = req.user._id;
    bus.driverName = req.user.name;
    bus.driverPhone = req.user.phone;
    await bus.save();

    // Broadcast trip started notification
    const notif = await Notification.create({
      title: 'Manual Trip Started',
      message: `Driver ${req.user.name} has started driving Bus ${bus.busNumber} on ${route.name}.`,
      type: 'trip_start',
      busId: bus._id,
      busNumber: bus.busNumber,
      recipientRole: 'all',
      timestamp: new Date()
    });

    const io = req.app.get('io');
    if (io) {
      io.to('fleet:all').emit('notification:new', notif);
      io.to(`bus:${bus._id}`).emit('trip:status_change', {
        busId: bus._id,
        status: 'in_progress',
        source: 'driver',
        trip
      });
    }

    res.json({ success: true, trip, bus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trips/end (Driver ends manual trip - simulator resumes)
router.post('/end', protect, async (req, res) => {
  try {
    const { busId } = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    if (bus.currentTripId) {
      await Trip.findByIdAndUpdate(bus.currentTripId, {
        status: 'completed',
        endTime: new Date()
      });
    }

    // Switch back to simulated mode
    bus.activeTripSource = 'simulated';
    bus.status = 'active';

    // Start a new simulated trip record
    const route = await Route.findById(bus.routeId);
    const newSimTrip = await Trip.create({
      busId: bus._id,
      busNumber: bus.busNumber,
      routeId: bus.routeId,
      routeCode: bus.routeCode,
      routeName: route ? route.name : 'School Route',
      driverId: bus.driverId,
      source: 'simulated',
      status: 'in_progress',
      startTime: new Date()
    });
    bus.currentTripId = newSimTrip._id;
    await bus.save();

    const notif = await Notification.create({
      title: 'Driver Trip Ended',
      message: `Driver trip for Bus ${bus.busNumber} has ended. Autonomous simulator resumed.`,
      type: 'trip_ended',
      busId: bus._id,
      busNumber: bus.busNumber,
      recipientRole: 'all',
      timestamp: new Date()
    });

    const io = req.app.get('io');
    if (io) {
      io.to('fleet:all').emit('notification:new', notif);
      io.to(`bus:${bus._id}`).emit('trip:status_change', {
        busId: bus._id,
        status: 'in_progress',
        source: 'simulated',
        trip: newSimTrip
      });
    }

    res.json({ success: true, message: 'Driver trip ended. Autonomous simulator resumed.', bus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trips/sos (Emergency SOS)
router.post('/sos', protect, async (req, res) => {
  try {
    const { busId, message } = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    const notif = await Notification.create({
      title: '🚨 EMERGENCY SOS ALERT',
      message: message || `Emergency reported for Bus ${bus.busNumber} near ${bus.lastLocation.nextStopName || 'Hyderabad'}!`,
      type: 'sos',
      busId: bus._id,
      busNumber: bus.busNumber,
      recipientRole: 'all',
      timestamp: new Date()
    });

    const io = req.app.get('io');
    if (io) {
      io.to('fleet:all').emit('notification:new', notif);
      io.to('fleet:all').emit('driver:sos_broadcast', {
        busId: bus._id,
        busNumber: bus.busNumber,
        message: notif.message,
        timestamp: notif.timestamp
      });
    }

    res.json({ success: true, notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
