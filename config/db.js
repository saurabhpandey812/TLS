const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use environment variable or fallback to local MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tls_database';
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Exit if DB connection fails
  }
};

// Export the mongoose instance
const getDb = () => mongoose;

module.exports = { connectDB, getDb };
