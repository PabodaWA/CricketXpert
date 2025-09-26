import mongoose from 'mongoose';
import Attendance from './models/Attendance.js';
import Session from './models/Session.js';
import User from './models/User.js';

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

const testAttendance = async () => {
  try {
    console.log('=== TESTING ATTENDANCE DATA ===\n');

    // Find user Medhani
    const user = await User.findOne({ 
      $or: [
        { firstName: /medhani/i },
        { lastName: /medhani/i },
        { email: /medhani/i }
      ]
    });

    if (!user) {
      console.log('❌ User Medhani not found');
      return;
    }

    console.log('✅ Found user:', {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });

    // Get all attendance records for this user
    const attendanceRecords = await Attendance.find({
      participant: user._id
    })
    .populate('session', 'title sessionNumber scheduledDate status')
    .populate('participant', 'firstName lastName email')
    .sort({ attendanceMarkedAt: -1 });

    console.log(`\n📊 Found ${attendanceRecords.length} attendance records:`);
    
    if (attendanceRecords.length === 0) {
      console.log('❌ No attendance records found in Attendance collection');
    } else {
      attendanceRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. Attendance Record:`);
        console.log(`   ID: ${record._id}`);
        console.log(`   Session: ${record.session?.title || 'N/A'} (${record.session?.sessionNumber || 'N/A'})`);
        console.log(`   Participant: ${record.participant?.firstName || 'N/A'} ${record.participant?.lastName || 'N/A'}`);
        console.log(`   Attended: ${record.attended}`);
        console.log(`   Status: ${record.status}`);
        console.log(`   Marked At: ${record.attendanceMarkedAt ? new Date(record.attendanceMarkedAt).toLocaleString() : 'N/A'}`);
      });
    }

    // Get all sessions for this user
    const sessions = await Session.find({
      'participants.user': user._id
    })
    .populate('participants.user', 'firstName lastName email')
    .populate('program', 'title')
    .sort({ scheduledDate: -1 });

    console.log(`\n🏏 Found ${sessions.length} sessions:`);
    
    sessions.forEach((session, index) => {
      console.log(`\n${index + 1}. Session: ${session.title || 'N/A'}`);
      console.log(`   ID: ${session._id}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Date: ${session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'N/A'}`);
      
      // Check participant attendance
      const participant = session.participants.find(p => p.user._id.toString() === user._id.toString());
      if (participant) {
        console.log(`   Participant Attended: ${participant.attended}`);
        console.log(`   Attendance Marked At: ${participant.attendanceMarkedAt ? new Date(participant.attendanceMarkedAt).toLocaleString() : 'N/A'}`);
        if (participant.performance) {
          console.log(`   Performance Rating: ${participant.performance.rating || 'N/A'}`);
          console.log(`   Performance Notes: ${participant.performance.notes || 'N/A'}`);
        }
      }
    });

  } catch (error) {
    console.error('Error testing attendance:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
};

// Run the test
connectDB().then(() => {
  testAttendance();
});

