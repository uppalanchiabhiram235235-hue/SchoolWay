const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Water Bottle',
      'Bag / Backpack',
      'Lunch Box',
      'Clothing / Uniform',
      'Books & Notes',
      'Stationery & Pencil Box',
      'ID Card & Badges',
      'Electronics',
      'Other'
    ],
    default: 'Other'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  busNumber: {
    type: String,
    default: 'Campus'
  },
  locationFound: {
    type: String,
    default: 'On School Bus'
  },
  foundDate: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: String,
    default: '' // Base64 data URL or external image URL
  },
  status: {
    type: String,
    enum: ['available', 'claimed', 'collected'],
    default: 'available'
  },
  reportedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'School Staff' },
    role: { type: String, default: 'driver' }, // 'driver' or 'admin'
    phone: { type: String, default: '' }
  },
  pickupOffice: {
    type: String,
    default: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
  },
  pickupTiming: {
    type: String,
    default: 'Monday to Saturday: 8:00 AM – 4:30 PM'
  },
  claimedBy: {
    parentName: { type: String, default: '' },
    studentName: { type: String, default: '' },
    phone: { type: String, default: '' },
    claimedAt: { type: Date, default: null },
    claimNotes: { type: String, default: '' }
  }
}, { timestamps: true });

lostItemSchema.index({ status: 1, foundDate: -1 });
lostItemSchema.index({ busNumber: 1 });

module.exports = mongoose.model('LostItem', lostItemSchema);
