import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';

// @desc    Mark attendance for session participants
// @route   POST /api/attendance/mark
// @access  Private (Coach only)
const markAttendance = async (req, res) => {
  try {
    console.log('=== NEW ATTENDANCE SYSTEM REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Headers:', req.headers);
    
    const { sessionId, attendanceData, coachId, markedBy } = req.body;

    // Validate required fields
    if (!sessionId || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and attendance data are required'
      });
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

    console.log('Marking attendance for session:', sessionId);
    console.log('Attendance data:', attendanceData);

    // Mark attendance using the model method
    const results = await Attendance.markSessionAttendance(
      sessionId,
      attendanceData,
      coachId,
      markedBy
    );

    console.log('Attendance marked successfully:', results.length, 'records');

    // Update session participants attendance status
    for (const attendance of attendanceData) {
      await Session.updateOne(
        { 
          _id: sessionId,
          'participants._id': attendance.participantId
        },
        {
          $set: {
            'participants.$.attended': attendance.attended,
            'participants.$.attendanceMarkedAt': new Date()
          }
        }
      );
    }

    // Update enrollment progress
    for (const attendance of attendanceData) {
      if (attendance.attended) {
        await ProgramEnrollment.updateOne(
          { 
            _id: attendance.enrollmentId,
            'progress.completedSessions': { $exists: true }
          },
          {
            $inc: { 'progress.completedSessions': 1 }
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        sessionId,
        recordsMarked: results.length,
        attendanceData
      }
    });

  } catch (error) {
    console.error('=== ATTENDANCE MARKING ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
};

// @desc    Get session attendance
// @route   GET /api/attendance/session/:sessionId
// @access  Private (Coach only)
const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const attendance = await Attendance.getSessionAttendance(sessionId);

    res.status(200).json({
      success: true,
      data: attendance,
      count: attendance.length
    });

  } catch (error) {
    console.error('Error fetching session attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session attendance',
      error: error.message
    });
  }
};

// @desc    Get coach attendance summary
// @route   GET /api/attendance/coach/:coachId
// @access  Private (Coach only)
const getCoachAttendanceSummary = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { coach: coachId };
    
    if (startDate && endDate) {
      query.attendanceMarkedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('session', 'title scheduledDate startTime endTime')
      .populate('participant', 'firstName lastName email')
      .sort({ attendanceMarkedAt: -1 });

    // Calculate summary statistics
    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.attended).length;
    const absentCount = totalRecords - presentCount;
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRecords,
          presentCount,
          absentCount,
          attendanceRate: Math.round(attendanceRate * 100) / 100
        },
        attendance
      }
    });

  } catch (error) {
    console.error('Error fetching coach attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
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
    const { attended, performance, status, remarks } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      {
        attended,
        performance,
        status,
        remarks,
        attendanceMarkedAt: new Date()
      },
      { new: true }
    ).populate('participant', 'firstName lastName email')
     .populate('session', 'title scheduledDate');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
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
      message: 'Attendance record deleted successfully'
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

export {
  markAttendance,
  getSessionAttendance,
  getCoachAttendanceSummary,
  updateAttendance,
  deleteAttendance
};
