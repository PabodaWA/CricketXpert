// SIMPLE ATTENDANCE FIX - This will definitely work
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance.js');
const Session = require('./models/Session.js');

// Simple function to mark attendance - NO COMPLEX LOGIC
async function markAttendanceSimple(sessionId, participantId, attended) {
  try {
    console.log('=== SIMPLE ATTENDANCE MARKING ===');
    console.log('Session ID:', sessionId);
    console.log('Participant ID:', participantId);
    console.log('Attended:', attended);
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/your-database-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Step 1: Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      console.log('❌ Session not found');
      return false;
    }
    console.log('✅ Session found:', session.title);
    
    // Step 2: Find the participant in the session
    const participant = session.participants.find(p => 
      p._id.toString() === participantId || 
      p.user.toString() === participantId
    );
    
    if (!participant) {
      console.log('❌ Participant not found in session');
      return false;
    }
    console.log('✅ Participant found');
    
    // Step 3: Update session participant data
    participant.attended = attended;
    participant.attendanceStatus = attended ? 'present' : 'absent';
    participant.attendanceMarkedAt = new Date();
    
    console.log('✅ Updated session participant data');
    
    // Step 4: Save the session
    await session.save();
    console.log('✅ Session saved to database');
    
    // Step 5: Create attendance record
    const attendanceRecord = new Attendance({
      session: sessionId,
      participant: participant.user,
      coach: session.coach,
      attended: attended,
      status: attended ? 'present' : 'absent',
      attendanceMarkedAt: new Date(),
      performance: {},
      remarks: '',
      markedBy: participant.user
    });
    
    await attendanceRecord.save();
    console.log('✅ Attendance record created:', attendanceRecord._id);
    
    // Step 6: Verify everything worked
    const verifySession = await Session.findById(sessionId);
    const verifyAttendance = await Attendance.findOne({
      session: sessionId,
      participant: participant.user
    });
    
    console.log('=== VERIFICATION ===');
    console.log('Session participant attended:', verifySession.participants.find(p => p._id.toString() === participant._id.toString())?.attended);
    console.log('Attendance record exists:', !!verifyAttendance);
    console.log('Attendance record attended:', verifyAttendance?.attended);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Test the function
async function testSimpleAttendance() {
  console.log('Testing simple attendance marking...');
  
  // You need to replace these with actual IDs from your database
  const sessionId = 'YOUR_SESSION_ID_HERE';
  const participantId = 'YOUR_PARTICIPANT_ID_HERE';
  const attended = true;
  
  const success = await markAttendanceSimple(sessionId, participantId, attended);
  
  if (success) {
    console.log('✅ SUCCESS: Attendance marked successfully!');
  } else {
    console.log('❌ FAILED: Attendance marking failed');
  }
}

// Export the function
module.exports = { markAttendanceSimple };

// Run test if called directly
if (require.main === module) {
  testSimpleAttendance();
}
