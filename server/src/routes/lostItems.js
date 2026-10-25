const express = require('express');
const router = express.Router();
const LostItem = require('../models/LostItem');

// GET /api/lost-items — Fetch list of lost items with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, busNumber, status, search } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (busNumber && busNumber !== 'All') {
      filter.busNumber = busNumber;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { locationFound: { $regex: q, $options: 'i' } },
        { busNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const items = await LostItem.find(filter).sort({ foundDate: -1 });
    res.json(items);
  } catch (err) {
    console.error('[LostItems] GET error:', err);
    res.status(500).json({ message: err.message || 'Error fetching lost items' });
  }
});

// GET /api/lost-items/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/lost-items — Driver or Principal reports a found item
router.post('/', async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      busNumber,
      locationFound,
      imageUrl,
      reportedBy,
      pickupOffice
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Item title and description are required.' });
    }

    const newItem = await LostItem.create({
      title: title.trim(),
      category: category || 'Other',
      description: description.trim(),
      busNumber: busNumber || 'Campus',
      locationFound: locationFound || 'School Bus',
      imageUrl: imageUrl || '',
      status: 'available',
      reportedBy: {
        userId: reportedBy?.userId || null,
        name: reportedBy?.name || 'School Staff',
        role: reportedBy?.role || 'driver',
        phone: reportedBy?.phone || ''
      },
      pickupOffice: pickupOffice || 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
    });

    const io = req.app.get('io');
    if (io) {
      io.to('fleet:all').emit('lost_item:created', newItem);
    }

    res.status(201).json(newItem);
  } catch (err) {
    console.error('[LostItems] POST error:', err);
    res.status(500).json({ message: err.message || 'Error creating lost item report' });
  }
});

// PATCH /api/lost-items/:id/claim — Parent submits a claim inquiry for their child
router.patch('/:id/claim', async (req, res) => {
  try {
    const { parentName, studentName, phone, claimNotes } = req.body;

    const item = await LostItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    item.status = 'claimed';
    item.claimedBy = {
      parentName: parentName || 'Parent',
      studentName: studentName || '',
      phone: phone || '',
      claimedAt: new Date(),
      claimNotes: claimNotes || ''
    };

    await item.save();

    const io = req.app.get('io');
    if (io) {
      io.to('fleet:all').emit('lost_item:updated', item);
    }

    res.json(item);
  } catch (err) {
    console.error('[LostItems] Claim error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/lost-items/:id/status — Driver / Principal marks as available, claimed, or collected
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'claimed', 'collected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const item = await LostItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    item.status = status;
    if (status === 'available') {
      item.claimedBy = { parentName: '', studentName: '', phone: '', claimedAt: null, claimNotes: '' };
    }
    await item.save();

    const io = req.app.get('io');
    if (io) {
      io.to('fleet:all').emit('lost_item:updated', item);
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/lost-items/:id — Driver or Admin deletes an item
router.delete('/:id', async (req, res) => {
  try {
    const item = await LostItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to('fleet:all').emit('lost_item:deleted', { _id: req.params.id });
    }

    res.json({ message: 'Lost item record removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
