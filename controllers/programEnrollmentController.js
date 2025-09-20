import ProgramEnrollment from '../models/ProgramEnrollment.js';
import CoachingProgram from '../models/CoachingProgram.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

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

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private (Admin only)
const getAllEnrollments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      program,
      user,
      sortBy = 'enrollmentDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (program) filter.program = program;
    if (user) filter.user = user;

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        { path: 'user', select: 'name email phone' },
        { path: 'program', select: 'title category specialization price coach' },
        { path: 'sessions', select: 'title scheduledDate status' }
      ]
    };

    const enrollments = await paginateHelper(ProgramEnrollment, filter, options);

    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
const getEnrollment = async (req, res) => {
  try {
    const enrollment = await ProgramEnrollment.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('program', 'title description category specialization coach')
      .populate('sessions')
      .populate('paymentId');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user has access to this enrollment
    if (enrollment.user._id.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this enrollment'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment',
      error: error.message
    });
  }
};

// @desc    Create new enrollment
// @route   POST /api/enrollments
// @access  Private
const createEnrollment = async (req, res) => {
  try {
    const { programId, userId } = req.body;
    
    // Validate required fields
    if (!programId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Program ID and User ID are required'
      });
    }
    
    const enrollmentUserId = userId;

    // Check if program exists and is active
    const program = await CoachingProgram.findById(programId);
    if (!program || !program.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Program not found or not active'
      });
    }

    // Check if program is full
    if (program.currentEnrollments >= program.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Program is full'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await ProgramEnrollment.findOne({
      user: enrollmentUserId,
      program: programId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'User is already enrolled in this program'
      });
    }

    // Create enrollment
    const enrollmentData = {
      user: enrollmentUserId,
      program: programId,
      progress: {
        totalSessions: program.totalSessions || 10 // Default to 10 if not specified
      }
    };

    const enrollment = await ProgramEnrollment.create(enrollmentData);

    // Update program enrollment count
    program.currentEnrollments += 1;
    await program.save();

    const populatedEnrollment = await ProgramEnrollment.findById(enrollment._id)
      .populate('user', 'name email')
      .populate('program', 'title price');

    res.status(201).json({
      success: true,
      data: populatedEnrollment,
      message: 'Enrollment created successfully'
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
      message: 'Error creating enrollment',
      error: error.message
    });
  }
};

// @desc    Update enrollment
// @route   PUT /api/enrollments/:id
// @access  Private
const updateEnrollment = async (req, res) => {
  try {
    const enrollment = await ProgramEnrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this enrollment'
      });
    }

    const updatedEnrollment = await ProgramEnrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email')
     .populate('program', 'title');

    res.status(200).json({
      success: true,
      data: updatedEnrollment,
      message: 'Enrollment updated successfully'
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
      message: 'Error updating enrollment',
      error: error.message
    });
  }
};

// @desc    Cancel enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private
const cancelEnrollment = async (req, res) => {
  try {
    const enrollment = await ProgramEnrollment.findById(req.params.id)
      .populate('program');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this enrollment'
      });
    }

    // Update enrollment status to cancelled
    enrollment.status = 'cancelled';
    await enrollment.save();

    // Decrease program enrollment count
    const program = await CoachingProgram.findById(enrollment.program._id);
    if (program) {
      program.currentEnrollments = Math.max(0, program.currentEnrollments - 1);
      await program.save();
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling enrollment',
      error: error.message
    });
  }
};

// @desc    Get user's enrollments
// @route   GET /api/enrollments/user/:userId
// @access  Private
const getUserEnrollments = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;
    console.log('getUserEnrollments - userId:', userId);
    console.log('getUserEnrollments - req.user:', req.user);
    console.log('getUserEnrollments - req.params:', req.params);
    
    // Check authorization (skip if no auth middleware)
    if (req.user && userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these enrollments'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log('Searching for enrollments with userId:', userId);

    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { user: userId };
    if (status) filter.status = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { enrollmentDate: -1 },
      populate: [
        { 
          path: 'program', 
          select: 'title description category specialization price startDate endDate imageUrl duration fee',
          populate: { 
            path: 'coach', 
            select: 'name',
            populate: {
              path: 'userId',
              select: 'firstName lastName email'
            }
          }
        },
        { path: 'sessions', select: 'title scheduledDate status' }
      ]
    };

    // Try pagination helper first, fallback to simple find if it fails
    let enrollments;
    try {
      enrollments = await paginateHelper(ProgramEnrollment, filter, options);
      console.log('Found enrollments with pagination:', enrollments);
    } catch (paginationError) {
      console.log('Pagination failed, using simple find:', paginationError.message);
      // Fallback to simple find
      const simpleEnrollments = await ProgramEnrollment.find(filter)
        .populate([
          { 
            path: 'program', 
            select: 'title description category specialization price startDate endDate imageUrl duration fee',
            populate: { 
              path: 'coach', 
              select: 'name',
              populate: {
                path: 'userId',
                select: 'firstName lastName email'
              }
            }
          },
          { path: 'sessions', select: 'title scheduledDate status' }
        ])
        .sort({ enrollmentDate: -1 });
      
      enrollments = {
        docs: simpleEnrollments,
        totalDocs: simpleEnrollments.length,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      };
      console.log('Found enrollments with simple find:', enrollments);
    }

    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user enrollments',
      error: error.message
    });
  }
};

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private (Coach only)
const updateProgress = async (req, res) => {
  try {
    const { completedSessions, skillAssessments } = req.body;
    
    const enrollment = await ProgramEnrollment.findById(req.params.id)
      .populate('program');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update progress
    if (completedSessions !== undefined) {
      enrollment.progress.completedSessions = completedSessions;
    }

    if (skillAssessments) {
      enrollment.progress.skillAssessments = skillAssessments;
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      data: enrollment,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
};

// @desc    Add feedback to enrollment
// @route   POST /api/enrollments/:id/feedback
// @access  Private
const addFeedback = async (req, res) => {
  try {
    const enrollment = await ProgramEnrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.user.toString() !== req.user.id && req.user.role !== 'coach' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add feedback'
      });
    }

    const feedbackData = {
      ...req.body,
      date: new Date()
    };

    if (req.user.role === 'coach') {
      enrollment.coachFeedback.push(feedbackData);
    } else {
      enrollment.feedback.push(feedbackData);
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      data: enrollment,
      message: 'Feedback added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding feedback',
      error: error.message
    });
  }
};

