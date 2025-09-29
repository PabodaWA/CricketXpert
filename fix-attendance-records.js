const mongoose = require('mongoose');
const Attendance = require('./models/Attendance.js');
const Session = require('./models/Session.js');

// Script to fix attendance records - only keep records for marked attendance
async function fixAttendanceRecords() {
  try {
    console.log('=== FIXING ATTENDANCE RECORDS ===');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/your-database-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find all attendance records
    const allRecords = await Attendance.find({}).populate('session', 'title scheduledDate');
    
    console.log(`Found ${allRecords.length} total attendance records`);
    
    // Check each record to see if it should exist
    let recordsToDelete = [];
    let recordsToKeep = [];
    
    for (const record of allRecords) {
      // Check if the session participant has attendance marked
      const session = await Session.findById(record.session._id);
      
      if (!session) {
        console.log(`Session not found for record ${record._id}, marking for deletion`);
        recordsToDelete.push(record);
        continue;
      }
      
      // Find the participant in the session
      const participant = session.participants.find(p => 
        p.user && p.user.toString() === record.participant.toString()
      );
      
      if (!participant) {
        console.log(`Participant not found in session for record ${record._id}, marking for deletion`);
        recordsToDelete.push(record);
        continue;
      }
      
      // Check if attendance is actually marked in the session
      if (participant.attended === true || participant.attended === false) {
        console.log(`Record ${record._id} is valid - attendance is marked as ${participant.attended}`);
        recordsToKeep.push(record);
      } else {
        console.log(`Record ${record._id} should be deleted - attendance not marked in session`);
        recordsToDelete.push(record);
      }
    }
    
    console.log(`\nRecords to keep: ${recordsToKeep.length}`);
    console.log(`Records to delete: ${recordsToDelete.length}`);
    
    // Delete invalid records
    let deletedCount = 0;
    for (const record of recordsToDelete) {
      console.log(`Deleting record ${record._id} for session ${record.session.title}`);
      await Attendance.findByIdAndDelete(record._id);
      deletedCount++;
    }
    
    console.log(`\nDeleted ${deletedCount} invalid attendance records`);
    
    // Verify final state
    const remainingRecords = await Attendance.find({});
    console.log(`Remaining attendance records: ${remainingRecords.length}`);
    
    // Show summary
    const presentRecords = remainingRecords.filter(r => r.attended === true);
    const absentRecords = remainingRecords.filter(r => r.attended === false);
    
    console.log(`\nFinal summary:`);
    console.log(`- Present records: ${presentRecords.length}`);
    console.log(`- Absent records: ${absentRecords.length}`);
    console.log(`- Total records: ${remainingRecords.length}`);
    
  } catch (error) {
    console.error('Error fixing attendance records:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the fix
fixAttendanceRecords();
