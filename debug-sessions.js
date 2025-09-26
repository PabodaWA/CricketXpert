import mongoose from 'mongoose';
import Session from './models/Session.js';
import ProgramEnrollment from './models/ProgramEnrollment.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cricketcoaching', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugSessions() {
  try {
    console.log('=== DEBUGGING SESSIONS ===');
    
    // Find the specific enrollment
    const enrollment = await ProgramEnrollment.findById('68d43983b4fb08864e9916f2');
    console.log('Enrollment found:', enrollment ? 'YES' : 'NO');
    if (enrollment) {
      console.log('Enrollment program:', enrollment.program);
      console.log('Enrollment sessions array:', enrollment.sessions);
    }
    
    // Find all sessions for this enrollment
    const sessions = await Session.find({
      'participants.enrollment': '68d43983b4fb08864e9916f2'
    }).populate('program', 'title duration');
    
    console.log('\n=== SESSIONS FOUND ===');
    console.log('Total sessions:', sessions.length);
    
    sessions.forEach((session, index) => {
      console.log(`\nSession ${index + 1}:`);
      console.log('  ID:', session._id);
      console.log('  Title:', session.title);
      console.log('  Session Number:', session.sessionNumber);
      console.log('  Week:', session.week);
      console.log('  Program:', session.program?.title);
      console.log('  Participants:', session.participants?.length || 0);
    });
    
    // Check for duplicates
    const sessionNumbers = sessions.map(s => s.sessionNumber);
    const weeks = sessions.map(s => s.week);
    
    console.log('\n=== DUPLICATE ANALYSIS ===');
    console.log('Session Numbers:', sessionNumbers);
    console.log('Weeks:', weeks);
    
    const duplicateNumbers = sessionNumbers.filter((num, index) => sessionNumbers.indexOf(num) !== index);
    const duplicateWeeks = weeks.filter((week, index) => weeks.indexOf(week) !== index);
    
    console.log('Duplicate Session Numbers:', duplicateNumbers);
    console.log('Duplicate Weeks:', duplicateWeeks);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugSessions();

