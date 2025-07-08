const mongoose = require('mongoose');
const { mockDb, initializeMockData } = require('./mockDb');

let isUsingMockDb = false;

const connectDB = async () => {
  try {
    // Use environment variable or fallback to local MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tls_database';
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoURI);
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    console.error("Falling back to mock database for development...");
    // Initialize mock database
    initializeMockData();
    isUsingMockDb = true;
    console.log("Mock database initialized successfully");
  }
};

// Export the database instance (either mongoose or mock)
const getDb = () => {
  if (isUsingMockDb) {
    return mockDb;
  }
  return mongoose;
};

module.exports = { connectDB, getDb, isUsingMockDb };
