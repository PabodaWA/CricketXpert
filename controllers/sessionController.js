import Session from '../models/Session.js';
import CoachingProgram from '../models/CoachingProgram.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';
import Ground from '../models/Ground.js';

// Helper function for manual pagination
const paginateHelper = async (Model, filter, options) => {
  const skip = (options.page - 1) * options.limit;
  
  const docs = await Model.find(filter)
    .sort(options.sort)
    .skip(skip)
    .limit(options.limit)
    .populate(options.populate);

  const totalDocs = await Model.countDocuments(filter);
  const totalPages = Math.ceil(totalDocs / options.limit);

  return {
    docs,
    totalDocs,
    limit: options.limit,
    page: options.page,
    totalPages,
    hasNextPage: options.page < totalPages,
    hasPrevPage: options.page > 1
  };
};

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
const getAllSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      program,
      coach,
      ground,
      status,
      date,
      week,
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (program) filter.program = program;
    if (coach) filter.coach = coach;
    if (ground) filter.ground = ground;
    if (status) filter.status = status;
    if (week) filter.week = week;
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        { path: 'program', select: 'title category specialization' },
        { path: 'coach', select: 'name email' },
        { path: 'ground', select: 'name location facilities' },
        { 
          path: 'participants.user', 
          select: 'name email' 
        },
        {
          path: 'participants.enrollment',
          select: 'status progress'
        }
      ]
    };

    const sessions = await paginateHelper(Session, filter, options);

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions',
      error: error.message
    });
  }
};

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private
const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('program', 'title description category specialization')
      .populate('coach', 'name email specializations')
      .populate('ground', 'name location facilities equipment')
      .populate('participants.user', 'name email phone')
      .populate('participants.enrollment', 'status progress');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching session',
      error: error.message
    });
  }
};

// @desc    Create new session
// @route   POST /api/sessions
// @access  Private (Coach only)
const createSession = async (req, res) => {
  try {
    console.log('Session creation request:', {
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    const sessionData = {
      ...req.body,
      coach: req.user?.coachId || req.body.coach || req.user?.id
    };

    // Ensure coach is provided
    if (!sessionData.coach) {
      return res.status(400).json({
        success: false,
        message: 'Coach information is required'
      });
    }

    console.log('Processed session data:', sessionData);

    // Validate required fields
    const requiredFields = ['program', 'coach', 'title', 'sessionNumber', 'week', 'scheduledDate', 'startTime', 'endTime', 'duration', 'ground', 'groundSlot'];
    const missingFields = requiredFields.filter(field => !sessionData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Check if ground slot is available
    const isAvailable = await Session.isSlotAvailable(
      sessionData.ground,
      sessionData.groundSlot,
      new Date(sessionData.scheduledDate),
      sessionData.startTime,
      sessionData.endTime
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Ground slot is not available at the specified time'
      });
    }

    // Verify the program exists and coach has access
    const program = await CoachingProgram.findById(sessionData.program);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    if (program.coach.toString() !== sessionData.coach && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create sessions for this program'
      });
    }

    const session = await Session.create(sessionData);
    
    const populatedSession = await Session.findById(session._id)
      .populate('program', 'title')
      .populate('coach', 'name email')
      .populate('ground', 'name location');

    res.status(201).json({
      success: true,
      data: populatedSession,
      message: 'Session created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Session conflicts with existing booking'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating session',
      error: error.message
    });
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private (Coach only)
const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is the coach of this session
    if (session.coach.toString() !== req.user.coachId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session'
      });
    }

    // If updating time/ground, check availability
    if (req.body.ground || req.body.groundSlot || req.body.scheduledDate || req.body.startTime || req.body.endTime) {
      const ground = req.body.ground || session.ground;
      const groundSlot = req.body.groundSlot || session.groundSlot;
      const scheduledDate = req.body.scheduledDate || session.scheduledDate;
      const startTime = req.body.startTime || session.startTime;
      const endTime = req.body.endTime || session.endTime;

      const isAvailable = await Session.isSlotAvailable(
        ground,
        groundSlot,
        new Date(scheduledDate),
        startTime,
        endTime,
        session._id
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Ground slot is not available at the specified time'
        });
      }
    }

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('program', 'title')
     .populate('coach', 'name email')
     .populate('ground', 'name location');

    res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Session updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating session',
      error: error.message
    });
  }
};

// @desc    Delete/Cancel session
// @route   DELETE /api/sessions/:id
// @access  Private (Coach/Admin only)
const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is the coach of this session or admin
    if (session.coach.toString() !== req.user.coachId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this session'
      });
    }

    // Update session status to cancelled instead of deleting
    session.status = 'cancelled';
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling session',
      error: error.message
    });
  }
};

// @desc    Remove participant from session
// @route   DELETE /api/sessions/:id/participants/:participantId
// @access  Private
const removeParticipant = async (req, res) => {
  try {
    const { participantId } = req.params;
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Find and remove participant
    const participantIndex = session.participants.findIndex(
      p => p._id.toString() === participantId
    );

    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this session'
      });
    }

    session.participants.splice(participantIndex, 1);
    await session.save();

    const updatedSession = await Session.findById(sessionId)
      .populate('participants.user', 'name email')
      .populate('participants.enrollment', 'status');

    res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing participant',
      error: error.message
    });
  }
};