// @desc    Get enrollment statistics for a program
// @route   GET /api/enrollments/program/:programId/stats
// @access  Private (Coach/Admin only)
const getProgramEnrollmentStats = async (req, res) => {
  try {
    const stats = await ProgramEnrollment.aggregate([
      { $match: { program: mongoose.Types.ObjectId(req.params.programId) } },
      {
        $group: {
          _id: {
            status: '$status',
            paymentStatus: '$paymentStatus'
          },
          count: { $sum: 1 },
          avgProgress: { $avg: '$progress.progressPercentage' }
        }
      }
    ]);

    const totalEnrollments = await ProgramEnrollment.countDocuments({
      program: req.params.programId
    });

    res.status(200).json({
      success: true,
      data: {
        totalEnrollments,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment statistics',
      error: error.message
    });
  }
};

// @desc    Activate enrollment after payment
// @route   PUT /api/enrollments/:id/activate
// @access  Private
const activateEnrollment = async (req, res) => {
  try {
    const enrollment = await ProgramEnrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to activate this enrollment'
      });
    }

    // Check if payment is completed
    if (enrollment.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be completed before activating enrollment'
      });
    }

    // Update enrollment status to active
    enrollment.status = 'active';
    await enrollment.save();

    const updatedEnrollment = await ProgramEnrollment.findById(enrollment._id)
      .populate('user', 'firstName lastName email')
      .populate('program', 'title description coach');

    res.status(200).json({
      success: true,
      data: updatedEnrollment,
      message: 'Enrollment activated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error activating enrollment',
      error: error.message
    });
  }
};

// @desc    Debug endpoint to check all enrollments
// @route   GET /api/enrollments/debug/all
// @access  Private
const debugAllEnrollments = async (req, res) => {
  try {
    const allEnrollments = await ProgramEnrollment.find({})
      .populate('user', 'firstName lastName email')
      .populate('program', 'title description')
      .limit(10);
    
    console.log('Debug - All enrollments in database:', allEnrollments);
    
    res.status(200).json({
      success: true,
      data: allEnrollments,
      count: allEnrollments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching all enrollments',
      error: error.message
    });
  }
};

// @desc    Process enrollment payment
// @route   POST /api/enrollments/:id/payment
// @access  Private
const processEnrollmentPayment = async (req, res) => {
  try {
    const { enrollmentId, amount, status, paymentDate } = req.body;
    
    // Import Payment model
    const Payment = (await import('../models/Payments.js')).default;
    
    // Create payment record
    const paymentData = {
      userId: req.body.userId,
      paymentType: 'enrollment_payment',
      amount: amount,
      status: status || 'success',
      paymentDate: paymentDate || new Date()
    };
    
    const payment = new Payment(paymentData);
    await payment.save();
    
    // Update enrollment with payment ID and status
    const enrollment = await ProgramEnrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    enrollment.paymentId = payment._id;
    enrollment.paymentStatus = 'completed';
    enrollment.status = 'active';
    await enrollment.save();
    
    const updatedEnrollment = await ProgramEnrollment.findById(enrollment._id)
      .populate('user', 'firstName lastName email')
      .populate('program', 'title description coach');
    
    res.status(200).json({
      success: true,
      data: updatedEnrollment,
      payment: payment,
      message: 'Enrollment payment processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing enrollment payment',
      error: error.message
    });
  }
};

export {
  getAllEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  cancelEnrollment,
  getUserEnrollments,
  updateProgress,
  addFeedback,
  getProgramEnrollmentStats,
  activateEnrollment,
  debugAllEnrollments,
  processEnrollmentPayment
};
