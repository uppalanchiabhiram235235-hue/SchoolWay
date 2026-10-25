const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Student = require('../models/Student');
const Trip = require('../models/Trip');
const GpsPoint = require('../models/GpsPoint');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');
const { generateAllRoutes } = require('./generateRoutes');

// Calculate heading between two points
function calculateHeading(p1, p2) {
  if (!p1 || !p2) return 0;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const lat1 = p1.lat * Math.PI / 180;
  const lat2 = p2.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return Math.round((brng + 360) % 360);
}

// Distance helper
function distanceMeters(p1, p2) {
  if (!p1 || !p2) return 0;
  const R = 6371000;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function loadOrGenerateRoutes() {
  const routesJsonPath = path.join(__dirname, 'routes.json');
  if (fs.existsSync(routesJsonPath)) {
    console.log('[Seed] Loading road-snapped routes from local fallback: routes.json');
    const content = fs.readFileSync(routesJsonPath, 'utf8');
    return JSON.parse(content);
  }
  console.log('[Seed] routes.json not found, fetching live road polylines from OSRM...');
  return await generateAllRoutes();
}

async function seedDatabase(forceClean = true) {
  try {
    await connectDB();
    console.log('[Seed] Starting SchoolWay database seeding...');

    if (forceClean) {
      console.log('[Seed] Clearing existing collections...');
      await Promise.all([
        User.deleteMany({}),
        Route.deleteMany({}),
        Bus.deleteMany({}),
        Student.deleteMany({}),
        Trip.deleteMany({}),
        GpsPoint.deleteMany({}),
        Notification.deleteMany({})
      ]);
    }

    // 1. Seed Routes
    const routeDefinitions = await loadOrGenerateRoutes();
    const seededRoutes = await Route.insertMany(routeDefinitions);
    console.log(`[Seed] Seeded ${seededRoutes.length} road-following routes in Hyderabad.`);

    const routeMap = {};
    seededRoutes.forEach(r => {
      routeMap[r.code] = r;
    });

    // 2. Seed Admin
    const adminUser = await User.create({
      name: 'Principal Ananya Gupta (Admin)',
      email: 'admin@schoolway.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 99880 01122'
    });

    // 3. Seed 6 Drivers
    const driverDefs = [
      { name: 'Rajesh Kumar', email: 'rajesh.driver@schoolway.com', phone: '+91 98490 12345' },
      { name: 'Suresh Reddy', email: 'suresh.driver@schoolway.com', phone: '+91 98490 23456' },
      { name: 'Mohammed Imran', email: 'imran.driver@schoolway.com', phone: '+91 98490 34567' },
      { name: 'Venkat Rao', email: 'venkat.driver@schoolway.com', phone: '+91 98490 45678' },
      { name: 'Ramesh Yadav', email: 'ramesh.driver@schoolway.com', phone: '+91 98490 56789' },
      { name: 'Naresh Sharma', email: 'naresh.driver@schoolway.com', phone: '+91 98490 67890' }
    ];

    const seededDrivers = [];
    for (const d of driverDefs) {
      const u = await User.create({
        name: d.name,
        email: d.email,
        password: 'driver123',
        role: 'driver',
        phone: d.phone
      });
      seededDrivers.push(u);
    }
    console.log(`[Seed] Seeded ${seededDrivers.length} professional bus drivers.`);

    // 4. Seed 6 Buses connecting Ghatkesar School to Bhongir, Uppal, and ECIL
    const busConfigs = [
      {
        busNumber: 'SW-01',
        plateNumber: 'TS-08-UB-4122',
        capacity: 36,
        routeCode: 'ROUTE-BHONIGIR-FWD',
        polyFraction: 0.12, // heading out towards Bibinagar/Bhongir
        driverIdx: 0
      },
      {
        busNumber: 'SW-02',
        plateNumber: 'TS-08-UB-5289',
        capacity: 36,
        routeCode: 'ROUTE-BHONIGIR-REV',
        polyFraction: 0.20, // inbound from Bhongir to Ghatkesar School
        driverIdx: 1
      },
      {
        busNumber: 'SW-03',
        plateNumber: 'TS-08-UB-6311',
        capacity: 40,
        routeCode: 'ROUTE-UPPAL-FWD',
        polyFraction: 0.35, // near Narapally/Medipally towards Uppal
        driverIdx: 2
      },
      {
        busNumber: 'SW-04',
        plateNumber: 'TS-07-EA-7184',
        capacity: 40,
        routeCode: 'ROUTE-UPPAL-REV',
        polyFraction: 0.18, // inbound from Uppal towards Ghatkesar School
        driverIdx: 3
      },
      {
        busNumber: 'SW-05',
        plateNumber: 'TS-07-EA-8290',
        capacity: 36,
        routeCode: 'ROUTE-ECIL-FWD',
        polyFraction: 0.40, // towards ECIL via Rampally/Nagaram
        driverIdx: 4
      },
      {
        busNumber: 'SW-06',
        plateNumber: 'TS-07-EA-9345',
        capacity: 42,
        routeCode: 'ROUTE-ECIL-REV',
        polyFraction: 0.25, // inbound from ECIL to Ghatkesar School
        driverIdx: 5
      }
    ];

    const seededBuses = [];
    const busMap = {};

    for (const cfg of busConfigs) {
      const route = routeMap[cfg.routeCode];
      const poly = route.polyline;
      const polyIndex = Math.min(Math.floor(poly.length * cfg.polyFraction), poly.length - 2);
      const currPt = poly[polyIndex];
      const nextPt = poly[polyIndex + 1] || currPt;
      const heading = calculateHeading(currPt, nextPt);

      // Find next stop ahead of polyIndex
      let nextStop = route.stops.find(s => s.polyIndex >= polyIndex) || route.stops[route.stops.length - 1];
      const distToStop = Math.round(distanceMeters(currPt, nextStop.coordinates));
      const estEtaMin = Math.max(1, Math.round((distToStop / (30 * 1000 / 60))));

      const driver = seededDrivers[cfg.driverIdx];

      const bus = await Bus.create({
        busNumber: cfg.busNumber,
        plateNumber: cfg.plateNumber,
        capacity: cfg.capacity,
        routeId: route._id,
        routeCode: route.code,
        driverId: driver._id,
        driverName: driver.name,
        driverPhone: driver.phone,
        status: 'in_transit',
        activeTripSource: 'simulated',
        lastLocation: {
          lat: currPt.lat,
          lng: currPt.lng,
          heading,
          speed: 32,
          nextStopId: nextStop.stopId,
          nextStopName: nextStop.name,
          etaMinutes: estEtaMin,
          distanceToNextStopMeters: distToStop,
          lastUpdated: new Date()
        },
        simulationState: {
          polyIndex,
          currentStopIndex: route.stops.findIndex(s => s.stopId === nextStop.stopId),
          isDwell: false,
          dwellUntil: null,
          currentRouteCode: route.code
        }
      });

      // Update driver with assigned bus
      driver.assignedBusId = bus._id;
      await driver.save();

      // Create initial simulated Trip record
      const trip = await Trip.create({
        busId: bus._id,
        busNumber: bus.busNumber,
        routeId: route._id,
        routeCode: route.code,
        routeName: route.name,
        driverId: driver._id,
        source: 'simulated',
        status: 'in_progress',
        startTime: new Date(Date.now() - 1000 * 60 * 15),
        currentSpeed: 32,
        stopsCompleted: route.stops.filter(s => s.polyIndex < polyIndex).map(s => s.stopId)
      });

      bus.currentTripId = trip._id;
      await bus.save();

      // Record first GpsPoint
      await GpsPoint.create({
        busId: bus._id,
        tripId: trip._id,
        lat: currPt.lat,
        lng: currPt.lng,
        speed: 32,
        heading,
        source: 'simulated',
        timestamp: new Date()
      });

      seededBuses.push(bus);
      busMap[bus.busNumber] = bus;
    }
    console.log(`[Seed] Seeded ${seededBuses.length} live buses with realistic staggered positions.`);

    // 5. Seed Parents and Students
    const parentStudentDefs = [
      {
        parent: { name: 'Vikram Sharma', email: 'vikram.parent@schoolway.com', phone: '+91 98765 11001' },
        students: [{ name: 'Aarav Sharma', rollNumber: 'SW-101', grade: 'Class 6', section: 'B', busNumber: 'SW-01', stopId: 'ST-BG4' }] // Bibinagar AIIMS
      },
      {
        parent: { name: 'Sneha Reddy', email: 'sneha.parent@schoolway.com', phone: '+91 98765 11002' },
        students: [{ name: 'Ananya Reddy', rollNumber: 'SW-102', grade: 'Class 4', section: 'A', busNumber: 'SW-03', stopId: 'ST-UP3' }] // Narapally Junction
      },
      {
        parent: { name: 'Priya Nair', email: 'priya.parent@schoolway.com', phone: '+91 98765 11003' },
        students: [{ name: 'Rohan Nair', rollNumber: 'SW-103', grade: 'Class 7', section: 'C', busNumber: 'SW-01', stopId: 'ST-BG6' }] // Bhongir Bypass
      },
      {
        parent: { name: 'Karthik Varma', email: 'karthik.parent@schoolway.com', phone: '+91 98765 11004' },
        students: [{ name: 'Aditya Varma', rollNumber: 'SW-104', grade: 'Class 5', section: 'B', busNumber: 'SW-02', stopId: 'ST-BGR4' }] // Bibinagar Junction (inbound)
      },
      {
        parent: { name: 'Meera Joshi', email: 'meera.parent@schoolway.com', phone: '+91 98765 11005' },
        students: [{ name: 'Diya Joshi', rollNumber: 'SW-105', grade: 'Class 3', section: 'A', busNumber: 'SW-03', stopId: 'ST-UP5' }] // Peerzadiguda
      },
      {
        parent: { name: 'Sandeep Patel', email: 'sandeep.parent@schoolway.com', phone: '+91 98765 11006' },
        students: [{ name: 'Kabir Patel', rollNumber: 'SW-106', grade: 'Class 8', section: 'A', busNumber: 'SW-04', stopId: 'ST-UPR3' }] // Peerzadiguda (inbound)
      },
      {
        parent: { name: 'Lakshmi Rao', email: 'lakshmi.parent@schoolway.com', phone: '+91 98765 11007' },
        students: [{ name: 'Sai Kiran Rao', rollNumber: 'SW-107', grade: 'Class 9', section: 'B', busNumber: 'SW-05', stopId: 'ST-EC3' }] // Rampally X Roads
      },
      {
        parent: { name: 'Manoj Kumar', email: 'manoj.parent@schoolway.com', phone: '+91 98765 11008' },
        students: [{ name: 'Ishaan Kumar', rollNumber: 'SW-108', grade: 'Class 2', section: 'A', busNumber: 'SW-05', stopId: 'ST-EC4' }] // Nagaram Junction
      },
      {
        parent: { name: 'Sunita Das', email: 'sunita.parent@schoolway.com', phone: '+91 98765 11009' },
        students: [{ name: 'Riya Das', rollNumber: 'SW-109', grade: 'Class 6', section: 'A', busNumber: 'SW-01', stopId: 'ST-BG3' }] // Kondamadugu X Roads
      },
      {
        parent: { name: 'Harish Pillai', email: 'harish.parent@schoolway.com', phone: '+91 98765 11010' },
        students: [{ name: 'Arjun Pillai', rollNumber: 'SW-110', grade: 'Class 5', section: 'C', busNumber: 'SW-03', stopId: 'ST-UP6' }] // Boduppal X Roads
      },
      {
        parent: { name: 'Deepa Hegde', email: 'deepa.parent@schoolway.com', phone: '+91 98765 11011' },
        students: [
          { name: 'Tanvi Hegde', rollNumber: 'SW-111', grade: 'Class 4', section: 'B', busNumber: 'SW-02', stopId: 'ST-BGR2' },
          { name: 'Varun Hegde', rollNumber: 'SW-112', grade: 'Class 1', section: 'A', busNumber: 'SW-02', stopId: 'ST-BGR5' }
        ]
      },
      {
        parent: { name: 'Rahul Sen', email: 'rahul.parent@schoolway.com', phone: '+91 98765 11012' },
        students: [
          { name: 'Vivaan Sen', rollNumber: 'SW-113', grade: 'Class 7', section: 'A', busNumber: 'SW-06', stopId: 'ST-ECR3' },
          { name: 'Anvi Sen', rollNumber: 'SW-114', grade: 'Class 3', section: 'B', busNumber: 'SW-06', stopId: 'ST-ECR4' }
        ]
      },
      {
        parent: { name: 'Venkatesh Murthy', email: 'venkatesh.parent@schoolway.com', phone: '+91 98765 11013' },
        students: [
          { name: 'Pranav Murthy', rollNumber: 'SW-115', grade: 'Class 8', section: 'B', busNumber: 'SW-04', stopId: 'ST-UPR2' },
          { name: 'Nandini Murthy', rollNumber: 'SW-116', grade: 'Class 5', section: 'A', busNumber: 'SW-04', stopId: 'ST-UPR5' }
        ]
      },
      {
        parent: { name: 'Pooja Agarwal', email: 'pooja.parent@schoolway.com', phone: '+91 98765 11014' },
        students: [
          { name: 'Advait Agarwal', rollNumber: 'SW-117', grade: 'Class 6', section: 'C', busNumber: 'SW-06', stopId: 'ST-ECR2' },
          { name: 'Avani Agarwal', rollNumber: 'SW-118', grade: 'Class 2', section: 'C', busNumber: 'SW-06', stopId: 'ST-ECR5' }
        ]
      }
    ];

    let totalStudents = 0;
    for (const group of parentStudentDefs) {
      const parentUser = await User.create({
        name: group.parent.name,
        email: group.parent.email,
        password: 'parent123',
        role: 'parent',
        phone: group.parent.phone
      });

      const studentIds = [];
      for (const st of group.students) {
        const bus = busMap[st.busNumber];
        const route = await Route.findById(bus.routeId);
        const stop = route.stops.find(s => s.stopId === st.stopId) || route.stops[0];

        // determine realistic status based on bus location
        let studentStatus = 'waiting';
        const busPolyIdx = bus.simulationState.polyIndex;
        if (stop.polyIndex < busPolyIdx) {
          studentStatus = 'boarded';
        }

        const student = await Student.create({
          name: st.name,
          rollNumber: st.rollNumber,
          grade: st.grade,
          section: st.section,
          parentId: parentUser._id,
          parentName: parentUser.name,
          parentPhone: parentUser.phone,
          busId: bus._id,
          busNumber: bus.busNumber,
          stopId: stop.stopId,
          stopName: stop.name,
          stopCoordinates: stop.coordinates,
          status: studentStatus,
          lastStatusUpdate: new Date()
        });

        studentIds.push(student._id);
        totalStudents++;
      }

      parentUser.studentIds = studentIds;
      await parentUser.save();
    }
    console.log(`[Seed] Seeded ${parentStudentDefs.length} parents and ${totalStudents} students.`);

    // 6. Seed Sample Live Notifications
    await Notification.create([
      {
        title: 'Morning Route Initiated',
        message: 'Bus SW-01 departed from Uppal Ring Road on schedule.',
        type: 'trip_start',
        busNumber: 'SW-01',
        recipientRole: 'all',
        timestamp: new Date(Date.now() - 1000 * 60 * 12)
      },
      {
        title: 'Student Boarded',
        message: 'Aarav Sharma boarded Bus SW-01 at Ramanthapur X Roads.',
        type: 'student_boarded',
        busNumber: 'SW-01',
        studentName: 'Aarav Sharma',
        stopName: 'Ramanthapur X Roads',
        recipientRole: 'parent',
        timestamp: new Date(Date.now() - 1000 * 60 * 8)
      },
      {
        title: 'Approaching Stop',
        message: 'Bus SW-04 is approaching Narapally Junction (ETA: 4 mins).',
        type: 'approaching_stop',
        busNumber: 'SW-04',
        stopName: 'Narapally Junction',
        recipientRole: 'all',
        timestamp: new Date(Date.now() - 1000 * 60 * 2)
      }
    ]);

    console.log('\n============================================================');
    console.log('   🏫 SCHOOLWAY - HYDERABAD FLEET SEEDING COMPLETE!   ');
    console.log('============================================================');
    console.log('🔑 DEMO CREDENTIALS:');
    console.log('------------------------------------------------------------');
    console.log('👑 Admin:');
    console.log('   Email:    admin@schoolway.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👨‍👩‍👦 Parents:');
    console.log('   Email:    vikram.parent@schoolway.com  (Child: Aarav, Bus SW-01, Ramanthapur)');
    console.log('   Password: parent123');
    console.log('   Email:    sneha.parent@schoolway.com   (Child: Ananya, Bus SW-04, Narapally)');
    console.log('   Password: parent123');
    console.log('');
    console.log('🚌 Drivers:');
    console.log('   Email:    rajesh.driver@schoolway.com  (Route A: Uppal <-> LB Nagar, Bus SW-01)');
    console.log('   Password: driver123');
    console.log('   Email:    venkat.driver@schoolway.com  (Route B: Ghatkesar <-> Uppal, Bus SW-04)');
    console.log('   Password: driver123');
    console.log('------------------------------------------------------------\n');

    return { success: true };
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    throw err;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] Seeding finished successfully. Exiting.');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
