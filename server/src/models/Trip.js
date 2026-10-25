const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  busNumber: { type: String, required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  routeCode: { type: String, required: true },
  routeName: { type: String, required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  source: { 
    type: String, 
    enum: ['simulated', 'driver'], 
    default: 'simulated' 
  },
  status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'paused'], 
    default: 'in_progress' 
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  stopsCompleted: [{ type: String }],
  delayMinutes: { type: Number, default: 0 },
  currentSpeed: { type: Number, default: 30 }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
