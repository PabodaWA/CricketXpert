import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';
import mongoose from 'mongoose';
import { sendEmail } from '../utils/notification.js';
import User from '../models/User.js';

// @desc    Mark attendance for session participants
// @route   POST /api/attendance/mark
// @access  Private (Coach only)
const markAttendance = async (req, res) => {
  try {
    console.log('=== ATTENDANCE MARKING REQUEST ===');
    console.log('Request body:', req.body);
    
    const { sessionId, attendanceData, coachId, markedBy } = req.body;

    // Validate required fields
    if (!sessionId || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and attendance data are required'
      });
    }

    // Check if session exists and validate date
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Validate that the session date has passed (prevent marking attendance for future sessions)
    const sessionDate = new Date(session.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    // Allow attendance marking for future sessions in development
    const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.NODE_ENV === undefined;
    
    if (sessionDate > today && !isDevelopment) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for future sessions. Please wait until the session date has passed.'
      });
    }
    
    if (sessionDate > today) {
      console.log('Allowing attendance marking for future session (development mode)');
    }
    
    // Validate attendance data
    for (const attendance of attendanceData) {
      if (!attendance.participantId || typeof attendance.attended !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Invalid attendance data format'
        });
      }
    }
    
      // Mark attendance using the model method
    const results = await Attendance.markSessionAttendance(
      sessionId,
      attendanceData,
      coachId,
      markedBy
    );
    
    console.log('Attendance marked successfully:', results.length, 'records');
    
    // Get all unique customer IDs
    const customerIds = [...new Set(attendanceData.map(item => item.participantId))];
    
    // Get customer details
    const customers = await User.find({ _id: { $in: customerIds } });
    const customerMap = customers.reduce((acc, customer) => {
      acc[customer._id.toString()] = customer;
      return acc;
    }, {});

    // Get coach details
    const coach = await User.findById(coachId);
    
    // Send email to each customer
    const emailPromises = attendanceData.map(async (item) => {
      const customer = customerMap[item.participantId];
      if (!customer || !customer.email) {
        console.log(`Skipping email for participant ${item.participantId} - no email found`);
        return;
      }

      const status = item.attended ? 'present' : 'absent';
      const emailSubject = `Attendance Marked - ${session.title}`;
      const emailText = `
Hello ${customer.firstName || 'there'},

Your attendance for the session "${session.title}" on ${new Date(session.scheduledDate).toLocaleDateString()} 
has been marked as ${status} by Coach ${coach?.firstName || 'the coach'}.

Session Details:
- Title: ${session.title}
- Date: ${new Date(session.scheduledDate).toLocaleDateString()}
- Time: ${session.startTime || 'N/A'} - ${session.endTime || 'N/A'}
- Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
- Coach: ${coach?.firstName ? `${coach.firstName} ${coach.lastName || ''}` : 'N/A'}

If you believe this is a mistake, please contact your coach.

Best regards,
The Coaching Team`;

      try {
        const emailSent = await sendEmail(
          customer.email,
          emailSubject,
          emailText.trim()
        );
        
        if (emailSent) {
          console.log(`✅ Attendance notification sent to ${customer.email}`);
        } else {
          console.error(`❌ Failed to send email to ${customer.email} - sendEmail returned false`);
        }
      } catch (emailError) {
        console.error(`❌ Error sending email to ${customer.email}:`, emailError.message);
      }
    });

    // Wait for all emails to be sent (or fail)
    await Promise.allSettled(emailPromises);

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: results
    });
  } catch (error) {
    console.error('Error marking session attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking session attendance',
      error: error.message
    });
  }
};

// @desc    Get session attendance
// @route   GET /api/attendance/session/:sessionId
// @access  Private
const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const attendance = await Attendance.find({ session: sessionId })
      .populate('participant', 'firstName lastName email')
      .populate('markedBy', 'firstName lastName');
      
    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error getting session attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting session attendance',
      error: error.message
    });
  }
};

// @desc    Get coach attendance summary
// @route   GET /api/attendance/coach/:coachId
// @access  Private
const getCoachAttendanceSummary = async (req, res) => {
  try {
    const { coachId } = req.params;
    
    // Get all sessions for the coach
    const sessions = await Session.find({ coach: coachId });
    const sessionIds = sessions.map(session => session._id);
    
    // Get attendance for all sessions
    const attendance = await Attendance.find({ session: { $in: sessionIds } })
      .populate('participant', 'firstName lastName')
      .populate('session', 'title scheduledDate startTime');
      
    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error getting coach attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting coach attendance summary',
      error: error.message
    });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Coach only)
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attended, notes } = req.body;
    
    const attendance = await Attendance.findByIdAndUpdate(
      id,
      { attended, notes, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Coach only)
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findByIdAndDelete(id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance',
      error: error.message
    });
  }
};

// Export all functions
const markSessionAttendance = markAttendance; // Create alias

export {
  markAttendance,
  getSessionAttendance,
  getCoachAttendanceSummary,
  updateAttendance,
  deleteAttendance,
  markSessionAttendance
};