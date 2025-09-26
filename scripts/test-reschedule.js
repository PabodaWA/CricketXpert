import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Session from '../models/Session.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';
import Coach from '../models/Coach.js';
import Ground from '../models/Ground.js';

async function testReschedule() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get Session 2
    const session = await Session.findById('68d6ee6180ad888b4b365554')
      .populate('coach', 'userId')
      .populate('ground', 'name location totalSlots');

    if (!session) {
      console.log('❌ Session not found');
      return;
    }

    console.log('Session details:');
    console.log(`  ID: ${session._id}`);
    console.log(`  Session Number: ${session.sessionNumber}`);
    console.log(`  Week: ${session.week}`);
    console.log(`  Current Date: ${session.scheduledDate.toISOString().split('T')[0]}`);

    // Get enrollment
    const enrollment = await ProgramEnrollment.findById(session.participants[0].enrollment);
    if (!enrollment) {
      console.log('❌ Enrollment not found');
      return;
    }

    const enrollmentDate = new Date(enrollment.createdAt);
    console.log(`  Enrollment Date: ${enrollmentDate.toISOString().split('T')[0]}`);

    // Test week calculation
    const originalWeek = session.week;
    const startOfWeek = new Date(enrollmentDate);
    startOfWeek.setDate(enrollmentDate.getDate() + (originalWeek - 1) * 7);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    console.log('\nWeek boundaries:');
    console.log(`  Start of Week ${originalWeek}: ${startOfWeek.toISOString().split('T')[0]}`);
    console.log(`  End of Week ${originalWeek}: ${endOfWeek.toISOString().split('T')[0]}`);

    // Test with October 17th (should be in Week 2)
    const testDate = new Date('2025-10-17');
    console.log(`\nTesting with date: ${testDate.toISOString().split('T')[0]}`);
    console.log(`  Is within week: ${testDate >= startOfWeek && testDate <= endOfWeek}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testReschedule();