// @desc    Add participant to session
// @route   POST /api/sessions/:id/participants
// @access  Private
const addParticipant = async (req, res) => {
  try {
    const { userId, enrollmentId } = req.body;
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session is full
    if (session.isFull) {
      return res.status(400).json({
        success: false,
        message: 'Session is full'
      });
    }

    // Check if user can book
    if (!session.canBook) {
      return res.status(400).json({
        success: false,
        message: 'Session cannot be booked (deadline passed, cancelled, or full)'
      });
    }

    // Check if user is already a participant
    const existingParticipant = session.participants.find(
      p => p.user.toString() === userId
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'User is already a participant in this session'
      });
    }

    // Verify enrollment exists and is active
    const enrollment = await ProgramEnrollment.findById(enrollmentId);
    if (!enrollment || enrollment.user.toString() !== userId || enrollment.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Valid enrollment not found'
      });
    }

    // Add participant
    session.participants.push({
      user: userId,
      enrollment: enrollmentId
    });

    await session.save();

    const updatedSession = await Session.findById(sessionId)
      .populate('participants.user', 'name email')
      .populate('participants.enrollment', 'status');

    res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Participant added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding participant',
      error: error.message
    });
  }
};

// @desc    Mark attendance for session
// @route   PUT /api/sessions/:id/attendance
// @access  Private (Coach only)
const markAttendance = async (req, res) => {
  try {
    const { participantId, attended } = req.body;
    const sessionId = req.params.id;

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
    
    if (sessionDate > today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for future sessions. Please wait until the session date has passed.'
      });
    }

    // Check if user is the coach of this session
    if (session.coach.toString() !== req.user.coachId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark attendance for this session'
      });
    }

    // Find and update participant
    const participant = session.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this session'
      });
    }

    participant.attended = attended;
    participant.attendanceMarkedAt = new Date();

    await session.save();

    // Update enrollment progress if attended
    if (attended) {
      const enrollment = await ProgramEnrollment.findById(participant.enrollment);
      if (enrollment) {
        enrollment.progress.completedSessions += 1;
        await enrollment.save();
      }
    }

    res.status(200).json({
      success: true,
      data: session,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
};

// @desc    Get sessions by program
// @route   GET /api/sessions/program/:programId
// @access  Private
const getSessionsByProgram = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { program: req.params.programId };
    if (status) filter.status = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { week: 1, sessionNumber: 1 },
      populate: [
        { path: 'coach', select: 'name email' },
        { path: 'ground', select: 'name location' }
      ]
    };

    const allSessions = await Session.find(filter)
      .populate(options.populate)
      .sort(options.sort);

    // Deduplicate sessions by session ID
    const seenSessionIds = new Set();
    const uniqueSessions = allSessions.filter(session => {
      if (seenSessionIds.has(session._id.toString())) {
        console.log('Removing duplicate session by ID:', session._id, session.title);
        return false;
      }
      seenSessionIds.add(session._id.toString());
      return true;
    });

    // Apply pagination to deduplicated sessions
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    const paginatedSessions = uniqueSessions.slice(startIndex, endIndex);

    const totalDocs = uniqueSessions.length;
    const totalPages = Math.ceil(totalDocs / options.limit);

    const sessions = {
      docs: paginatedSessions,
      totalDocs,
      limit: options.limit,
      page: options.page,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    };

    console.log('Sessions by program - Total found:', allSessions.length);
    console.log('Sessions by program - After deduplication:', uniqueSessions.length);

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching program sessions',
      error: error.message
    });
  }
};

// @desc    Get sessions by coach
// @route   GET /api/sessions/coach/:coachId
// @access  Private
const getSessionsByCoach = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    
    const filter = { coach: req.params.coachId };
    if (status) filter.status = status;
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { scheduledDate: 1, startTime: 1 },
      populate: [
        { path: 'program', select: 'title category' },
        { path: 'ground', select: 'name location' }
      ]
    };

    const allSessions = await Session.find(filter)
      .populate(options.populate)
      .sort(options.sort);

    // Deduplicate sessions by session ID
    const seenSessionIds = new Set();
    const uniqueSessions = allSessions.filter(session => {
      if (seenSessionIds.has(session._id.toString())) {
        console.log('Removing duplicate session by ID:', session._id, session.title);
        return false;
      }
      seenSessionIds.add(session._id.toString());
      return true;
    });

    // Apply pagination to deduplicated sessions
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    const paginatedSessions = uniqueSessions.slice(startIndex, endIndex);

    const totalDocs = uniqueSessions.length;
    const totalPages = Math.ceil(totalDocs / options.limit);

    const sessions = {
      docs: paginatedSessions,
      totalDocs,
      limit: options.limit,
      page: options.page,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    };

    console.log('Sessions by coach - Total found:', allSessions.length);
    console.log('Sessions by coach - After deduplication:', uniqueSessions.length);

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coach sessions',
      error: error.message
    });
  }
};

// @desc    Get available time slots for a ground
// @route   GET /api/sessions/ground/:groundId/availability
// @access  Private
const getGroundAvailability = async (req, res) => {
  try {
    const { date, duration = 60 } = req.query;
    const groundId = req.params.groundId;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const searchDate = new Date(date);
    
    // Get all booked slots for the date
    const bookedSessions = await Session.find({
      ground: groundId,
      scheduledDate: {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lt: new Date(searchDate.setHours(23, 59, 59, 999))
      },
      status: { $nin: ['cancelled'] }
    }).select('groundSlot startTime endTime');

    // Get ground details to know total slots
    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    // Generate availability for each slot
    const totalSlots = ground.totalSlots || 12; // Default to 12 slots
    const availability = [];

    for (let slot = 1; slot <= totalSlots; slot++) {
      const slotBookings = bookedSessions.filter(session => session.groundSlot === slot);
      
      // Generate time slots (assuming 8 AM to 8 PM, 1-hour slots)
      const timeSlots = [];
      for (let hour = 8; hour < 20; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        // Check if this time slot conflicts with any booking
        const isBooked = slotBookings.some(booking => {
          return (startTime < booking.endTime && endTime > booking.startTime);
        });

        timeSlots.push({
          startTime,
          endTime,
          available: !isBooked
        });
      }

      availability.push({
        slot,
        timeSlots
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ground: ground.name,
        date: date,
        availability
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ground availability',
      error: error.message
    });
  }
};

// @desc    Reschedule session
// @route   PUT /api/sessions/:id/reschedule
// @access  Private (Manager/Admin only)
const rescheduleSession = async (req, res) => {
  try {
    const { newDate, newStartTime, newEndTime, reason } = req.body;
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if new time slot is available
    const isAvailable = await Session.isSlotAvailable(
      session.ground,
      session.groundSlot,
      new Date(newDate),
      newStartTime,
      newEndTime,
      sessionId
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Ground slot is not available at the specified time'
      });
    }

    // Update session with new schedule
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      {
        scheduledDate: new Date(newDate),
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'rescheduled',
        notes: reason ? `Rescheduled: ${reason}` : 'Session rescheduled by manager'
      },
      { new: true, runValidators: true }
    ).populate('program', 'title')
     .populate('coach', 'name email')
     .populate('ground', 'name location');

    res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Session rescheduled successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error rescheduling session',
      error: error.message
    });
  }
};

