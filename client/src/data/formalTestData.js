// Formal Test Data for SchoolWay
// Provides instant high-fidelity data for Fleet, Lost & Found, and Test Logins

export const FORMAL_TEST_BUSES = [
  {
    _id: 'bus_sw01_test',
    busNumber: 'SW-01',
    registrationNumber: 'TS-08-UB-4122',
    capacity: 45,
    status: 'moving',
    route: {
      _id: 'route_bhongir_test',
      code: 'ROUTE-BHONIGIR-FWD',
      name: 'Ghatkesar Depot ➔ Bhongir Bypass',
      color: '#10b981'
    },
    routeCode: 'ROUTE-BHONIGIR',
    driver: {
      _id: 'driver_rajesh_test',
      name: 'Rajesh Kumar',
      phone: '+91 98490 12345'
    },
    lastLocation: {
      lat: 17.4725,
      lng: 78.7350,
      speed: 38,
      heading: 68,
      isDwell: false,
      currentStopId: 'ST-BG3',
      currentStopName: 'Pagidipalli Junction',
      nextStopId: 'ST-BG4',
      nextStopName: 'Bibinagar AIIMS Campus',
      etaMinutes: 4,
      lastUpdated: new Date().toISOString()
    },
    location: {
      lat: 17.4725,
      lng: 78.7350,
      timestamp: new Date().toISOString()
    },
    students: [
      { _id: 'stu_aarav', name: 'Aarav Sharma', grade: 'Class 6-B', status: 'boarded', stopName: 'Bibinagar AIIMS' },
      { _id: 'stu_rohit', name: 'Rohit Varma', grade: 'Class 7-A', status: 'boarded', stopName: 'Pagidipalli X Roads' },
      { _id: 'stu_kavya', name: 'Kavya Nair', grade: 'Class 5-C', status: 'waiting', stopName: 'Kondamadugu Bus Shelter' }
    ],
    nextStop: {
      stopId: 'ST-BG4',
      name: 'Bibinagar AIIMS Campus',
      etaMinutes: 4,
      distanceKm: 2.1
    }
  },
  {
    _id: 'bus_sw02_test',
    busNumber: 'SW-02',
    registrationNumber: 'TS-08-UB-4123',
    capacity: 42,
    status: 'moving',
    route: {
      _id: 'route_bhongir_test2',
      code: 'ROUTE-BHONIGIR-REV',
      name: 'Bhongir Bypass ➔ Ghatkesar Depot',
      color: '#10b981'
    },
    routeCode: 'ROUTE-BHONIGIR',
    driver: {
      _id: 'driver_suresh_test',
      name: 'Suresh Goud',
      phone: '+91 98490 23456'
    },
    lastLocation: {
      lat: 17.4980,
      lng: 78.8210,
      speed: 42,
      heading: 72,
      isDwell: false,
      currentStopId: 'ST-BG5',
      currentStopName: 'Kondamadugu X Roads',
      nextStopId: 'ST-BG6',
      nextStopName: 'Bhongir Fort & Bypass Terminal',
      etaMinutes: 7,
      lastUpdated: new Date().toISOString()
    },
    location: {
      lat: 17.4980,
      lng: 78.8210,
      timestamp: new Date().toISOString()
    },
    students: [
      { _id: 'stu_pavan', name: 'Pavan Kalyan', grade: 'Class 8-A', status: 'boarded', stopName: 'Bhongir Fort Road' },
      { _id: 'stu_meera', name: 'Meera Rao', grade: 'Class 6-A', status: 'boarded', stopName: 'Bibinagar Jn' }
    ],
    nextStop: {
      stopId: 'ST-BG6',
      name: 'Bhongir Fort & Bypass Terminal',
      etaMinutes: 7,
      distanceKm: 3.8
    }
  },
  {
    _id: 'bus_sw03_test',
    busNumber: 'SW-03',
    registrationNumber: 'TS-07-EA-7183',
    capacity: 45,
    status: 'moving',
    route: {
      _id: 'route_uppal_test',
      code: 'ROUTE-UPPAL-REV',
      name: 'Ghatkesar Depot ➔ Uppal Metro Junction',
      color: '#6366f1'
    },
    routeCode: 'ROUTE-UPPAL',
    driver: {
      _id: 'driver_imran_test',
      name: 'Mohammed Imran',
      phone: '+91 98490 34567'
    },
    lastLocation: {
      lat: 17.4260,
      lng: 78.6180,
      speed: 35,
      heading: 245,
      isDwell: false,
      currentStopId: 'ST-UP3',
      currentStopName: 'Narapally Flyover Junction',
      nextStopId: 'ST-UP4',
      nextStopName: 'Medipally Kaman Bus Stop',
      etaMinutes: 3,
      lastUpdated: new Date().toISOString()
    },
    location: {
      lat: 17.4260,
      lng: 78.6180,
      timestamp: new Date().toISOString()
    },
    students: [
      { _id: 'stu_ananya', name: 'Ananya Reddy', grade: 'Class 4-A', status: 'boarded', stopName: 'Narapally Junction' },
      { _id: 'stu_sid', name: 'Siddharth Sen', grade: 'Class 5-B', status: 'boarded', stopName: 'Medipally Arch' }
    ],
    nextStop: {
      stopId: 'ST-UP4',
      name: 'Medipally Kaman Bus Stop',
      etaMinutes: 3,
      distanceKm: 1.4
    }
  },
  {
    _id: 'bus_sw04_test',
    busNumber: 'SW-04',
    registrationNumber: 'TS-07-EA-7184',
    capacity: 45,
    status: 'delayed',
    route: {
      _id: 'route_uppal_test2',
      code: 'ROUTE-UPPAL-FWD',
      name: 'Uppal Metro ➔ Ghatkesar Depot',
      color: '#6366f1'
    },
    routeCode: 'ROUTE-UPPAL',
    driver: {
      _id: 'driver_venkat_test',
      name: 'Venkat Rao',
      phone: '+91 98490 45678'
    },
    lastLocation: {
      lat: 17.4080,
      lng: 78.5680,
      speed: 24,
      heading: 250,
      isDwell: false,
      currentStopId: 'ST-UP5',
      currentStopName: 'Peerzadiguda Kaman Stop',
      nextStopId: 'ST-UP6',
      nextStopName: 'Boduppal Main Road',
      etaMinutes: 6,
      lastUpdated: new Date().toISOString()
    },
    location: {
      lat: 17.4080,
      lng: 78.5680,
      timestamp: new Date().toISOString()
    },
    students: [
      { _id: 'stu_varun', name: 'Varun Teja', grade: 'Class 9-B', status: 'waiting', stopName: 'Boduppal Main Road' },
      { _id: 'stu_divya', name: 'Divya Sri', grade: 'Class 3-C', status: 'waiting', stopName: 'Peerzadiguda Kaman' }
    ],
    nextStop: {
      stopId: 'ST-UP6',
      name: 'Boduppal Main Road',
      etaMinutes: 6,
      distanceKm: 2.9
    }
  },
  {
    _id: 'bus_sw05_test',
    busNumber: 'SW-05',
    registrationNumber: 'TS-09-FA-9901',
    capacity: 40,
    status: 'moving',
    route: {
      _id: 'route_ecil_test',
      code: 'ROUTE-ECIL-REV',
      name: 'Ghatkesar Depot ➔ ECIL X Roads',
      color: '#f59e0b'
    },
    routeCode: 'ROUTE-ECIL',
    driver: {
      _id: 'driver_ramesh_test',
      name: 'Ramesh Chary',
      phone: '+91 98490 56789'
    },
    lastLocation: {
      lat: 17.4780,
      lng: 78.6320,
      speed: 36,
      heading: 290,
      isDwell: false,
      currentStopId: 'ST-EC2',
      currentStopName: 'Ghatkesar ORR Outer Junction',
      nextStopId: 'ST-EC3',
      nextStopName: 'Rampally Junction Stop',
      etaMinutes: 5,
      lastUpdated: new Date().toISOString()
    },
    location: {
      lat: 17.4780,
      lng: 78.6320,
      timestamp: new Date().toISOString()
    },
    students: [
      { _id: 'stu_sai', name: 'Sai Krishna', grade: 'Class 7-B', status: 'boarded', stopName: 'Rampally Junction' },
      { _id: 'stu_harini', name: 'Harini M.', grade: 'Class 5-A', status: 'waiting', stopName: 'Nagaram X Roads' }
    ],
    nextStop: {
      stopId: 'ST-EC3',
      name: 'Rampally Junction Stop',
      etaMinutes: 5,
      distanceKm: 2.3
    }
  },
  {
    _id: 'bus_sw06_test',
    busNumber: 'SW-06',
    registrationNumber: 'TS-09-FA-9902',
    capacity: 40,
    status: 'idle',
    route: {
      _id: 'route_ecil_test2',
      code: 'ROUTE-ECIL-FWD',
      name: 'ECIL Depot ➔ Ghatkesar Campus',
      color: '#f59e0b'
    },
    routeCode: 'ROUTE-ECIL',
    driver: {
      _id: 'driver_srinivas_test',
      name: 'K. Srinivas',
      phone: '+91 98490 67890'
    },
    lastLocation: {
      lat: 17.4560,
      lng: 78.6830,
      speed: 0,
      heading: 0,
      isDwell: true,
      currentStopId: 'ST-EC1',
      currentStopName: 'Ghatkesar Central School Depot',
      nextStopId: 'ST-EC1',
      nextStopName: 'Ghatkesar Central School Depot',
      etaMinutes: 0,
      lastUpdated: new Date().toISOString()
    },
    location: {
      lat: 17.4560,
      lng: 78.6830,
      timestamp: new Date().toISOString()
    },
    students: [
      { _id: 'stu_pooja', name: 'Pooja Hegde', grade: 'Class 8-C', status: 'waiting', stopName: 'ECIL Bus Station' }
    ],
    nextStop: {
      stopId: 'ST-EC1',
      name: 'Ghatkesar Central School Depot',
      etaMinutes: 0,
      distanceKm: 0.0
    }
  }
];

