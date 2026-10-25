const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  stopId: { type: String, required: true },
  name: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  sequence: { type: Number, required: true },
  landmark: { type: String, default: '' },
  polyIndex: { type: Number, default: 0 }
}, { _id: false });

const coordSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  direction: { type: String, enum: ['forward', 'reverse'], default: 'forward' },
  pairedRouteCode: { type: String, default: null },
  distanceKm: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 0 },
  stops: [stopSchema],
  polyline: [coordSchema]
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
