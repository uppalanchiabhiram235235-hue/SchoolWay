const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Trip = require('../models/Trip');

// GET /api/buses/live (PUBLIC - no login needed!)
router.get('/live', async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate('routeId')
      .populate('driverId', 'name phone email')
      .lean();

    const formattedBuses = buses.map(bus => ({
      _id: bus._id,
      busNumber: bus.busNumber,
      plateNumber: bus.plateNumber,
      routeCode: bus.routeCode || bus.routeId?.code || '',
      capacity: bus.capacity,
      status: bus.status,
      activeTripSource: bus.activeTripSource,
      driver: bus.driverId ? {
        _id: bus.driverId._id,
        name: bus.driverId.name,
        phone: bus.driverId.phone
      } : { name: bus.driverName, phone: bus.driverPhone },
      route: bus.routeId ? {
        _id: bus.routeId._id,
        name: bus.routeId.name,
        code: bus.routeId.code,
        origin: bus.routeId.origin,
        destination: bus.routeId.destination,
        direction: bus.routeId.direction,
        distanceKm: bus.routeId.distanceKm,
        durationMinutes: bus.routeId.durationMinutes,
        stops: bus.routeId.stops,
        polyline: bus.routeId.polyline
      } : null,
      lastLocation: bus.lastLocation,
      simulationState: bus.simulationState
    }));

    res.json(formattedBuses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/buses/:id (Details of a specific bus)
router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('routeId')
      .populate('driverId', 'name phone email');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    const students = await Student.find({ busId: bus._id });
    const currentTrip = bus.currentTripId ? await Trip.findById(bus.currentTripId) : null;

    res.json({
      bus,
      students,
      currentTrip
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const User = require('../models/User');

// POST /api/buses (Principal/Admin: Add a new bus to fleet)
router.post('/', async (req, res) => {
  try {
    const { busNumber, plateNumber, routeCode, capacity = 36, driverName = '', driverPhone = '', driverEmail = '' } = req.body;

    if (!busNumber || !plateNumber || !routeCode) {
      return res.status(400).json({ message: 'Bus number, plate number, and route are required.' });
    }

    const cleanBusNum = busNumber.trim().toUpperCase();
    const existing = await Bus.findOne({ busNumber: cleanBusNum });
    if (existing) {
      return res.status(400).json({ message: `Bus ${cleanBusNum} already exists in the fleet.` });
    }

    // Find route by code or ID
    const route = await Route.findOne({ 
      $or: [{ code: routeCode }, { _id: mongoose.isValidObjectId(routeCode) ? routeCode : null }] 
    });

    if (!route) {
      return res.status(404).json({ message: 'Selected route not found.' });
    }

    // Optional driver account creation or linking
    let driverUser = null;
    if (driverEmail && driverEmail.trim()) {
      const email = driverEmail.trim().toLowerCase();
      driverUser = await User.findOne({ email });
      if (!driverUser) {
        driverUser = await User.create({
          name: driverName || `Driver ${cleanBusNum}`,
          email,
          password: 'driver123',
          role: 'driver',
          phone: driverPhone || '+91 98000 00000'
        });
      }
    }

    const startPt = route.polyline?.[0] || route.stops?.[0]?.location || { lat: 17.4058, lng: 78.5591 };

    const newBus = new Bus({
      busNumber: cleanBusNum,
      plateNumber: plateNumber.trim().toUpperCase(),
      capacity: Number(capacity) || 36,
      routeId: route._id,
      routeCode: route.code,
      driverId: driverUser ? driverUser._id : null,
      driverName: driverName || (driverUser ? driverUser.name : 'Assigned Driver'),
      driverPhone: driverPhone || (driverUser ? driverUser.phone : ''),
      status: 'active',
      activeTripSource: 'simulated',
      lastLocation: {
        lat: startPt.lat,
        lng: startPt.lng,
        heading: 0,
        speed: 35,
        nextStopId: route.stops?.[0]?.id || '',
        nextStopName: route.stops?.[0]?.name || 'Ghatkesar Campus',
        etaMinutes: 2,
        distanceToNextStopMeters: 500,
        dwellUntil: null,
        lastUpdated: new Date()
      },
      simulationState: {
        polyIndex: 0,
        subPolyIndex: 0,
        currentStopIndex: 0,
        isDwell: false,
        dwellUntil: null,
        currentRouteCode: route.code
      }
    });

    await newBus.save();

    if (driverUser) {
      driverUser.assignedBusId = newBus._id;
      await driverUser.save();
    }

    const populatedBus = await Bus.findById(newBus._id)
      .populate('routeId')
      .populate('driverId', 'name phone email');

    res.status(201).json({
      message: `Bus ${cleanBusNum} added to fleet successfully!`,
      bus: populatedBus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/buses/:id (Principal/Admin: Remove bus from fleet)
router.delete('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    const busNumber = bus.busNumber;

    // Unassign driver & students
    await User.updateMany({ assignedBusId: bus._id }, { assignedBusId: null });
    await Student.updateMany({ busId: bus._id }, { busId: null });

    // Remove the bus
    await Bus.findByIdAndDelete(req.params.id);

    res.json({ message: `Bus ${busNumber} removed from fleet successfully.`, busId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