export const FORMAL_TEST_ROUTES = [
  {
    _id: 'route_bhongir_fwd',
    code: 'ROUTE-BHONIGIR-FWD',
    name: 'Ghatkesar Depot ➔ Bhongir Bypass (NH 163)',
    color: '#10b981',
    polyline: [
      { lat: 17.4560, lng: 78.6830 },
      { lat: 17.4620, lng: 78.7050 },
      { lat: 17.4725, lng: 78.7350 },
      { lat: 17.4810, lng: 78.7650 },
      { lat: 17.4980, lng: 78.8210 },
      { lat: 17.5120, lng: 78.8910 }
    ],
    stops: [
      { stopId: 'ST-BG1', name: 'Ghatkesar Central School Depot', lat: 17.4560, lng: 78.6830 },
      { stopId: 'ST-BG2', name: 'Ghatkesar RTC Bus Stand', lat: 17.4580, lng: 78.6890 },
      { stopId: 'ST-BG3', name: 'Pagidipalli Junction', lat: 17.4660, lng: 78.7150 },
      { stopId: 'ST-BG4', name: 'Bibinagar AIIMS Campus Stop', lat: 17.4780, lng: 78.7520 },
      { stopId: 'ST-BG5', name: 'Kondamadugu X Roads', lat: 17.4920, lng: 78.8010 },
      { stopId: 'ST-BG6', name: 'Bhongir Fort & Bypass Terminal', lat: 17.5120, lng: 78.8910 }
    ]
  },
  {
    _id: 'route_uppal_fwd',
    code: 'ROUTE-UPPAL-FWD',
    name: 'Ghatkesar Depot ➔ Uppal Metro (Warangal Hwy)',
    color: '#6366f1',
    polyline: [
      { lat: 17.4560, lng: 78.6830 },
      { lat: 17.4480, lng: 78.6650 },
      { lat: 17.4360, lng: 78.6380 },
      { lat: 17.4260, lng: 78.6180 },
      { lat: 17.4160, lng: 78.5880 },
      { lat: 17.4080, lng: 78.5680 },
      { lat: 17.3990, lng: 78.5570 }
    ],
    stops: [
      { stopId: 'ST-UP1', name: 'Ghatkesar Central School Campus', lat: 17.4560, lng: 78.6830 },
      { stopId: 'ST-UP2', name: 'Pocharam Infosys SEZ Gate 1', lat: 17.4480, lng: 78.6650 },
      { stopId: 'ST-UP3', name: 'Narapally Flyover Junction', lat: 17.4360, lng: 78.6380 },
      { stopId: 'ST-UP4', name: 'Medipally Kaman Bus Stop', lat: 17.4260, lng: 78.6180 },
      { stopId: 'ST-UP5', name: 'Peerzadiguda Kaman Stop', lat: 17.4160, lng: 78.5880 },
      { stopId: 'ST-UP6', name: 'Boduppal Main Road', lat: 17.4080, lng: 78.5680 },
      { stopId: 'ST-UP7', name: 'Uppal Metro Station Terminal', lat: 17.3990, lng: 78.5570 }
    ]
  },
  {
    _id: 'route_ecil_fwd',
    code: 'ROUTE-ECIL-FWD',
    name: 'Ghatkesar Depot ➔ ECIL Depot (Keesara Road)',
    color: '#f59e0b',
    polyline: [
      { lat: 17.4560, lng: 78.6830 },
      { lat: 17.4690, lng: 78.6600 },
      { lat: 17.4780, lng: 78.6320 },
      { lat: 17.4890, lng: 78.6010 },
      { lat: 17.4980, lng: 78.5720 },
      { lat: 17.5020, lng: 78.5520 }
    ],
    stops: [
      { stopId: 'ST-EC1', name: 'Ghatkesar Central School Campus', lat: 17.4560, lng: 78.6830 },
      { stopId: 'ST-EC2', name: 'Ghatkesar ORR Outer Junction', lat: 17.4690, lng: 78.6600 },
      { stopId: 'ST-EC3', name: 'Rampally Junction Stop', lat: 17.4780, lng: 78.6320 },
      { stopId: 'ST-EC4', name: 'Nagaram X Roads Bus Stop', lat: 17.4890, lng: 78.6010 },
      { stopId: 'ST-EC5', name: 'Kushaiguda Industrial Area', lat: 17.4980, lng: 78.5720 },
      { stopId: 'ST-EC6', name: 'ECIL X Roads Bus Station', lat: 17.5020, lng: 78.5520 }
    ]
  }
];

