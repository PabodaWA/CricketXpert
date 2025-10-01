const mongoose = require('mongoose');
const Attendance = require('./models/Attendance.js');
const Session = require('./models/Session.js');

// Test script to verify attendance system is working
async function testAttendanceSystem() {
  try {
    console.log('=== TESTING ATTENDANCE SYSTEM ===');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/your-database-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find a session with participants
    const session = await Session.findOne({})
      .populate('participants.user', 'firstName lastName email')
      .populate('coach', 'userId');
    
    if (!session) {
      console.log('No sessions found in database');
      return;
    }
    
    console.log('Found session:', {
      id: session._id,
      title: session.title,
      participants: session.participants.length
    });
    
    // Check if there are any attendance records for this session
    const attendanceRecords = await Attendance.find({ session: session._id })
      .populate('participant', 'firstName lastName email');
    
    console.log('Attendance records found:', attendanceRecords.length);
    
    if (attendanceRecords.length > 0) {
      console.log('Attendance records:');
      attendanceRecords.forEach(record => {
        console.log(`- Participant: ${record.participant?.firstName} ${record.participant?.lastName}`);
        console.log(`  Attended: ${record.attended}`);
        console.log(`  Status: ${record.status}`);
        console.log(`  Marked at: ${record.attendanceMarkedAt}`);
      });
    } else {
      console.log('No attendance records found for this session');
    }
    
    // Check session participants for attendance data
    console.log('\nSession participants:');
    session.participants.forEach((participant, index) => {
      console.log(`Participant ${index + 1}:`);
      console.log(`  User: ${participant.user?.firstName} ${participant.user?.lastName}`);
      console.log(`  Attended: ${participant.attended}`);
      console.log(`  Attendance Status: ${participant.attendanceStatus}`);
      console.log(`  Attendance Marked At: ${participant.attendanceMarkedAt}`);
    });
    
  } catch (error) {
    console.error('Error testing attendance system:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
testAttendanceSystem();