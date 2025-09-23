// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cricketcoaching';
    console.log('Connecting to MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Please make sure MongoDB is running or provide a valid MONGO_URI');
    process.exit(1);
  }
};

export default connectDB;