const mongoose = require('mongoose');
const net = require('net');

let mongoMemoryServerInstance = null;

// Helper to quickly check if a local port is listening (avoids 3-5s timeout)
const isPortOpen = (port = 27017, host = '127.0.0.1', timeout = 400) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
};

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/staffsync';
  const isLocalDefault = uri.includes('127.0.0.1:27017') || uri.includes('localhost:27017');

  if (isLocalDefault) {
    const localRunning = await isPortOpen(27017, '127.0.0.1', 500);
    if (!localRunning) {
      console.log(`[Database] No local MongoDB daemon detected on port 27017.`);
      console.log(`[Database] Initializing automated in-memory MongoDB for seamless zero-config evaluation...`);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServerInstance = await MongoMemoryServer.create({
          instance: { dbName: 'staffsync' },
        });
        const memoryUri = mongoMemoryServerInstance.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[Database] Connected to in-memory MongoDB: ${memoryUri}`);
        return conn;
      } catch (memErr) {
        console.error(`[Database] Error starting in-memory MongoDB:`, memErr.message);
        throw memErr;
      }
    }
  }

  // Attempt standard MongoDB connection (either local is running or remote Atlas URI provided)
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Could not connect to MongoDB at ${uri}: ${err.message}`);
    console.warn(`[Database] Falling back to automated in-memory MongoDB...`);

    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create({
      instance: { dbName: 'staffsync' },
    });
    const memoryUri = mongoMemoryServerInstance.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[Database] Connected to in-memory MongoDB: ${memoryUri}`);
    return conn;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
    }
  } catch (err) {
    console.error(`[Database] Error during disconnect:`, err.message);
  }
};

module.exports = { connectDB, disconnectDB };
