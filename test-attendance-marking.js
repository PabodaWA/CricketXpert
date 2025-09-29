const mongoose = require('mongoose');
const Attendance = require('./models/Attendance.js');
const Session = require('./models/Session.js');

// Test script to verify attendance marking is working
async function testAttendanceMarking() {
  try {
    console.log('=== TESTING ATTENDANCE MARKING ===');
    
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
    
    // Check current attendance records
    const beforeRecords = await Attendance.find({ session: session._id });
    console.log(`Before: ${beforeRecords.length} attendance records`);
    
    // Simulate attendance marking
    console.log('\n=== SIMULATING ATTENDANCE MARKING ===');
    
    for (const participant of session.participants) {
      if (participant.user) {
        console.log(`Marking attendance for ${participant.user.firstName} ${participant.user.lastName}`);
        
        // Update session participant
        participant.attended = true;
        participant.attendanceStatus = 'present';
        participant.attendanceMarkedAt = new Date();
        
        // Create attendance record
        const attendanceRecord = new Attendance({
          session: session._id,
          participant: participant.user._id,
          coach: session.coach,
          attended: true,
          status: 'present',
          attendanceMarkedAt: new Date(),
          performance: {},
          remarks: '',
          markedBy: participant.user._id
        });
        
        try {
          await attendanceRecord.save();
          console.log(`✅ Created attendance record: ${attendanceRecord._id}`);
        } catch (error) {
          console.error(`❌ Error creating attendance record:`, error.message);
        }
      }
    }
    
    // Save session
    try {
      await session.save();
      console.log('✅ Session saved successfully');
    } catch (error) {
      console.error('❌ Error saving session:', error.message);
    }
    
    // Check attendance records after
    const afterRecords = await Attendance.find({ session: session._id });
    console.log(`After: ${afterRecords.length} attendance records`);
    
    // Verify session participants
    const verifySession = await Session.findById(session._id);
    console.log('\nSession participants after marking:');
    verifySession.participants.forEach((p, index) => {
      console.log(`Participant ${index + 1}:`, {
        name: p.user?.firstName || 'Unknown',
        attended: p.attended,
        attendanceStatus: p.attendanceStatus,
        attendanceMarkedAt: p.attendanceMarkedAt
      });
    });
    
    // Check attendance records
    console.log('\nAttendance records:');
    afterRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        id: record._id,
        session: record.session,
        participant: record.participant,
        attended: record.attended,
        status: record.status
      });
    });
    
  } catch (error) {
    console.error('Error testing attendance marking:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
testAttendanceMarking();
