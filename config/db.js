// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not configured in the environment');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (err.message.includes('whitelisted') || err.message.includes('Could not connect to any servers')) {
      console.error('Check that this machine IP is allowed in MongoDB Atlas Network Access and that the cluster is running.');
    } else if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
      console.error('Check the MongoDB URI, DNS/network access, VPN, and firewall settings.');
    }
    throw err;
  }
};

export default connectDB;