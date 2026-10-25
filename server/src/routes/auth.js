const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'schoolway_super_secret_jwt_key_hyd_2026', {
    expiresIn: '7d'
  });
}

const Student = require('../models/Student');
const Bus = require('../models/Bus');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'parent', phone = '', studentName, grade, section, busNumber, stopId, stopName } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const validRole = ['admin', 'parent', 'driver'].includes(role) ? role : 'parent';

    const user = new User({
      name,
      email,
      password,
      role: validRole,
      phone
    });

    await user.save();

    // If registered as parent and provided student details
    if (validRole === 'parent' && studentName) {
      const bus = busNumber ? await Bus.findOne({ busNumber }) : await Bus.findOne();
      const student = await Student.create({
        name: studentName,
        rollNumber: `SW-${Math.floor(100 + Math.random() * 900)}`,
        grade: grade || 'Class 5',
        section: section || 'A',
        parentId: user._id,
        parentName: user.name,
        parentPhone: user.phone,
        busId: bus ? bus._id : null,
        busNumber: bus ? bus.busNumber : 'SW-01',
        stopId: stopId || 'ST-BG4',
        stopName: stopName || 'Bibinagar AIIMS & Junction',
        stopCoordinates: { lat: 17.4770, lng: 78.7930 },
        status: 'waiting'
      });
      user.studentIds.push(student._id);
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedBus: user.assignedBusId,
        studentIds: user.studentIds
      }
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('assignedBusId');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedBus: user.assignedBusId,
        studentIds: user.studentIds
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedBusId');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/demo-accounts (Convenience endpoint for 1-click test logins)
router.get('/demo-accounts', async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('name email role');
    const parents = await User.find({ role: 'parent' }).select('name email role').limit(2);
    const drivers = await User.find({ role: 'driver' }).populate('assignedBusId', 'busNumber routeCode').limit(2);

    res.json({
      admin: { name: admin?.name, email: admin?.email, password: 'admin123', role: 'admin' },
      parents: parents.map(p => ({ name: p.name, email: p.email, password: 'parent123', role: 'parent' })),
      drivers: drivers.map(d => ({
        name: d.name,
        email: d.email,
        password: 'driver123',
        role: 'driver',
        busNumber: d.assignedBusId?.busNumber
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
