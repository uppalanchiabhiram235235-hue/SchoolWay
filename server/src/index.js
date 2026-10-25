const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketHandler');
const simulator = require('./simulator/busSimulator');

// Import routes
const authRoutes = require('./routes/auth');
const busRoutes = require('./routes/buses');
const routeRoutes = require('./routes/routes');
const tripRoutes = require('./routes/trips');
const studentRoutes = require('./routes/students');
const notificationRoutes = require('./routes/notifications');
const simulatorRoutes = require('./routes/simulator');
const lostItemRoutes = require('./routes/lostItems');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Attach io to app
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/lost-items', lostItemRoutes);

// Root healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SchoolWay Fleet Server',
    simulatorRunning: simulator.isRunning,
    simulatorMode: simulator.getMode(),
    timestamp: new Date()
  });
});

const fs = require('fs');
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ServerError]', err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Initialize Sockets
    initSocket(io);

    // 3. Start Continuous Bus Simulator
    await simulator.init(io);

    // 4. Seed default Lost & Found items if empty
    const { seedLostItemsIfEmpty } = require('./seed/seedLostItems');
    await seedLostItemsIfEmpty();

    // 5. Start HTTP Server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🚀 SCHOOLWAY SERVER LIVE AT http://localhost:${PORT}`);
      console.log(`🚌 Continuous Bus Simulator: ACTIVE (Mode: ${simulator.getMode().toUpperCase()})`);
      console.log(`📡 WebSocket endpoint ready`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Fatal error starting SchoolWay server:', err);
    process.exit(1);
  }
}

startServer();
