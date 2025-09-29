const mongoose = require('mongoose');
const Attendance = require('./models/Attendance.js');
const Session = require('./models/Session.js');
const ProgramEnrollment = require('./models/ProgramEnrollment.js');

// Debug script to investigate attendance issue
async function debugAttendanceIssue() {
  try {
    console.log('=== DEBUGGING ATTENDANCE ISSUE ===');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/your-database-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find the specific user "Medhani Weerasinghe"
    const user = await ProgramEnrollment.findOne({
      'user.firstName': 'Medhani',
      'user.lastName': 'Weerasinghe'
    }).populate('user', 'firstName lastName email');
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Found user:', {
      id: user.user._id,
      name: `${user.user.firstName} ${user.user.lastName}`,
      email: user.user.email
    });
    
    // Find all sessions for this user's program
    const sessions = await Session.find({
      program: user.program
    }).populate('participants.user', 'firstName lastName email');
    
    console.log('Found sessions for program:', sessions.length);
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`, {
        id: session._id,
        title: session.title,
        scheduledDate: session.scheduledDate,
        participants: session.participants.length
      });
    });
    
    // Find all attendance records for this user
    const attendanceRecords = await Attendance.find({
      participant: user.user._id
    }).populate('session', 'title scheduledDate');
    
    console.log('Found attendance records:', attendanceRecords.length);
    attendanceRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        id: record._id,
        session: record.session?.title || 'N/A',
        sessionId: record.session?._id || 'N/A',
        attended: record.attended,
        status: record.status,
        attendanceMarkedAt: record.attendanceMarkedAt
      });
    });
    
    // Check for duplicates
    const sessionIds = attendanceRecords.map(r => r.session?._id?.toString()).filter(Boolean);
    const uniqueSessionIds = [...new Set(sessionIds)];
    
    console.log('Session IDs in attendance records:', sessionIds);
    console.log('Unique session IDs:', uniqueSessionIds);
    console.log('Duplicate session IDs:', sessionIds.length !== uniqueSessionIds.length);
    
    if (sessionIds.length !== uniqueSessionIds.length) {
      console.log('DUPLICATE RECORDS FOUND!');
      
      // Find duplicates
      const duplicates = {};
      sessionIds.forEach(sessionId => {
        duplicates[sessionId] = (duplicates[sessionId] || 0) + 1;
      });
      
      Object.entries(duplicates).forEach(([sessionId, count]) => {
        if (count > 1) {
          console.log(`Session ${sessionId} has ${count} attendance records`);
        }
      });
    }
    
    // Check session participants for attendance data
    console.log('\n=== SESSION PARTICIPANTS ATTENDANCE ===');
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1} (${session._id}):`);
      const participant = session.participants.find(p => 
        p.user && p.user._id.toString() === user.user._id.toString()
      );
      
      if (participant) {
        console.log('  Participant data:', {
          attended: participant.attended,
          attendanceStatus: participant.attendanceStatus,
          attendanceMarkedAt: participant.attendanceMarkedAt
        });
      } else {
        console.log('  No participant found for this user');
      }
    });
    
  } catch (error) {
    console.error('Error debugging attendance issue:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the debug
debugAttendanceIssue();
