const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'trip_start',
      'approaching_stop',
      'arrived_stop',
      'trip_ended',
      'delayed',
      'sos',
      'student_boarded',
      'student_dropped'
    ],
    required: true
  },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
  busNumber: { type: String, default: '' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  studentName: { type: String, default: '' },
  stopName: { type: String, default: '' },
  recipientRole: {
    type: String,
    enum: ['all', 'parent', 'admin', 'driver'],
    default: 'all'
  },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, timestamp: -1 });
notificationSchema.index({ recipientRole: 1, timestamp: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
