import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Session from '../models/Session.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';

async function fixEnrollmentBasedWeeks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all sessions
    const sessions = await Session.find({}).sort({ createdAt: 1 });
    console.log(`Found ${sessions.length} sessions`);

    // Group sessions by enrollment
    const sessionsByEnrollment = {};
    
    for (const session of sessions) {
      if (session.participants && session.participants.length > 0) {
        const enrollmentId = session.participants[0].enrollment;
        if (!sessionsByEnrollment[enrollmentId]) {
          sessionsByEnrollment[enrollmentId] = [];
        }
        sessionsByEnrollment[enrollmentId].push(session);
      }
    }

    console.log(`Found ${Object.keys(sessionsByEnrollment).length} enrollments with sessions`);

    // Process each enrollment
    for (const [enrollmentId, enrollmentSessions] of Object.entries(sessionsByEnrollment)) {
      console.log(`\n=== Processing Enrollment ${enrollmentId} ===`);
      
      // Get enrollment details
      const enrollment = await ProgramEnrollment.findById(enrollmentId);
      if (!enrollment) {
        console.log('❌ Enrollment not found, skipping...');
        continue;
      }
      
      const enrollmentDate = new Date(enrollment.createdAt);
      console.log(`Enrollment date: ${enrollmentDate.toISOString().split('T')[0]}`);
      
      // Sort sessions by session number
      const sortedSessions = enrollmentSessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
      
      // Update each session with enrollment-based dates
      for (const session of sortedSessions) {
        const originalDate = session.scheduledDate;
        const weekNumber = session.sessionNumber;
        
        // Calculate new date based on enrollment + week number
        const newDate = new Date(enrollmentDate);
        newDate.setDate(enrollmentDate.getDate() + (weekNumber - 1) * 7);
        
        console.log(`Session ${session.sessionNumber}:`);
        console.log(`  Old date: ${originalDate.toISOString().split('T')[0]}`);
        console.log(`  New date: ${newDate.toISOString().split('T')[0]}`);
        console.log(`  Week: ${weekNumber}`);
        
        // Update the session
        session.scheduledDate = newDate;
        session.week = weekNumber;
        await session.save();
        
        console.log(`  ✅ Updated`);
      }
    }

    console.log('\n✅ All sessions updated successfully!');

    // Show final schedule
    console.log('\n=== FINAL SESSION SCHEDULE ===');
    for (const [enrollmentId, enrollmentSessions] of Object.entries(sessionsByEnrollment)) {
      const enrollment = await ProgramEnrollment.findById(enrollmentId);
      if (enrollment) {
        console.log(`\nEnrollment ${enrollmentId}:`);
        const sortedSessions = enrollmentSessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
        for (const session of sortedSessions) {
          console.log(`  Session ${session.sessionNumber} (Week ${session.week}): ${session.scheduledDate.toISOString().split('T')[0]}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error fixing enrollment-based weeks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

fixEnrollmentBasedWeeks();
