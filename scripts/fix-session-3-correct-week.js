import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Session from '../models/Session.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';

async function fixSession3CorrectWeek() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get enrollment to calculate correct week
    const enrollment = await ProgramEnrollment.findById('68d6cfd1b3995f5f9b150e2f');
    if (!enrollment) {
      console.log('❌ Enrollment not found');
      return;
    }

    const enrollmentDate = new Date(enrollment.createdAt);
    console.log(`Enrollment Date: ${enrollmentDate.toISOString().split('T')[0]}`);

    // Find Session 3
    const session3 = await Session.findOne({ sessionNumber: 3 });
    if (session3) {
      console.log('Found Session 3:');
      console.log(`  Current week: ${session3.week}`);
      console.log(`  Current date: ${session3.scheduledDate.toISOString().split('T')[0]}`);
      
      // Calculate correct week 3 date
      const correctWeek3Date = new Date(enrollmentDate);
      correctWeek3Date.setDate(enrollmentDate.getDate() + (3 - 1) * 7); // Week 3 = enrollment + 14 days
      
      console.log(`  Correct Week 3 date: ${correctWeek3Date.toISOString().split('T')[0]}`);
      
      // Update to week 3 and correct date
      session3.week = 3;
      session3.scheduledDate = correctWeek3Date;
      await session3.save();
      
      console.log('✅ Updated Session 3 to Week 3 with correct date');
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

fixSession3CorrectWeek();
