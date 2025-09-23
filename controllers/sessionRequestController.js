import SessionRequest from '../models/SessionRequest.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';
import CoachingProgram from '../models/CoachingProgram.js';
import Session from '../models/Session.js';
import User from '../models/User.js';

// @desc    Create a new session request
// @route   POST /api/session-requests
// @access  Private
const createSessionRequest = async (req, res) => {
  try {
    const { enrollmentId, requestedDate, requestedTime, duration, notes } = req.body;
    
    // Get enrollment details
    const enrollment = await ProgramEnrollment.findById(enrollmentId)
      .populate('program')
      .populate('user');
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    // Check if user owns this enrollment
    if (enrollment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create session request for this enrollment'
      });
    }
    
    // Check if enrollment is active
    if (enrollment.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create session request for inactive enrollment'
      });
    }
    
    // Get program and coach information
    const program = await CoachingProgram.findById(enrollment.program._id)
      .populate('coach');
    
    if (!program || !program.coach) {
      return res.status(400).json({
        success: false,
        message: 'Program or coach not found'
      });
    }
    
    // Create session request
    const sessionRequest = new SessionRequest({
      enrollment: enrollmentId,
      user: req.user._id,
      program: program._id,
      coach: program.coach._id,
      requestedDate: new Date(requestedDate),
      requestedTime,
      duration: duration || 60,
      notes: notes || '',
      status: 'pending'
    });
    
    await sessionRequest.save();
    
    // Populate the response
    await sessionRequest.populate([
      { path: 'enrollment', select: 'status' },
      { path: 'user', select: 'firstName lastName email' },
      { path: 'program', select: 'title' },
      { path: 'coach', select: 'userId', populate: { path: 'userId', select: 'firstName lastName' } }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Session request created successfully',
      data: sessionRequest
    });
    
  } catch (error) {
    console.error('Error creating session request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating session request',
      error: error.message
    });
  }
};

// @desc    Get session requests for a user
// @route   GET /api/session-requests/user
// @access  Private
const getUserSessionRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { user: req.user._id };
    if (status) {
      filter.status = status;
    }
    
    const sessionRequests = await SessionRequest.find(filter)
      .populate('enrollment', 'status')
      .populate('program', 'title')
      .populate('coach', 'userId')
      .populate('coach.userId', 'firstName lastName')
      .populate('session', 'scheduledDate scheduledTime status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await SessionRequest.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: sessionRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching user session requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session requests',
      error: error.message
    });
  }
};

// @desc    Get session requests for a coach
// @route   GET /api/session-requests/coach
// @access  Private (Coach only)
const getCoachSessionRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { coach: req.user.coachId };
    if (status) {
      filter.status = status;
    }
    
    const sessionRequests = await SessionRequest.find(filter)
      .populate('enrollment', 'status')
      .populate('user', 'firstName lastName email contactNumber')
      .populate('program', 'title')
      .populate('session', 'scheduledDate scheduledTime status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await SessionRequest.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: sessionRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching coach session requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session requests',
      error: error.message
    });
  }
};

// @desc    Approve a session request
// @route   PUT /api/session-requests/:id/approve
// @access  Private (Coach only)
const approveSessionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { responseNotes, suggestedDate, suggestedTime } = req.body;
    
    const sessionRequest = await SessionRequest.findById(id)
      .populate('enrollment')
      .populate('program')
      .populate('user');
    
    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Session request not found'
      });
    }
    
    // Check if user is the coach for this request
    if (sessionRequest.coach.toString() !== req.user.coachId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this session request'
      });
    }
    
    // Check if request is still pending
    if (sessionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Session request has already been processed'
      });
    }
    
    // Update session request
    sessionRequest.status = 'approved';
    sessionRequest.coachResponse = {
      approvedBy: req.user._id,
      responseDate: new Date(),
      responseNotes: responseNotes || '',
      suggestedDate: suggestedDate ? new Date(suggestedDate) : sessionRequest.requestedDate,
      suggestedTime: suggestedTime || sessionRequest.requestedTime
    };
    
    await sessionRequest.save();
    
    // Create the actual session
    const session = new Session({
      program: sessionRequest.program._id,
      coach: sessionRequest.coach,
      scheduledDate: sessionRequest.coachResponse.suggestedDate,
      scheduledTime: sessionRequest.coachResponse.suggestedTime,
      duration: sessionRequest.duration,
      status: 'scheduled',
      participants: [{
        user: sessionRequest.user._id,
        enrollment: sessionRequest.enrollment._id,
        status: 'confirmed'
      }],
      notes: sessionRequest.notes,
      coachNotes: sessionRequest.coachResponse.responseNotes
    });
    
    await session.save();
    
    // Update session request with session reference
    sessionRequest.session = session._id;
    await sessionRequest.save();
    
    res.status(200).json({
      success: true,
      message: 'Session request approved and session created',
      data: {
        sessionRequest,
        session
      }
    });
    
  } catch (error) {
    console.error('Error approving session request:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving session request',
      error: error.message
    });
  }
};

// @desc    Reject a session request
// @route   PUT /api/session-requests/:id/reject
// @access  Private (Coach only)
const rejectSessionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { responseNotes, suggestedDate, suggestedTime } = req.body;
    
    const sessionRequest = await SessionRequest.findById(id);
    
    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Session request not found'
      });
    }
    
    // Check if user is the coach for this request
    if (sessionRequest.coach.toString() !== req.user.coachId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this session request'
      });
    }
    
    // Check if request is still pending
    if (sessionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Session request has already been processed'
      });
    }
    
    // Update session request
    sessionRequest.status = 'rejected';
    sessionRequest.coachResponse = {
      approvedBy: req.user._id,
      responseDate: new Date(),
      responseNotes: responseNotes || 'Session request rejected',
      suggestedDate: suggestedDate ? new Date(suggestedDate) : null,
      suggestedTime: suggestedTime || null
    };
    
    await sessionRequest.save();
    
    res.status(200).json({
      success: true,
      message: 'Session request rejected',
      data: sessionRequest
    });
    
  } catch (error) {
    console.error('Error rejecting session request:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting session request',
      error: error.message
    });
  }
};

// @desc    Cancel a session request
// @route   PUT /api/session-requests/:id/cancel
// @access  Private
const cancelSessionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sessionRequest = await SessionRequest.findById(id);
    
    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Session request not found'
      });
    }
    
    // Check if user owns this request or is the coach
    if (sessionRequest.user.toString() !== req.user._id.toString() && 
        sessionRequest.coach.toString() !== req.user.coachId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this session request'
      });
    }
    
    // Check if request can be cancelled
    if (sessionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending session requests can be cancelled'
      });
    }
    
    // Update session request
    sessionRequest.status = 'cancelled';
    await sessionRequest.save();
    
    res.status(200).json({
      success: true,
      message: 'Session request cancelled',
      data: sessionRequest
    });
    
  } catch (error) {
    console.error('Error cancelling session request:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling session request',
      error: error.message
    });
  }
};

export {
  createSessionRequest,
  getUserSessionRequests,
  getCoachSessionRequests,
  approveSessionRequest,
  rejectSessionRequest,
  cancelSessionRequest
};
