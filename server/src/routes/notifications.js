const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Student = require('../models/Student');

// GET /api/notifications (PUBLIC or filtered)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    let query = {};

    if (req.query.parentId) {
      const students = await Student.find({ parentId: req.query.parentId });
      const studentIds = students.map(s => s._id);
      const studentNames = students.map(s => s.name);
      const busNumbers = [...new Set(students.map(s => s.busNumber).filter(Boolean))];

      query = {
        $or: [
          { recipientId: req.query.parentId },
          { studentId: { $in: studentIds } },
          { studentName: { $in: studentNames } },
          {
            busNumber: { $in: busNumbers },
            recipientRole: { $in: ['all', 'parent'] }
          }
        ]
      };
    } else if (req.query.studentId) {
      query = {
        $or: [
          { studentId: req.query.studentId },
          { recipientId: req.query.studentId }
        ]
      };
    }

    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications (Clear all notifications)
router.delete('/', async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ message: 'All notifications cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
