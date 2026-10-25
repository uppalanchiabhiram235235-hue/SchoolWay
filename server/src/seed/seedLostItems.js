const LostItem = require('../models/LostItem');

async function seedLostItemsIfEmpty() {
  try {
    const count = await LostItem.countDocuments();
    if (count > 0) return;

    console.log('[Seed] Seeding default Lost & Found catalog for Hyderabad buses...');

    const sampleItems = [
      {
        title: 'Milton Blue Thermosteel Water Bottle',
        category: 'Water Bottle',
        description: '750ml dark blue insulated bottle with school sticker on the cap. Found under seat 8 near window.',
        busNumber: 'SW-01',
        locationFound: 'Bus SW-01 (Seat 8, Left Window)',
        status: 'available',
        foundDate: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        reportedBy: {
          name: 'Rajesh Kumar (Driver)',
          role: 'driver',
          phone: '+91 98490 12345'
        },
        pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
      },
      {
        title: 'Class 6 Science Practical Record Notebook',
        category: 'Books & Notes',
        description: 'Hardcover spiral notebook with brown binding sheet. Student name label on cover: Aarav Sharma (Class 6-B).',
        busNumber: 'SW-01',
        locationFound: 'Bus SW-01 (Front luggage rack)',
        status: 'available',
        foundDate: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        reportedBy: {
          name: 'Rajesh Kumar (Driver)',
          role: 'driver',
          phone: '+91 98490 12345'
        },
        pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
      },
      {
        title: 'Red Spiderman Double-Deck Pencil Box',
        category: 'Stationery & Pencil Box',
        description: 'Metal geometric stationery box with compass, scale, and color sketch pens inside. Found after morning drop.',
        busNumber: 'SW-03',
        locationFound: 'Bus SW-03 (Seat 14 right aisle)',
        status: 'available',
        foundDate: new Date(Date.now() - 1000 * 60 * 60 * 5),
        reportedBy: {
          name: 'Mohammed Imran (Driver)',
          role: 'driver',
          phone: '+91 98490 34567'
        },
        pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
      },
      {
        title: 'Official School Navy Blazer (Size 32)',
        category: 'Clothing / Uniform',
        description: 'Ghatkesar Central School uniform winter blazer with gold button accents and school embroidered crest.',
        busNumber: 'SW-04',
        locationFound: 'Bus SW-04 (Rear Seat)',
        status: 'available',
        foundDate: new Date(Date.now() - 1000 * 60 * 60 * 8),
        reportedBy: {
          name: 'Venkat Rao (Driver)',
          role: 'driver',
          phone: '+91 98490 45678'
        },
        pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
      },
      {
        title: 'Wildcraft Insulated Grey Lunch Bag',
        category: 'Lunch Box',
        description: 'Two-tier zip lunch pouch with steel containers and a blue hand towel. Left behind during evening return trip.',
        busNumber: 'SW-02',
        locationFound: 'Bus SW-02 (Seat 5)',
        status: 'claimed',
        foundDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
        reportedBy: {
          name: 'Suresh Reddy (Driver)',
          role: 'driver',
          phone: '+91 98490 23456'
        },
        claimedBy: {
          parentName: 'Deepa Hegde',
          studentName: 'Varun Hegde',
          phone: '+91 98765 11011',
          claimedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          claimNotes: 'Verified with student roll number SW-112. Waiting for collection after school.'
        },
        pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
      }
    ];

    await LostItem.insertMany(sampleItems);
    console.log(`[Seed] Successfully seeded ${sampleItems.length} default Lost & Found items.`);
  } catch (err) {
    console.error('[Seed] Error seeding lost items:', err);
  }
}

module.exports = { seedLostItemsIfEmpty };
