import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import models
import Session from '../models/Session.js';

async function fixSessionWeeks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all sessions
    const sessions = await Session.find({}).sort({ createdAt: 1 });
    console.log(`Found ${sessions.length} sessions`);

    // Group sessions by enrollment
    const sessionsByEnrollment = {};
    
    for (const session of sessions) {
      const enrollmentId = session.participants?.[0]?.enrollment?.toString();
      if (enrollmentId) {
        if (!sessionsByEnrollment[enrollmentId]) {
          sessionsByEnrollment[enrollmentId] = [];
        }
        sessionsByEnrollment[enrollmentId].push(session);
      }
    }

    console.log(`Found ${Object.keys(sessionsByEnrollment).length} enrollments with sessions`);

    // Update each enrollment's sessions
    for (const [enrollmentId, enrollmentSessions] of Object.entries(sessionsByEnrollment)) {
      console.log(`\n=== Processing Enrollment ${enrollmentId} ===`);
      console.log(`Found ${enrollmentSessions.length} sessions`);
      
      // Sort sessions by creation date
      enrollmentSessions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Update each session with correct week and date
      for (let i = 0; i < enrollmentSessions.length; i++) {
        const session = enrollmentSessions[i];
        const sessionNumber = i + 1;
        const weekNumber = sessionNumber; // Each session gets its own week
        
        // Calculate new date (7 days apart)
        const baseDate = new Date(session.scheduledDate);
        const newDate = new Date(baseDate);
        newDate.setDate(baseDate.getDate() + (weekNumber - 1) * 7);
        
        console.log(`Session ${sessionNumber}:`);
        console.log(`  Old date: ${session.scheduledDate.toISOString().split('T')[0]}`);
        console.log(`  New date: ${newDate.toISOString().split('T')[0]}`);
        console.log(`  Week: ${weekNumber}`);
        
        // Update the session
        await Session.findByIdAndUpdate(session._id, {
          sessionNumber: sessionNumber,
          week: weekNumber,
          scheduledDate: newDate,
          bookingDeadline: new Date(newDate.getTime() - 24 * 60 * 60 * 1000)
        });
        
        console.log(`  ✅ Updated`);
      }
    }

    console.log('\n✅ All sessions updated successfully!');
    
    // Show final results
    const updatedSessions = await Session.find({}).sort({ createdAt: 1 });
    console.log('\n=== FINAL SESSION SCHEDULE ===');
    
    for (const [enrollmentId, enrollmentSessions] of Object.entries(sessionsByEnrollment)) {
      console.log(`\nEnrollment ${enrollmentId}:`);
      const updatedSessionsForEnrollment = await Session.find({
        'participants.enrollment': enrollmentId
      }).sort({ sessionNumber: 1 });
      
      updatedSessionsForEnrollment.forEach(session => {
        console.log(`  Session ${session.sessionNumber} (Week ${session.week}): ${session.scheduledDate.toISOString().split('T')[0]}`);
      });
    }

  } catch (error) {
    console.error('❌ Error fixing session weeks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
fixSessionWeeks();
