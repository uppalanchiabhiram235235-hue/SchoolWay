const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const GpsPoint = require('../models/GpsPoint');
const Notification = require('../models/Notification');
const simulator = require('../simulator/busSimulator');

function initSocket(io) {
  io.on('connection', (socket) => {
    // Join fleet tracking room
    socket.on('join_fleet', () => {
      socket.join('fleet:all');
    });

    // Join specific bus room
    socket.on('join_bus', (busId) => {
      if (busId) {
        socket.join(`bus:${busId}`);
      }
    });

    // Leave bus room
    socket.on('leave_bus', (busId) => {
      if (busId) {
        socket.leave(`bus:${busId}`);
      }
    });

    // Join parent specific notification room
    socket.on('join_parent', (parentId) => {
      if (parentId) {
        socket.join(`parent:${parentId}`);
      }
    });

    // Toggle simulator speed
    socket.on('simulator:set_mode', (mode) => {
      if (mode === 'demo' || mode === 'realistic') {
        simulator.setMode(mode, io);
      }
    });

    // Driver manual location push (overriding simulation)
    socket.on('driver:push_location', async (data) => {
      try {
        const { busId, lat, lng, speed, heading } = data;
        const bus = await Bus.findById(busId);
        if (!bus) return;

        bus.activeTripSource = 'driver';
        bus.lastLocation = {
          ...bus.lastLocation,
          lat,
          lng,
          speed: speed || 25,
          heading: heading || 0,
          lastUpdated: new Date()
        };
        await bus.save();

        await GpsPoint.create({
          busId: bus._id,
          tripId: bus.currentTripId,
          lat,
          lng,
          speed: speed || 25,
          heading: heading || 0,
          source: 'driver',
          timestamp: new Date()
        });

        const updatePayload = {
          busId: bus._id,
          busNumber: bus.busNumber,
          plateNumber: bus.plateNumber,
          routeCode: bus.routeCode,
          lat,
          lng,
          speed: speed || 25,
          heading: heading || 0,
          status: bus.status,
          source: 'driver',
          lastUpdated: new Date()
        };

        io.to(`bus:${bus._id}`).emit('bus:location_update', updatePayload);
        io.to('fleet:all').emit('bus:location_update', updatePayload);
      } catch (err) {
        console.error('[Socket] Driver location push error:', err.message);
      }
    });

    // Driver SOS emergency button
    socket.on('driver:sos_alert', async (data) => {
      try {
        const { busId, busNumber, message } = data;
        const notif = await Notification.create({
          title: '🚨 EMERGENCY SOS ALERT',
          message: message || `Urgent assistance requested by Driver for Bus ${busNumber}!`,
          type: 'sos',
          busId,
          busNumber,
          recipientRole: 'all',
          timestamp: new Date()
        });

        io.to('fleet:all').emit('notification:new', notif);
        io.to('fleet:all').emit('driver:sos_broadcast', {
          busId,
          busNumber,
          message: notif.message,
          timestamp: notif.timestamp
        });
      } catch (err) {
        console.error('[Socket] SOS alert error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
}

module.exports = { initSocket };
