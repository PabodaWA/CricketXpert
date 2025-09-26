import mongoose from 'mongoose';
import User from './models/User.js';
import Session from './models/Session.js';
import Attendance from './models/Attendance.js';
import ProgramEnrollment from './models/ProgramEnrollment.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/cricketcoaching', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkMedhaniSessions = async () => {
  try {
    console.log('=== CHECKING SESSIONS FOR USER MEDHANI ===\n');

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

    // Get all enrollments for this user
    const enrollments = await ProgramEnrollment.find({ user: user._id })
      .populate('program', 'title description')
      .populate('user', 'firstName lastName email');

    console.log(`\n📋 Found ${enrollments.length} enrollments:`);
    enrollments.forEach((enrollment, index) => {
      console.log(`${index + 1}. Enrollment ID: ${enrollment._id}`);
      console.log(`   Program: ${enrollment.program?.title || 'N/A'}`);
      console.log(`   Status: ${enrollment.status}`);
      console.log(`   Progress: ${enrollment.progress?.completedSessions || 0}/${enrollment.progress?.totalSessions || 0} sessions`);
    });

    // Get all sessions for this user
    const sessions = await Session.find({
      'participants.user': user._id
    })
    .populate('program', 'title description')
    .populate('coach', 'userId')
    .populate('coach.userId', 'firstName lastName')
    .populate('ground', 'name location')
    .populate('participants.user', 'firstName lastName email')
    .sort({ scheduledDate: -1 });

    console.log(`\n🏏 Found ${sessions.length} sessions:`);
    
    if (sessions.length === 0) {
      console.log('❌ No sessions found for user Medhani');
      return;
    }

    sessions.forEach((session, index) => {
      console.log(`\n${index + 1}. Session ID: ${session._id}`);
      console.log(`   Title: ${session.title || 'N/A'}`);
      console.log(`   Session Number: ${session.sessionNumber || 'N/A'}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Date: ${session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'N/A'}`);
      console.log(`   Time: ${session.startTime || 'N/A'} - ${session.endTime || 'N/A'}`);
      console.log(`   Ground: ${session.ground?.name || 'N/A'}`);
      
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

    // Get attendance records from Attendance collection
    const attendanceRecords = await Attendance.find({
      participant: user._id
    })
    .populate('session', 'title sessionNumber scheduledDate startTime endTime status')
    .populate('coach', 'userId')
    .populate('coach.userId', 'firstName lastName')
    .populate('markedBy', 'firstName lastName')
    .sort({ attendanceMarkedAt: -1 });

    console.log(`\n📊 Found ${attendanceRecords.length} attendance records:`);
    
    if (attendanceRecords.length === 0) {
      console.log('❌ No attendance records found in Attendance collection');
    } else {
      attendanceRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. Attendance Record ID: ${record._id}`);
        console.log(`   Session: ${record.session?.title || 'N/A'} (${record.session?.sessionNumber || 'N/A'})`);
        console.log(`   Attended: ${record.attended}`);
        console.log(`   Status: ${record.status}`);
        console.log(`   Marked At: ${record.attendanceMarkedAt ? new Date(record.attendanceMarkedAt).toLocaleString() : 'N/A'}`);
        console.log(`   Marked By: ${record.markedBy?.firstName || 'N/A'} ${record.markedBy?.lastName || 'N/A'}`);
        if (record.performance) {
          console.log(`   Performance Rating: ${record.performance.rating || 'N/A'}`);
          console.log(`   Performance Notes: ${record.performance.notes || 'N/A'}`);
        }
        if (record.remarks) {
          console.log(`   Remarks: ${record.remarks}`);
        }
      });
    }

    // Check for completed sessions
    const completedSessions = sessions.filter(session => session.status === 'completed');
    console.log(`\n✅ Completed Sessions: ${completedSessions.length}`);
    
    const attendedSessions = sessions.filter(session => {
      const participant = session.participants.find(p => p.user._id.toString() === user._id.toString());
      return participant && participant.attended === true;
    });
    console.log(`✅ Attended Sessions: ${attendedSessions.length}`);

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total Sessions: ${sessions.length}`);
    console.log(`Completed Sessions: ${completedSessions.length}`);
    console.log(`Attended Sessions: ${attendedSessions.length}`);
    console.log(`Attendance Records: ${attendanceRecords.length}`);

  } catch (error) {
    console.error('Error checking Medhani sessions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
};

// Run the check
connectDB().then(() => {
  checkMedhaniSessions();
});

