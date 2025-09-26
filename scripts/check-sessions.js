import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Session from '../models/Session.js';

async function checkSessions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const sessions = await Session.find({}).sort({ sessionNumber: 1 });
    console.log('Current sessions:');
    sessions.forEach(session => {
      console.log(`Session ${session.sessionNumber}: Week ${session.week}, Date: ${session.scheduledDate.toISOString().split('T')[0]}`);
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSessions();