export const FORMAL_TEST_LOST_ITEMS = [
  {
    _id: 'item_test_01',
    title: 'Milton Blue Thermosteel Water Bottle (750ml)',
    category: 'Water Bottle',
    description: 'Dark blue insulated stainless steel bottle with school name sticker on the cap. Found under seat 8 near window.',
    busNumber: 'SW-01',
    locationFound: 'Bus SW-01 (Seat 8, Left Window)',
    status: 'available',
    foundDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    reportedBy: {
      name: 'Rajesh Kumar (Driver)',
      role: 'driver',
      phone: '+91 98490 12345'
    },
    pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
  },
  {
    _id: 'item_test_02',
    title: 'Class 6 Science Practical Record Notebook',
    category: 'Books & Notes',
    description: 'Hardcover spiral notebook with brown binding sheet. Student name label on cover: Aarav Sharma (Class 6-B).',
    busNumber: 'SW-01',
    locationFound: 'Bus SW-01 (Front luggage rack)',
    status: 'available',
    foundDate: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(),
    reportedBy: {
      name: 'Rajesh Kumar (Driver)',
      role: 'driver',
      phone: '+91 98490 12345'
    },
    pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
  },
  {
    _id: 'item_test_03',
    title: 'Red Spiderman Double-Deck Pencil Box',
    category: 'Stationery & Pencil Box',
    description: 'Metal geometric stationery box with compass, scale, and color sketch pens inside. Found after morning drop.',
    busNumber: 'SW-03',
    locationFound: 'Bus SW-03 (Seat 14 right aisle)',
    status: 'available',
    foundDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    reportedBy: {
      name: 'Mohammed Imran (Driver)',
      role: 'driver',
      phone: '+91 98490 34567'
    },
    pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
  },
  {
    _id: 'item_test_04',
    title: 'Official School Navy Blazer (Size 32)',
    category: 'Clothing / Uniform',
    description: 'Ghatkesar Central School uniform winter blazer with gold button accents and school embroidered crest on chest.',
    busNumber: 'SW-04',
    locationFound: 'Bus SW-04 (Overhead luggage shelf above Seat 6)',
    status: 'available',
    foundDate: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    reportedBy: {
      name: 'Venkat Rao (Driver)',
      role: 'driver',
      phone: '+91 98490 45678'
    },
    pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
  },
  {
    _id: 'item_test_05',
    title: 'Student Identity Card & Bus Transit Pass',
    category: 'ID Card & Badges',
    description: 'RFID Smart Bus Pass in blue lanyard. Student Name: Ananya Reddy (Class 4-A). Card No: GCS-2026-4401.',
    busNumber: 'SW-03',
    locationFound: 'Bus SW-03 (Driver footboard entry step)',
    status: 'available',
    foundDate: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    reportedBy: {
      name: 'Mohammed Imran (Driver)',
      role: 'driver',
      phone: '+91 98490 34567'
    },
    pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
  },
  {
    _id: 'item_test_06',
    title: 'Wildcraft Grey & Orange Waterproof School Backpack',
    category: 'Bag / Backpack',
    description: '3-compartment school bag containing math textbook, drawing kit, and lunch box. Found on rear bench seat.',
    busNumber: 'SW-02',
    locationFound: 'Bus SW-02 (Rear last row seat)',
    status: 'claimed',
    foundDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    claimedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    claimedBy: {
      parentName: 'Sneha Reddy',
      studentName: 'Pavan Reddy',
      phone: '+91 98490 99881',
      notes: 'Claimed at school reception office.'
    },
    reportedBy: {
      name: 'Suresh Goud (Driver)',
      role: 'driver',
      phone: '+91 98490 23456'
    },
    pickupOffice: 'Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk'
  }
];