// @desc    Debug session creation
// @route   POST /api/sessions/debug
// @access  Private
const debugSessionCreation = async (req, res) => {
  try {
    console.log('Debug session creation request:', {
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    const sessionData = {
      ...req.body,
      coach: req.user?.coachId || req.body.coach || req.user?.id
    };

    // Validate required fields
    const requiredFields = ['program', 'coach', 'title', 'sessionNumber', 'week', 'scheduledDate', 'startTime', 'endTime', 'duration', 'ground', 'groundSlot'];
    const missingFields = requiredFields.filter(field => !sessionData[field]);
    
    res.status(200).json({
      success: true,
      data: {
        sessionData,
        missingFields,
        user: req.user,
        validation: {
          hasAllRequiredFields: missingFields.length === 0,
          coachProvided: !!sessionData.coach,
          dateValid: sessionData.scheduledDate ? new Date(sessionData.scheduledDate) > new Date() : false
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message
    });
  }
};

// @desc    Get sessions by enrollment ID
// @route   GET /api/sessions/enrollment/:enrollmentId
// @access  Private
const getSessionsByEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    console.log('Fetching sessions for enrollment ID:', enrollmentId);
    
    // Import Attendance model
    const Attendance = (await import('../models/Attendance.js')).default;
    
    // Find sessions where participants have this enrollment
    const enrollmentQuery = await Session.find({
      'participants.enrollment': enrollmentId
    })
    .populate('program', 'title description')
    .populate('coach', 'userId')
    .populate('coach.userId', 'firstName lastName')
    .populate('ground', 'name location')
    .populate({
      path: 'participants.enrollment',
      model: 'ProgramEnrollment',
      select: 'status progress'
    })
    .populate({
      path: 'participants.user',
      select: 'firstName lastName email'
    })
    .sort({ scheduledDate: 1 });
    
    // Alternative query: find sessions by enrollment ID directly in the session
    const directQuery = await Session.find({
      enrollment: enrollmentId
    })
    .populate('program', 'title description')
    .populate('coach', 'userId')
    .populate('coach.userId', 'firstName lastName')
    .populate('ground', 'name location')
    .populate({
      path: 'participants.enrollment',
      model: 'ProgramEnrollment',
      select: 'status progress'
    })
    .populate({
      path: 'participants.user',
      select: 'firstName lastName email'
    })
    .sort({ scheduledDate: 1 });
    
    // Combine both results and remove duplicates
    const allSessions = [...enrollmentQuery, ...directQuery];

    console.log('Found sessions before deduplication:', allSessions.length);
    console.log('Sessions data before deduplication:', allSessions);

    // Only deduplicate by session ID (most reliable method)
    const seenSessionIds = new Set();
    const finalSessions = allSessions.filter(session => {
      if (seenSessionIds.has(session._id.toString())) {
        console.log('Removing duplicate session by ID:', session._id, session.title);
        return false;
      }
      seenSessionIds.add(session._id.toString());
      return true;
    });

    console.log('Found sessions after deduplication:', finalSessions.length);
    console.log('Sessions data after deduplication:', finalSessions);
    
    // Debug: Check if sessions have direct attendance data
    console.log('=== CHECKING SESSION PARTICIPANTS FOR DIRECT ATTENDANCE ===');
    finalSessions.forEach((session, index) => {
      console.log(`Session ${index + 1} (${session._id}):`);
      if (session.participants && session.participants.length > 0) {
        session.participants.forEach((participant, pIndex) => {
          console.log(`  Participant ${pIndex + 1}:`, {
            userId: participant.user?._id,
            attended: participant.attended,
            attendanceMarkedAt: participant.attendanceMarkedAt,
            performance: participant.performance
          });
        });
      } else {
        console.log('  No participants found');
      }
    });
    
    // Check if any participant has attended = true
    const hasAttendedParticipants = finalSessions.some(session => 
      session.participants?.some(p => p.attended === true)
    );
    console.log('Has any participant with attended = true:', hasAttendedParticipants);

    // Get attendance records for all sessions
    const sessionIds = finalSessions.map(session => session._id);
    const attendanceRecords = await Attendance.find({
      session: { $in: sessionIds }
    })
    .populate('participant', 'firstName lastName email')
    .populate('markedBy', 'firstName lastName');

    console.log('Found attendance records:', attendanceRecords.length);
    console.log('Attendance records:', attendanceRecords.map(att => ({
      session: att.session?._id || 'N/A',
      participant: att.participant?._id || 'N/A',
      attended: att.attended,
      status: att.status
    })));
    
    // Debug: Check if we have any attendance records at all
    if (attendanceRecords.length === 0) {
      console.log('❌ NO ATTENDANCE RECORDS FOUND IN DATABASE');
      console.log('This means attendance was not properly marked in the coach dashboard');
      console.log('Session IDs being searched:', sessionIds);
    } else {
      console.log('✅ Found attendance records, proceeding with mapping...');
      console.log('Attendance records found:', attendanceRecords.length);
    }

    // Enhance sessions with attendance data
    const sessionsWithAttendance = finalSessions.map(session => {
      const sessionAttendance = attendanceRecords.filter(att => 
        att.session.toString() === session._id.toString()
      );

      // Create a map of participant attendance
      const attendanceMap = {};
      sessionAttendance.forEach(att => {
        // Map by user ID (participant field in Attendance refers to User)
        if (att.participant && att.participant._id) {
          attendanceMap[att.participant._id.toString()] = {
            attended: att.attended,
            status: att.status,
            attendanceMarkedAt: att.attendanceMarkedAt,
            performance: att.performance,
            remarks: att.remarks,
            markedBy: att.markedBy
          };
        }
      });

      console.log('Attendance map for session:', session._id, attendanceMap);

      // Update participants with attendance data
      const updatedParticipants = session.participants.map(participant => {
        const attendanceData = attendanceMap[participant.user._id.toString()];
        
        console.log('Participant:', participant.user._id.toString(), 'Attendance data:', attendanceData);
        
        // If no attendance data from Attendance collection, use direct participant data
        let finalAttendanceData = attendanceData;
        if (!attendanceData && participant.attended !== undefined) {
          console.log('Using direct participant attendance data for:', participant.user._id.toString());
          finalAttendanceData = {
            attended: participant.attended,
            status: participant.attended ? 'present' : 'absent',
            attendanceMarkedAt: participant.attendanceMarkedAt,
            performance: participant.performance,
            remarks: participant.remarks
          };
        }
        
        // CRITICAL FIX: Ensure the attended field is set correctly
        const updatedParticipant = {
          ...participant.toObject(),
          attendance: finalAttendanceData || null
        };
        
        // If we have attendance data, make sure the attended field is set
        if (finalAttendanceData) {
          updatedParticipant.attended = finalAttendanceData.attended;
        } else if (participant.attended !== undefined) {
          // Fallback: use the direct participant attended field
          updatedParticipant.attended = participant.attended;
        }
        
        return updatedParticipant;
      });

      return {
        ...session.toObject(),
        participants: updatedParticipants
      };
    });

    console.log('Sessions with attendance data:', sessionsWithAttendance.length);
    
    // Debug: Log the final sessions with attendance data
    console.log('=== FINAL SESSIONS WITH ATTENDANCE ===');
    sessionsWithAttendance.forEach((session, index) => {
      console.log(`Session ${index + 1}:`, {
        id: session._id,
        title: session.title,
        status: session.status,
        participants: session.participants?.map(p => ({
          userId: p.user?._id,
          attended: p.attended,
          attendance: p.attendance
        }))
      });
    });
    
    // Check if any final session has attendance data
    const hasFinalAttendanceData = sessionsWithAttendance.some(session => 
      session.participants?.some(p => p.attendance || p.attended === true)
    );
    console.log('Has final attendance data:', hasFinalAttendanceData);
    
    // Additional debugging: Check specific participant attendance
    sessionsWithAttendance.forEach((session, index) => {
      console.log(`\n=== SESSION ${index + 1} FINAL CHECK ===`);
      console.log(`Session ID: ${session._id}`);
      if (session.participants && session.participants.length > 0) {
        session.participants.forEach((participant, pIndex) => {
          console.log(`  Participant ${pIndex + 1}:`);
          console.log(`    User ID: ${participant.user?._id}`);
          console.log(`    Attended: ${participant.attended}`);
          console.log(`    Attendance Object: ${JSON.stringify(participant.attendance)}`);
        });
      }
    });

    res.status(200).json({
      success: true,
      data: sessionsWithAttendance
    });
  } catch (error) {
    console.error('Error fetching sessions by enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions',
      error: error.message
    });
  }
};

// @desc    Create session directly for user enrollment
// @route   POST /api/sessions/direct-booking
// @access  Private
const createDirectSession = async (req, res) => {
  try {
    console.log('Direct session booking request:', req.body);
    console.log('User ID:', req.user._id);
    
    const { enrollmentId, scheduledDate, scheduledTime, duration, notes } = req.body;
    
    // Get enrollment details with program and coach populated
    const enrollment = await ProgramEnrollment.findById(enrollmentId)
      .populate({
        path: 'program',
        populate: {
          path: 'coach',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        }
      })
      .populate('user');
    
    if (!enrollment) {
      console.log('Enrollment not found for ID:', enrollmentId);
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    console.log('Enrollment found:', {
      id: enrollment._id,
      status: enrollment.status,
      user: enrollment.user._id,
      program: enrollment.program?._id,
      coach: enrollment.program?.coach?._id
    });
    
    // Check if user owns this enrollment
    if (enrollment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create session for this enrollment'
      });
    }
    
    // Check if enrollment is active
    if (enrollment.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create session for inactive enrollment'
      });
    }
    
    // Allow manual booking even if automatic sessions exist
    // This gives customers the flexibility to book their own sessions
    
    // Check program total sessions limit
    const programTotalSessions = enrollment.program.totalSessions || 10;
    console.log('Program total sessions:', programTotalSessions);
    
    // Count existing sessions for this enrollment
    const existingSessionsCount = await Session.countDocuments({
      'participants.enrollment': enrollmentId
    });
    
    console.log('Existing sessions count:', existingSessionsCount);
    
    // Check if user has reached the session limit
    if (existingSessionsCount >= programTotalSessions) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum number of sessions (${programTotalSessions}) for this program`
      });
    }
    
    // Check if program and coach exist
    if (!enrollment.program || !enrollment.program.coach) {
      return res.status(400).json({
        success: false,
        message: 'Program or coach not found'
      });
    }
    
    // Get the next session number for this enrollment
    const existingSessions = await Session.find({ 
      'participants.enrollment': enrollmentId 
    }).sort({ sessionNumber: -1 });
    
    const nextSessionNumber = existingSessions.length > 0 ? existingSessions[0].sessionNumber + 1 : 1;
    
    // Calculate start and end times
    const startTime = scheduledTime;
    const [hours, minutes] = scheduledTime.split(':');
    const startDateTime = new Date(scheduledDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const endDateTime = new Date(startDateTime.getTime() + (duration || 60) * 60000);
    const endTime = endDateTime.toTimeString().slice(0, 5);
    
    console.log('Session timing:', {
      scheduledDate,
      scheduledTime,
      startTime,
      endTime,
      duration: duration || 60
    });
    
    // Get a default ground or create one if none exists
    let defaultGround = await Ground.findOne();
    if (!defaultGround) {
      try {
        // Create a default ground
        defaultGround = new Ground({
          name: 'Default Cricket Ground',
          location: 'Main Sports Complex',
          pricePerSlot: 50,
          description: 'Default ground for cricket sessions',
          totalSlots: 12,
          facilities: ['parking', 'changing_room'],
          equipment: ['nets', 'balls', 'bats'],
          isActive: true
        });
        await defaultGround.save();
        console.log('Created default ground:', defaultGround._id);
      } catch (groundError) {
        console.error('Error creating default ground:', groundError);
        return res.status(500).json({
          success: false,
          message: 'Error creating default ground',
          error: groundError.message
        });
      }
    }
    
    console.log('Using ground:', {
      id: defaultGround._id,
      name: defaultGround.name,
      totalSlots: defaultGround.totalSlots
    });
    
    // Calculate booking deadline (24 hours before session)
    const bookingDeadline = new Date(startDateTime.getTime() - 24 * 60 * 60 * 1000);
    
    // Validate ground slot
    const groundSlot = 1; // Default to slot 1
    if (groundSlot < 1 || groundSlot > defaultGround.totalSlots) {
      return res.status(400).json({
        success: false,
        message: `Invalid ground slot. Must be between 1 and ${defaultGround.totalSlots}`
      });
    }
    
    // Create session directly
    const sessionData = {
      program: enrollment.program._id,
      coach: enrollment.program.coach._id,
      title: `Session ${nextSessionNumber} - ${enrollment.program.title}`,
      sessionNumber: nextSessionNumber,
      week: Math.ceil(nextSessionNumber / 2), // Assuming 2 sessions per week
      scheduledDate: new Date(scheduledDate),
      startTime: startTime,
      endTime: endTime,
      duration: duration || 60,
      ground: defaultGround._id,
      groundSlot: groundSlot,
      status: 'scheduled',
      participants: [{
        user: req.user._id,
        enrollment: enrollmentId,
        attended: false
      }],
      notes: notes || '',
      bookingDeadline: bookingDeadline,
      maxParticipants: 10,
      isRecurring: false
    };
    
    console.log('Creating session with data:', JSON.stringify(sessionData, null, 2));
    
    const session = new Session(sessionData);
    
    try {
      await session.save();
      console.log('Session created successfully:', session._id);
    } catch (saveError) {
      console.error('Error saving session:', saveError);
      console.error('Session validation errors:', saveError.errors);
      
      // Handle specific validation errors
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.values(saveError.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Session validation failed',
          errors: validationErrors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error creating session',
        error: saveError.message
      });
    }
    
    // Update enrollment progress
    if (enrollment.progress) {
      enrollment.progress.totalSessions = (enrollment.progress.totalSessions || 0) + 1;
      enrollment.progress.progressPercentage = Math.round(
        ((enrollment.progress.completedSessions || 0) / enrollment.progress.totalSessions) * 100
      );
    } else {
      enrollment.progress = {
        totalSessions: 1,
        completedSessions: 0,
        progressPercentage: 0
      };
    }
    await enrollment.save();
    
    // Populate the response
    await session.populate([
      { path: 'program', select: 'title' },
      { path: 'coach', select: 'userId', populate: { path: 'userId', select: 'firstName lastName' } },
      { path: 'participants.user', select: 'firstName lastName' }
    ]);
    
    console.log('Session created successfully with ID:', session._id);
    console.log('Session participants:', session.participants);
    
    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session
    });
    
  } catch (error) {
    console.error('Error creating direct session:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating session',
      error: error.message
    });
  }
};

// @desc    Remove extra sessions for 2-week program
// @route   POST /api/sessions/remove-extra/:enrollmentId
// @access  Public (for debugging)
const removeExtraSessions = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    console.log('=== REMOVING EXTRA SESSIONS ===');
    console.log('Enrollment ID:', enrollmentId);
    
    // Find all sessions for this enrollment
    const sessions = await Session.find({
      'participants.enrollment': enrollmentId
    }).sort({ sessionNumber: 1, week: 1 });
    
    console.log('Found sessions:', sessions.length);
    
    // For a 2-week program, we should only have 2 sessions
    if (sessions.length > 2) {
      // Remove sessions beyond the first 2
      const sessionsToRemove = sessions.slice(2);
      console.log('Sessions to remove:', sessionsToRemove.length);
      
      for (const session of sessionsToRemove) {
        console.log(`Removing session: ${session._id} (${session.title})`);
        
        // Remove from enrollments
        await ProgramEnrollment.updateMany(
          { sessions: session._id },
          { $pull: { sessions: session._id } }
        );
        
        // Delete the session
        await Session.findByIdAndDelete(session._id);
      }
      
      console.log(`Removed ${sessionsToRemove.length} extra sessions`);
      
      res.status(200).json({
        success: true,
        message: `Removed ${sessionsToRemove.length} extra sessions`,
        data: { removedCount: sessionsToRemove.length }
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'No extra sessions to remove',
        data: { removedCount: 0 }
      });
    }
    
  } catch (error) {
    console.error('Remove error:', error);
    res.status(500).json({
      success: false,
      message: 'Remove error',
      error: error.message
    });
  }
};

// @desc    Fix session week numbers
// @route   POST /api/sessions/fix-weeks/:enrollmentId
// @access  Public (for debugging)
const fixSessionWeeks = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    console.log('=== FIXING SESSION WEEKS ===');
    console.log('Enrollment ID:', enrollmentId);
    
    // Find all sessions for this enrollment
    const sessions = await Session.find({
      'participants.enrollment': enrollmentId
    }).sort({ sessionNumber: 1 });
    
    console.log('Found sessions:', sessions.length);
    
    let fixedCount = 0;
    
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      const correctWeek = i + 1; // Week should match session number
      
      if (session.week !== correctWeek) {
        console.log(`Fixing session ${session.sessionNumber}: week ${session.week} -> ${correctWeek}`);
        session.week = correctWeek;
        await session.save();
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} sessions`);
    
    res.status(200).json({
      success: true,
      message: `Fixed ${fixedCount} sessions`,
      data: { fixedCount }
    });
    
  } catch (error) {
    console.error('Fix error:', error);
    res.status(500).json({
      success: false,
      message: 'Fix error',
      error: error.message
    });
  }
};

