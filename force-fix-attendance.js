const mongoose = require('mongoose');
const Attendance = require('./models/Attendance.js');
const Session = require('./models/Session.js');
const ProgramEnrollment = require('./models/ProgramEnrollment.js');

// FORCE FIX: Completely eliminate attendance duplication
async function forceFixAttendance() {
  try {
    console.log('=== FORCE FIXING ATTENDANCE DUPLICATION ===');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/your-database-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // STEP 1: Find the problematic user
    const user = await ProgramEnrollment.findOne({
      'user.email': 'wseetha71@gmail.com'
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
    
    // STEP 2: Find ALL attendance records for this user
    const allUserRecords = await Attendance.find({
      participant: user.user._id
    }).populate('session', 'title scheduledDate');
    
    console.log(`\nFound ${allUserRecords.length} attendance records for this user`);
    allUserRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        id: record._id,
        session: record.session?.title,
        sessionId: record.session?._id,
        attended: record.attended,
        status: record.status,
        attendanceMarkedAt: record.attendanceMarkedAt
      });
    });
    
    // STEP 3: Group by session to find duplicates
    const recordsBySession = {};
    allUserRecords.forEach(record => {
      const sessionId = record.session._id.toString();
      if (!recordsBySession[sessionId]) {
        recordsBySession[sessionId] = [];
      }
      recordsBySession[sessionId].push(record);
    });
    
    console.log(`\nGrouped by session:`);
    Object.entries(recordsBySession).forEach(([sessionId, records]) => {
      console.log(`Session ${sessionId}: ${records.length} records`);
    });
    
    // STEP 4: Delete ALL attendance records for this user
    console.log(`\nDELETING ALL attendance records for user ${user.user.email}`);
    const deleteResult = await Attendance.deleteMany({
      participant: user.user._id
    });
    console.log(`Deleted ${deleteResult.deletedCount} attendance records`);
    
    // STEP 5: Find sessions for this user's program
    const sessions = await Session.find({
      program: user.program
    }).populate('participants.user', 'firstName lastName email');
    
    console.log(`\nFound ${sessions.length} sessions for program`);
    
    // STEP 6: Recreate attendance records based on session participant data
    let recreatedCount = 0;
    for (const session of sessions) {
      const participant = session.participants.find(p => 
        p.user && p.user._id.toString() === user.user._id.toString()
      );
      
      if (participant && (participant.attended === true || participant.attended === false)) {
        console.log(`Recreating attendance record for session ${session.title}:`);
        console.log(`  - Attended: ${participant.attended}`);
        console.log(`  - Status: ${participant.attendanceStatus}`);
        console.log(`  - Marked at: ${participant.attendanceMarkedAt}`);
        
        // Create ONE attendance record for this session
        const newRecord = new Attendance({
          session: session._id,
          participant: user.user._id,
          coach: session.coach,
          attended: participant.attended,
          status: participant.attended ? 'present' : 'absent',
          attendanceMarkedAt: participant.attendanceMarkedAt || new Date(),
          performance: participant.performance || {},
          remarks: participant.remarks || '',
          markedBy: user.user._id
        });
        
        await newRecord.save();
        recreatedCount++;
        console.log(`  ✅ Created record: ${newRecord._id}`);
      } else {
        console.log(`No attendance marked for session ${session.title}`);
      }
    }
    
    console.log(`\nRecreated ${recreatedCount} attendance records`);
    
    // STEP 7: Verify final state
    const finalRecords = await Attendance.find({
      participant: user.user._id
    }).populate('session', 'title scheduledDate');
    
    console.log(`\nFinal verification:`);
    console.log(`Total records: ${finalRecords.length}`);
    finalRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, {
        session: record.session?.title,
        attended: record.attended,
        status: record.status
      });
    });
    
    // STEP 8: Calculate correct statistics
    const presentCount = finalRecords.filter(r => r.attended === true).length;
    const absentCount = finalRecords.filter(r => r.attended === false).length;
    const totalSessions = user.program.duration || 1;
    const progressPercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
    
    console.log(`\nCORRECTED STATISTICS:`);
    console.log(`- Present: ${presentCount}`);
    console.log(`- Absent: ${absentCount}`);
    console.log(`- Total Sessions: ${totalSessions}`);
    console.log(`- Progress: ${progressPercentage}%`);
    console.log(`- Should show: ${presentCount} attended / ${totalSessions} sessions`);
    
  } catch (error) {
    console.error('Error force fixing attendance:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the force fix
forceFixAttendance();