export const FORMAL_TEST_ACCOUNTS = [
  {
    role: 'admin',
    roleLabel: '👑 Principal / Admin',
    name: 'Principal Ananya Gupta',
    email: 'admin@schoolway.com',
    password: 'admin123',
    description: 'Full Fleet Command, Route Oversight & Lost/Found Desk',
    user: {
      _id: 'admin_test_01',
      name: 'Principal Ananya Gupta',
      email: 'admin@schoolway.com',
      role: 'admin',
      phone: '+91 98490 00001'
    },
    token: 'formal_test_admin_jwt_token_2026'
  },
  {
    role: 'driver',
    roleLabel: '🚌 Driver (Bus SW-01)',
    name: 'Rajesh Kumar',
    email: 'rajesh.driver@schoolway.com',
    password: 'driver123',
    description: 'Bus SW-01 Cockpit, Passenger Checklist & Item Reporting',
    user: {
      _id: 'driver_test_01',
      name: 'Rajesh Kumar',
      email: 'rajesh.driver@schoolway.com',
      role: 'driver',
      phone: '+91 98490 12345',
      busNumber: 'SW-01'
    },
    token: 'formal_test_driver_jwt_token_2026'
  },
  {
    role: 'parent',
    roleLabel: '👨‍👩‍👦 Parent (Aarav Sharma)',
    name: 'Vikram Sharma',
    email: 'vikram.parent@schoolway.com',
    password: 'parent123',
    description: 'Live Child Transit, Stop ETA & Lost Item Claim Flow',
    user: {
      _id: 'parent_test_01',
      name: 'Vikram Sharma',
      email: 'vikram.parent@schoolway.com',
      role: 'parent',
      phone: '+91 98490 88776',
      students: [
        {
          _id: 'student_test_01',
          name: 'Aarav Sharma',
          grade: 'Class 6-B',
          busId: 'bus_sw01_test',
          busNumber: 'SW-01',
          routeId: 'route_bhongir_fwd',
          stopId: 'ST-BG4',
          stopName: 'Bibinagar AIIMS Campus Stop',
          status: 'boarded',
          parentId: 'parent_test_01'
        }
      ]
    },
    token: 'formal_test_parent_jwt_token_2026',
    students: [
      {
        _id: 'student_test_01',
        name: 'Aarav Sharma',
        grade: 'Class 6-B',
        busId: 'bus_sw01_test',
        busNumber: 'SW-01',
        routeId: 'route_bhongir_fwd',
        stopId: 'ST-BG4',
        stopName: 'Bibinagar AIIMS Campus Stop',
        status: 'boarded',
        parentId: 'parent_test_01'
      }
    ]
  }
];
