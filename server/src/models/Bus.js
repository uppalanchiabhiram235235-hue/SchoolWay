const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  plateNumber: { type: String, required: true },
  capacity: { type: Number, default: 36 },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  routeCode: { type: String, required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  driverName: { type: String, default: '' },
  driverPhone: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['active', 'in_transit', 'delayed', 'stopped', 'maintenance'], 
    default: 'active' 
  },
  activeTripSource: { 
    type: String, 
    enum: ['simulated', 'driver'], 
    default: 'simulated' 
  },
  currentTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
  lastLocation: {
    lat: { type: Number, default: 17.4058 },
    lng: { type: Number, default: 78.5591 },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 30 },
    nextStopId: { type: String, default: '' },
    nextStopName: { type: String, default: '' },
    etaMinutes: { type: Number, default: 0 },
    distanceToNextStopMeters: { type: Number, default: 0 },
    dwellUntil: { type: Date, default: null },
    lastUpdated: { type: Date, default: Date.now }
  },
  simulationState: {
    polyIndex: { type: Number, default: 0 },
    currentStopIndex: { type: Number, default: 0 },
    isDwell: { type: Boolean, default: false },
    dwellUntil: { type: Date, default: null },
    currentRouteCode: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
