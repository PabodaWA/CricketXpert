const mongoose = require('mongoose');
const Attendance = require('./models/Attendance.js');

// Script to clean up duplicate attendance records
async function cleanupDuplicateAttendance() {
  try {
    console.log('=== CLEANING UP DUPLICATE ATTENDANCE RECORDS ===');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/your-database-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find all attendance records
    const allRecords = await Attendance.find({}).populate('session', 'title scheduledDate');
    
    console.log(`Found ${allRecords.length} total attendance records`);
    
    // Group by session and participant
    const groupedRecords = {};
    
    allRecords.forEach(record => {
      const key = `${record.session._id}_${record.participant}`;
      if (!groupedRecords[key]) {
        groupedRecords[key] = [];
      }
      groupedRecords[key].push(record);
    });
    
    console.log(`Grouped into ${Object.keys(groupedRecords).length} unique session-participant combinations`);
    
    // Find duplicates
    const duplicates = [];
    Object.entries(groupedRecords).forEach(([key, records]) => {
      if (records.length > 1) {
        console.log(`Found ${records.length} records for key: ${key}`);
        duplicates.push({ key, records });
      }
    });
    
    console.log(`Found ${duplicates.length} duplicate groups`);
    
    // Clean up duplicates (keep the latest record)
    let cleanedCount = 0;
    
    for (const { key, records } of duplicates) {
      console.log(`\nCleaning up duplicates for key: ${key}`);
      
      // Sort by attendanceMarkedAt descending (latest first)
      const sortedRecords = records.sort((a, b) => 
        new Date(b.attendanceMarkedAt) - new Date(a.attendanceMarkedAt)
      );
      
      // Keep the first (latest) record, delete the rest
      const recordToKeep = sortedRecords[0];
      const recordsToDelete = sortedRecords.slice(1);
      
      console.log(`Keeping record: ${recordToKeep._id} (marked at: ${recordToKeep.attendanceMarkedAt})`);
      
      for (const recordToDelete of recordsToDelete) {
        console.log(`Deleting record: ${recordToDelete._id} (marked at: ${recordToDelete.attendanceMarkedAt})`);
        await Attendance.findByIdAndDelete(recordToDelete._id);
        cleanedCount++;
      }
    }
    
    console.log(`\nCleaned up ${cleanedCount} duplicate records`);
    
    // Verify cleanup
    const remainingRecords = await Attendance.find({});
    console.log(`Remaining attendance records: ${remainingRecords.length}`);
    
  } catch (error) {
    console.error('Error cleaning up duplicate attendance:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the cleanup
cleanupDuplicateAttendance();
