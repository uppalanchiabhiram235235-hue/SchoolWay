const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Bus = require('../models/Bus');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// GET /api/students
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'parent') {
      query.parentId = req.user._id;
    } else if (req.user.role === 'driver') {
      const driverBus = await Bus.findOne({ driverId: req.user._id });
      if (driverBus) {
        query.busId = driverBus._id;
      }
    }

    const students = await Student.find(query).populate('busId', 'busNumber plateNumber status lastLocation');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/students/:id/status (driver toggles student boarded/dropped/absent)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['waiting', 'boarded', 'dropped', 'absent'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.status = status;
    student.lastStatusUpdate = new Date();
    await student.save();

    // Notification for parent
    const statusTitles = {
      boarded: 'Child Boarded Bus',
      dropped: 'Child Dropped at Stop',
      waiting: 'Student Status: Waiting',
      absent: 'Student Marked Absent'
    };

    const notif = await Notification.create({
      title: statusTitles[status] || 'Student Status Updated',
      message: `${student.name} (${student.grade}-${student.section}) status changed to "${status.toUpperCase()}" for Bus ${student.busNumber}.`,
      type: status === 'boarded' ? 'student_boarded' : (status === 'dropped' ? 'student_dropped' : 'approaching_stop'),
      busId: student.busId,
      busNumber: student.busNumber,
      studentId: student._id,
      studentName: student.name,
      stopName: student.stopName,
      recipientRole: 'parent',
      recipientId: student.parentId,
      timestamp: new Date()
    });

    const io = req.app.get('io');
    if (io) {
      io.to('fleet:all').emit('student:status_updated', student);
      io.to('fleet:all').emit('notification:new', notif);
    }

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
