const Session = require('../models/Session');
const CoachingProgram = require('../models/CoachingProgram');
const ProgramEnrollment = require('../models/ProgramEnrollment');
const Ground = require('../models/Ground');

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
    const sessionData = {
      ...req.body,
      coach: req.user.coachId || req.body.coach
    };

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

    const sessions = await paginateHelper(Session, filter, options);

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

    const sessions = await paginateHelper(Session, filter, options);

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

module.exports = {
  getAllSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  addParticipant,
  markAttendance,
  getSessionsByProgram,
  getSessionsByCoach,
  getGroundAvailability
};
