import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import ProgramEnrollment from '../models/ProgramEnrollment.js';

async function checkWeekDates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get enrollment
    const enrollment = await ProgramEnrollment.findById('68d6cfd1b3995f5f9b150e2f');
    if (!enrollment) {
      console.log('❌ Enrollment not found');
      return;
    }

    const enrollmentDate = new Date(enrollment.createdAt);
    console.log(`Enrollment Date: ${enrollmentDate.toISOString().split('T')[0]}`);

    // Calculate all week boundaries
    for (let week = 1; week <= 3; week++) {
      const startOfWeek = new Date(enrollmentDate);
      startOfWeek.setDate(enrollmentDate.getDate() + (week - 1) * 7);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      console.log(`\nWeek ${week}:`);
      console.log(`  Start: ${startOfWeek.toISOString().split('T')[0]}`);
      console.log(`  End: ${endOfWeek.toISOString().split('T')[0]}`);
    }

    // Check October 17th
    const testDate = new Date('2025-10-17');
    console.log(`\nOctober 17th (${testDate.toISOString().split('T')[0]}) is in:`);
    
    for (let week = 1; week <= 3; week++) {
      const startOfWeek = new Date(enrollmentDate);
      startOfWeek.setDate(enrollmentDate.getDate() + (week - 1) * 7);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const isInWeek = testDate >= startOfWeek && testDate <= endOfWeek;
      console.log(`  Week ${week}: ${isInWeek ? 'YES' : 'NO'}`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkWeekDates();
