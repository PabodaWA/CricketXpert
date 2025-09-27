import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Session from '../models/Session.js';

async function fixSession3Week() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find Session 3
    const session3 = await Session.findOne({ sessionNumber: 3 });
    if (session3) {
      console.log('Found Session 3:');
      console.log(`  Current week: ${session3.week}`);
      console.log(`  Current date: ${session3.scheduledDate.toISOString().split('T')[0]}`);
      
      // Update to week 3
      session3.week = 3;
      await session3.save();
      
      console.log('✅ Updated Session 3 to Week 3');
    } else {
      console.log('❌ Session 3 not found');
    }

    // Check all sessions
    const sessions = await Session.find({}).sort({ sessionNumber: 1 });
    console.log('\nUpdated sessions:');
    sessions.forEach(session => {
      console.log(`Session ${session.sessionNumber}: Week ${session.week}, Date: ${session.scheduledDate.toISOString().split('T')[0]}`);
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixSession3Week();
