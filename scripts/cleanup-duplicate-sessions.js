import mongoose from 'mongoose';
import Session from '../models/Session.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cricketcoaching', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function cleanupDuplicateSessions() {
  try {
    console.log('Starting cleanup of duplicate sessions...');
    
    // Find all sessions
    const allSessions = await Session.find({}).populate('program');
    
    console.log(`Found ${allSessions.length} total sessions`);
    
    // Group sessions by program and session number
    const sessionGroups = {};
    
    allSessions.forEach(session => {
      const key = `${session.program._id}-${session.sessionNumber}-${session.week}`;
      if (!sessionGroups[key]) {
        sessionGroups[key] = [];
      }
      sessionGroups[key].push(session);
    });
    
    // Find duplicates
    const duplicates = Object.entries(sessionGroups).filter(([key, sessions]) => sessions.length > 1);
    
    console.log(`Found ${duplicates.length} groups with duplicate sessions`);
    
    let removedCount = 0;
    
    for (const [key, sessions] of duplicates) {
      console.log(`\nProcessing duplicate group: ${key}`);
      console.log(`Found ${sessions.length} duplicate sessions`);
      
      // Keep the first session, remove the rest
      const sessionToKeep = sessions[0];
      const sessionsToRemove = sessions.slice(1);
      
      console.log(`Keeping session: ${sessionToKeep._id} (${sessionToKeep.title})`);
      
      for (const sessionToRemove of sessionsToRemove) {
        console.log(`Removing session: ${sessionToRemove._id} (${sessionToRemove.title})`);
        
        // Remove session from enrollments
        await ProgramEnrollment.updateMany(
          { sessions: sessionToRemove._id },
          { $pull: { sessions: sessionToRemove._id } }
        );
        
        // Delete the session
        await Session.findByIdAndDelete(sessionToRemove._id);
        removedCount++;
      }
    }
    
    console.log(`\nCleanup completed! Removed ${removedCount} duplicate sessions.`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the cleanup
cleanupDuplicateSessions();
