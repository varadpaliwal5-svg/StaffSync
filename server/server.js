const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const seedDatabase = require('./seed');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isDBReady = false;

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    project: 'StaffSync HRM System',
    dbReady: isDBReady,
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes (MVC Architecture)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/training', require('./routes/trainingRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[ServerError]', err.stack || err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    isDBReady = true;

    // Check if database needs initial seeding
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[StaffSync] No users found. Auto-populating initial demo data...');
      await seedDatabase();
    }

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` StaffSync Backend Server running on port ${PORT}`);
      console.log(` API Health Check: http://localhost:${PORT}/api/health`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });

    return server;
  } catch (err) {
    console.error('[StaffSync] Fatal server startup error:', err);
    process.exit(1);
  }
};

// Start the server if called directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