// @desc    Debug sessions for specific enrollment
// @route   GET /api/sessions/debug/:enrollmentId
// @access  Public (for debugging)
const debugSessionsForEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    console.log('=== DEBUG SESSIONS FOR ENROLLMENT ===');
    console.log('Enrollment ID:', enrollmentId);
    
    // Find all sessions for this enrollment
    const allSessions = await Session.find({
      'participants.enrollment': enrollmentId
    }).populate('program', 'title duration');
    
    console.log('Total sessions found:', allSessions.length);
    
    const debugInfo = {
      enrollmentId: enrollmentId,
      totalSessions: allSessions.length,
      sessions: allSessions.map(session => ({
        id: session._id,
        title: session.title,
        sessionNumber: session.sessionNumber,
        week: session.week,
        program: session.program?.title,
        participants: session.participants?.length || 0
      }))
    };
    
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    res.status(200).json({
      success: true,
      data: debugInfo
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message
    });
  }
};

// @desc    Clean up duplicate sessions
// @route   POST /api/sessions/cleanup-duplicates
// @access  Private (Admin/Coach)
const cleanupDuplicateSessions = async (req, res) => {
  try {
    console.log('Starting cleanup of duplicate sessions...');
    
    // Find all sessions
    const allSessions = await Session.find({}).populate('program');
    
    console.log(`Found ${allSessions.length} total sessions`);
    
    // Group sessions by program and session number
    const sessionGroups = {};
    
    allSessions.forEach(session => {
      if (session.program && session.program._id) {
        const key = `${session.program._id}-${session.sessionNumber}-${session.week}`;
        if (!sessionGroups[key]) {
          sessionGroups[key] = [];
        }
        sessionGroups[key].push(session);
      } else {
        console.log('Skipping session without program data:', session._id);
      }
    });
    
    // Find duplicates
    const duplicates = Object.entries(sessionGroups).filter(([key, sessions]) => sessions.length > 1);
    
    console.log(`Found ${duplicates.length} groups with duplicate sessions`);
    
    let removedCount = 0;
    const removedSessions = [];
    
    for (const [key, sessions] of duplicates) {
      console.log(`\nProcessing duplicate group: ${key}`);
      console.log(`Found ${sessions.length} duplicate sessions`);
      
      // Keep the first session, remove the rest
      const sessionToKeep = sessions[0];
      const sessionsToRemove = sessions.slice(1);
      
      console.log(`Keeping session: ${sessionToKeep._id} (${sessionToKeep.title})`);
      
      for (const sessionToRemove of sessionsToRemove) {
        console.log(`Removing session: ${sessionToRemove._id} (${sessionToRemove.title})`);
        
        // Remove session from enrollments
        await ProgramEnrollment.updateMany(
          { sessions: sessionToRemove._id },
          { $pull: { sessions: sessionToRemove._id } }
        );
        
        removedSessions.push({
          id: sessionToRemove._id,
          title: sessionToRemove.title,
          sessionNumber: sessionToRemove.sessionNumber,
          week: sessionToRemove.week
        });
        
        // Delete the session
        await Session.findByIdAndDelete(sessionToRemove._id);
        removedCount++;
      }
    }
    
    console.log(`\nCleanup completed! Removed ${removedCount} duplicate sessions.`);
    
    res.status(200).json({
      success: true,
      message: `Cleanup completed! Removed ${removedCount} duplicate sessions.`,
      data: {
        totalSessionsFound: allSessions.length,
        duplicateGroups: duplicates.length,
        removedCount: removedCount,
        removedSessions: removedSessions
      }
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Error during cleanup',
      error: error.message
    });
  }
};

