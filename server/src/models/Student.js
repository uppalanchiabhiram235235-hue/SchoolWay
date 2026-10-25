const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentName: { type: String, default: '' },
  parentPhone: { type: String, default: '' },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  busNumber: { type: String, required: true },
  stopId: { type: String, required: true },
  stopName: { type: String, required: true },
  stopCoordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['waiting', 'boarded', 'dropped', 'absent'],
    default: 'waiting'
  },
  lastStatusUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
