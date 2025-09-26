import mongoose from 'mongoose';
import User from './models/User.js';
import Session from './models/Session.js';
import Attendance from './models/Attendance.js';
import ProgramEnrollment from './models/ProgramEnrollment.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/cricketcoaching');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkSessions = async () => {
  try {
    console.log('=== CHECKING ALL SESSIONS AND ATTENDANCE ===\n');

    // Find all users
    const users = await User.find({}).limit(10);
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });

    // Find all sessions
    const sessions = await Session.find({})
      .populate('participants.user', 'firstName lastName email')
      .populate('program', 'title')
      .sort({ scheduledDate: -1 })
      .limit(20);

    console.log(`\nFound ${sessions.length} sessions:`);
    sessions.forEach((session, index) => {
      console.log(`\n${index + 1}. Session: ${session.title || 'N/A'}`);
      console.log(`   ID: ${session._id}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Date: ${session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   Participants: ${session.participants.length}`);
      
      session.participants.forEach((participant, pIndex) => {
        console.log(`     ${pIndex + 1}. ${participant.user?.firstName || 'N/A'} ${participant.user?.lastName || 'N/A'} - Attended: ${participant.attended}`);
      });
    });

    // Find all attendance records
    const attendanceRecords = await Attendance.find({})
      .populate('participant', 'firstName lastName email')
      .populate('session', 'title sessionNumber scheduledDate status')
      .sort({ attendanceMarkedAt: -1 })
      .limit(20);

    console.log(`\nFound ${attendanceRecords.length} attendance records:`);
    attendanceRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Attendance Record:`);
      console.log(`   Participant: ${record.participant?.firstName || 'N/A'} ${record.participant?.lastName || 'N/A'}`);
      console.log(`   Session: ${record.session?.title || 'N/A'} (${record.session?.sessionNumber || 'N/A'})`);
      console.log(`   Attended: ${record.attended}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Marked At: ${record.attendanceMarkedAt ? new Date(record.attendanceMarkedAt).toLocaleString() : 'N/A'}`);
    });

    // Check for completed sessions specifically
    const completedSessions = await Session.find({ status: 'completed' })
      .populate('participants.user', 'firstName lastName email')
      .populate('program', 'title');

    console.log(`\n=== COMPLETED SESSIONS ===`);
    console.log(`Found ${completedSessions.length} completed sessions:`);
    
    completedSessions.forEach((session, index) => {
      console.log(`\n${index + 1}. ${session.title || 'N/A'}`);
      console.log(`   Date: ${session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   Participants: ${session.participants.length}`);
      
      session.participants.forEach((participant, pIndex) => {
        console.log(`     ${pIndex + 1}. ${participant.user?.firstName || 'N/A'} ${participant.user?.lastName || 'N/A'} - Attended: ${participant.attended}`);
      });
    });

  } catch (error) {
    console.error('Error checking sessions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
};

// Run the check
connectDB().then(() => {
  checkSessions();
});