// @desc    Customer reschedule session
// @route   PUT /api/sessions/reschedule
// @access  Private (Customer)
const customerRescheduleSession = async (req, res) => {
  try {
    console.log('Customer reschedule request received:', req.body);
    const { sessionId, newDate, newTime, newGroundSlot, duration } = req.body;

    // Find the session
    console.log('Looking for session with ID:', sessionId);
    const session = await Session.findById(sessionId)
      .populate('ground')
      .populate('coach');

    console.log('Session found:', session ? 'Yes' : 'No');
    if (!session) {
      console.log('Session not found');
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check if new session date is more than 24 hours away
    const now = new Date();
    const newSessionDate = new Date(newDate);
    const hoursUntilNewSession = (newSessionDate - now) / (1000 * 60 * 60);
    
    console.log('New session date:', newSessionDate);
    console.log('Current time:', now);
    console.log('Hours until new session:', hoursUntilNewSession);
    
    if (hoursUntilNewSession <= 24) {
      console.log('New session is too close to current time');
      return res.status(400).json({ 
        success: false, 
        message: 'New session date must be more than 24 hours from now' 
      });
    }

    // Check if session has already been rescheduled
    if (session.rescheduled) {
      return res.status(400).json({ 
        success: false, 
        message: 'This session has already been rescheduled once' 
      });
    }

    // Validate new date is within 7 days
    const daysDifference = (newSessionDate - now) / (1000 * 60 * 60 * 24);
    
    if (daysDifference > 7) {
      return res.status(400).json({ 
        success: false, 
        message: 'New session date must be within 7 days from today' 
      });
    }

    // Check coach availability for new time
    const Coach = (await import('../models/Coach.js')).default;
    const coach = await Coach.findById(session.coach._id);
    
    if (!coach) {
      return res.status(400).json({ success: false, message: 'Coach not found' });
    }

    // Calculate end time for availability check
    const [hours, minutes] = newTime.split(':');
    const startDateTime = new Date(newDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const endDateTime = new Date(startDateTime.getTime() + (duration || 120) * 60000);
    const endTime = endDateTime.toTimeString().slice(0, 5);

    // Check if coach is available (using existing availability logic)
    const coachAvailability = coach.availability || [];
    const dayOfWeek = newSessionDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[dayOfWeek].toLowerCase();

    const isCoachAvailable = coachAvailability.some(availability => {
      if (availability.day.toLowerCase() === currentDayName) {
        const startHour = parseInt(availability.startTime.split(':')[0]);
        const endHour = parseInt(availability.endTime.split(':')[0]);
        const requestedStartHour = parseInt(newTime.split(':')[0]);
        const requestedEndHour = parseInt(endTime.split(':')[0]);
        
        return requestedStartHour >= startHour && requestedEndHour <= endHour;
      }
      return false;
    });

    if (!isCoachAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coach is not available at the requested time' 
      });
    }

    // Check if ground slot is available
    const ground = await Ground.findById(session.ground._id);
    if (!ground) {
      return res.status(400).json({ success: false, message: 'Ground not found' });
    }

    // Check for conflicts with other sessions
    const existingSessions = await Session.find({
      ground: session.ground._id,
      scheduledDate: new Date(newDate),
      status: { $nin: ['cancelled'] },
      _id: { $ne: sessionId }
    });

    const hasConflict = existingSessions.some(existingSession => {
      return existingSession.groundSlot === parseInt(newGroundSlot);
    });

    if (hasConflict) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ground slot is already booked for the selected time' 
      });
    }

    // Store original values before updating
    const originalDate = session.scheduledDate;
    const originalTime = session.scheduledTime;
    const originalGroundSlot = session.groundSlot;

    // Update the session
    session.scheduledDate = new Date(newDate);
    session.scheduledTime = newTime;
    session.startTime = newTime;
    session.endTime = endTime;
    session.groundSlot = parseInt(newGroundSlot);
    session.rescheduled = true;
    session.rescheduledAt = new Date();
    session.rescheduledFrom = {
      date: originalDate,
      time: originalTime,
      groundSlot: originalGroundSlot
    };

    console.log('Saving session with new data:', {
      scheduledDate: session.scheduledDate,
      scheduledTime: session.scheduledTime,
      groundSlot: session.groundSlot,
      rescheduled: session.rescheduled
    });

    await session.save();

    console.log('Session saved successfully');

    res.status(200).json({ 
      success: true, 
      message: 'Session rescheduled successfully',
      data: session 
    });

  } catch (error) {
    console.error('Error rescheduling session:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error rescheduling session', 
      error: error.message 
    });
  }
};

