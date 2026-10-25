const mongoose = require('mongoose');

const gpsPointSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  heading: { type: Number, default: 0 },
  source: { type: String, enum: ['simulated', 'driver'], default: 'simulated' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

gpsPointSchema.index({ busId: 1, timestamp: -1 });

module.exports = mongoose.model('GpsPoint', gpsPointSchema);
