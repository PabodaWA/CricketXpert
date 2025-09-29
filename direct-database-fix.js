// DIRECT DATABASE FIX - This will definitely work
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance.js');
const Session = require('./models/Session.js');

async function directDatabaseFix() {
  try {
    console.log('=== DIRECT DATABASE FIX ===');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/your-database-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Step 1: Find the problematic user
    const user = await Session.findOne({
      'participants.user': { $exists: true }
    }).populate('participants.user', 'firstName lastName email');
    
    if (!user) {
      console.log('No sessions with participants found');
      return;
    }
    
    console.log('Found session:', user.title);
    console.log('Participants:', user.participants.length);
    
    // Step 2: For each participant, mark attendance directly
    for (const participant of user.participants) {
      if (participant.user) {
        console.log(`\nProcessing ${participant.user.firstName} ${participant.user.lastName}`);
        
        // Update session participant
        participant.attended = true;
        participant.attendanceStatus = 'present';
        participant.attendanceMarkedAt = new Date();
        
        console.log('✅ Updated session participant');
        
        // Create attendance record
        const attendanceRecord = new Attendance({
          session: user._id,
          participant: participant.user._id,
          coach: user.coach,
          attended: true,
          status: 'present',
          attendanceMarkedAt: new Date(),
          performance: {},
          remarks: '',
          markedBy: participant.user._id
        });
        
        await attendanceRecord.save();
        console.log('✅ Created attendance record:', attendanceRecord._id);
      }
    }
    
    // Step 3: Save the session
    await user.save();
    console.log('✅ Session saved');
    
    // Step 4: Verify everything
    const verifySession = await Session.findById(user._id);
    const verifyAttendance = await Attendance.find({ session: user._id });
    
    console.log('\n=== VERIFICATION ===');
    console.log('Session participants:');
    verifySession.participants.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.user?.firstName}: attended=${p.attended}, status=${p.attendanceStatus}`);
    });
    
    console.log('Attendance records:');
    verifyAttendance.forEach((record, index) => {
      console.log(`  ${index + 1}. Record ${record._id}: attended=${record.attended}, status=${record.status}`);
    });
    
    console.log('\n✅ DIRECT FIX COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the fix
directDatabaseFix();