// @desc    Simple test to mark attendance for debugging
// @route   POST /api/sessions/debug/mark-attendance
// @access  Public (for debugging)
const debugMarkAttendance = async (req, res) => {
  try {
    const Attendance = (await import('../models/Attendance.js')).default;
    const Session = (await import('../models/Session.js')).default;
    
    // Get the first session
    const session = await Session.findOne({}).populate('participants.user');
    if (!session) {
      return res.status(404).json({ success: false, message: 'No sessions found' });
    }
    
    // Mark attendance for the first participant
    const participant = session.participants[0];
    if (!participant) {
      return res.status(404).json({ success: false, message: 'No participants found' });
    }
    
    // Create attendance record
    const attendanceRecord = new Attendance({
      session: session._id,
      participant: participant.user._id,
      coach: session.coach,
      attended: true,
      status: 'present',
      attendanceMarkedAt: new Date(),
      markedBy: participant.user._id
    });
    
    await attendanceRecord.save();
    
    // Update session participant
    await Session.updateOne(
      { 
        _id: session._id,
        'participants.user': participant.user._id
      },
      {
        $set: {
          'participants.$.attended': true,
          'participants.$.attendanceMarkedAt': new Date()
        }
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        sessionId: session._id,
        participantId: participant.user._id,
        attended: true
      }
    });
  } catch (error) {
    console.error('Error in debug mark attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
};

// @desc    Simple endpoint to check attendance for any user by enrollment ID
// @route   GET /api/sessions/debug/enrollment/:enrollmentId
// @access  Public (for debugging)
const debugEnrollmentAttendance = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const Attendance = (await import('../models/Attendance.js')).default;
    const Session = (await import('../models/Session.js')).default;
    const ProgramEnrollment = (await import('../models/ProgramEnrollment.js')).default;

    // Get the enrollment
    const enrollment = await ProgramEnrollment.findById(enrollmentId)
      .populate('user', 'firstName lastName email')
      .populate('program', 'title');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Get sessions for this enrollment
    const sessions = await Session.find({
      program: enrollment.program._id
    })
    .populate('participants.user', 'firstName lastName email')
    .sort({ scheduledDate: -1 });

    // Get attendance records for these sessions
    const sessionIds = sessions.map(session => session._id);
    const attendanceRecords = await Attendance.find({
      session: { $in: sessionIds }
    })
    .populate('session', 'title sessionNumber scheduledDate status')
    .populate('participant', 'firstName lastName email')
    .sort({ attendanceMarkedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        enrollment: {
          _id: enrollment._id,
          user: enrollment.user,
          program: enrollment.program
        },
        sessions: sessions.length,
        attendanceRecords: attendanceRecords.length,
        sessionDetails: sessions.map(session => ({
          id: session._id,
          title: session.title,
          status: session.status,
          participants: session.participants.map(p => ({
            user: `${p.user?.firstName || 'N/A'} ${p.user?.lastName || 'N/A'}`,
            userId: p.user?._id,
            attended: p.attended,
            attendanceMarkedAt: p.attendanceMarkedAt
          }))
        })),
        attendanceDetails: attendanceRecords.map(att => ({
          id: att._id,
          session: att.session?.title || 'N/A',
          participant: `${att.participant?.firstName || 'N/A'} ${att.participant?.lastName || 'N/A'}`,
          attended: att.attended,
          status: att.status,
          markedAt: att.attendanceMarkedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug enrollment attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment attendance',
      error: error.message
    });
  }
};

// @desc    Simple endpoint to check if attendance exists for Medhani
// @route   GET /api/sessions/debug/medhani
// @access  Public (for debugging)
const debugMedhaniAttendance = async (req, res) => {
  try {
    const Attendance = (await import('../models/Attendance.js')).default;
    const Session = (await import('../models/Session.js')).default;
    const User = (await import('../models/User.js')).default;

    // Find user Medhani
    const user = await User.findOne({ 
      $or: [
        { firstName: /medhani/i },
        { lastName: /medhani/i },
        { email: /medhani/i }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User Medhani not found'
      });
    }

    // Get attendance records for Medhani
    const attendanceRecords = await Attendance.find({
      participant: user._id
    })
    .populate('session', 'title sessionNumber scheduledDate status')
    .populate('participant', 'firstName lastName email')
    .sort({ attendanceMarkedAt: -1 });

    // Get sessions for Medhani
    const sessions = await Session.find({
      'participants.user': user._id
    })
    .populate('participants.user', 'firstName lastName email')
    .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        attendanceRecords: attendanceRecords.length,
        sessions: sessions.length,
        attendanceDetails: attendanceRecords.map(att => ({
          id: att._id,
          session: att.session?.title || 'N/A',
          attended: att.attended,
          status: att.status,
          markedAt: att.attendanceMarkedAt
        })),
        sessionDetails: sessions.map(session => ({
          id: session._id,
          title: session.title,
          status: session.status,
          participants: session.participants.map(p => ({
            user: `${p.user?.firstName || 'N/A'} ${p.user?.lastName || 'N/A'}`,
            attended: p.attended,
            attendanceMarkedAt: p.attendanceMarkedAt
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug Medhani attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Medhani attendance',
      error: error.message
    });
  }
};

// @desc    Debug endpoint to check attendance data
// @route   GET /api/sessions/debug/attendance
// @access  Public (for debugging)
const debugAttendance = async (req, res) => {
  try {
    const Attendance = (await import('../models/Attendance.js')).default;
    const Session = (await import('../models/Session.js')).default;
    const User = (await import('../models/User.js')).default;

    // Get all attendance records
    const attendanceRecords = await Attendance.find({})
      .populate('participant', 'firstName lastName email')
      .populate('session', 'title sessionNumber scheduledDate status')
      .sort({ attendanceMarkedAt: -1 });

    // Get all sessions
    const sessions = await Session.find({})
      .populate('participants.user', 'firstName lastName email')
      .populate('program', 'title')
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        attendanceRecords: attendanceRecords.length,
        sessions: sessions.length,
        attendanceDetails: attendanceRecords.map(att => ({
          id: att._id,
          session: att.session?.title || 'N/A',
          participant: `${att.participant?.firstName || 'N/A'} ${att.participant?.lastName || 'N/A'}`,
          attended: att.attended,
          status: att.status,
          markedAt: att.attendanceMarkedAt
        })),
        sessionDetails: sessions.map(session => ({
          id: session._id,
          title: session.title,
          status: session.status,
          participants: session.participants.map(p => ({
            user: `${p.user?.firstName || 'N/A'} ${p.user?.lastName || 'N/A'}`,
            attended: p.attended,
            attendanceMarkedAt: p.attendanceMarkedAt
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching debug data',
      error: error.message
    });
  }
};

export {
  getAllSessions,
  getSession,
  createSession,
  createDirectSession,
  updateSession,
  deleteSession,
  addParticipant,
  removeParticipant,
  markAttendance,
  getSessionsByProgram,
  getSessionsByCoach,
  getSessionsByEnrollment,
  getGroundAvailability,
  rescheduleSession,
  customerRescheduleSession,
  cleanupDuplicateSessions,
  removeExtraSessions,
  fixSessionWeeks,
  debugSessionsForEnrollment,
  debugSessionCreation,
  debugAttendance,
  debugMarkAttendance,
  debugMedhaniAttendance,
  debugEnrollmentAttendance
};
