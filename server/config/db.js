import mongoose from 'mongoose';
import config from './index.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 1000,
      connectTimeoutMS: 1000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Don't exit — allow the app to run in demo mode without DB
    console.warn('⚠️  Running in demo mode without database');
    return null;
  }
};

export default connectDB;
