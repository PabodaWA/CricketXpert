import CoachingProgram from '../models/CoachingProgram.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';

// @desc    Get all coaching programs
// @route   GET /api/programs
// @access  Public
const getCoachingPrograms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      specialization,
      coach,
      isActive = true,
      difficulty,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive };
    
    if (category) filter.category = category;
    if (specialization) filter.specialization = specialization;
    if (coach) filter.coach = coach;
    if (difficulty) filter.difficulty = difficulty;

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        { 
          path: 'coach',
          populate: {
            path: 'userId',
            select: 'firstName lastName email'
          },
          select: 'specializations experience'
        }
      ]
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const programs = await CoachingProgram.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'coach',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        },
        select: 'specializations experience'
      });

    const totalDocs = await CoachingProgram.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    const result = {
      docs: programs,
      totalDocs,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coaching programs',
      error: error.message
    });
  }
};

// @desc    Get single coaching program
// @route   GET /api/programs/:id
// @access  Public
const getCoachingProgram = async (req, res) => {
  try {
    const program = await CoachingProgram.findById(req.params.id)
      .populate({
        path: 'coach',
        populate: {
          path: 'userId',
          select: 'firstName lastName email profileImageURL'
        },
        select: 'specializations experience profileImage'
      });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Coaching program not found'
      });
    }

    res.status(200).json({
      success: true,
      data: program
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coaching program',
      error: error.message
    });
  }
};

// @desc    Create new coaching program
// @route   POST /api/programs
// @access  Private (Coach only)
const createCoachingProgram = async (req, res) => {
  try {
    // Use coach ID from request body (bypass auth for now)
    const programData = {
      ...req.body,
      coach: req.body.coach // Use coach ID from request body
    };

    const program = await CoachingProgram.create(programData);
    
    // IMPORTANT: Add the program to the coach's assignedPrograms array
    const Coach = (await import('../models/Coach.js')).default;
    const coach = await Coach.findById(req.body.coach);
    if (coach && !coach.assignedPrograms.includes(program._id)) {
      coach.assignedPrograms.push(program._id);
      await coach.save();
    }
    
    const populatedProgram = await CoachingProgram.findById(program._id)
      .populate({
        path: 'coach',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      });

    res.status(201).json({
      success: true,
      data: populatedProgram,
      message: 'Coaching program created successfully'
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
      message: 'Error creating coaching program',
      error: error.message
    });
  }
};

// @desc    Update coaching program
// @route   PUT /api/programs/:id
// @access  Private (Coach only)
const updateCoachingProgram = async (req, res) => {
  try {
    const program = await CoachingProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Coaching program not found'
      });
    }

    // Temporarily bypass authorization for development
    // if (program.coach.toString() !== req.user.coachId && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this program'
    //   });
    // }

    const oldCoachId = program.coach.toString();
    const newCoachId = req.body.coach;

    const updatedProgram = await CoachingProgram.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'coach',
      populate: {
        path: 'userId',
        select: 'firstName lastName email'
      },
      select: 'specializations experience'
    });

    // Handle coach change - update assignedPrograms arrays
    if (newCoachId && oldCoachId !== newCoachId) {
      const Coach = (await import('../models/Coach.js')).default;
      
      // Remove program from old coach's assignedPrograms
      await Coach.findByIdAndUpdate(oldCoachId, {
        $pull: { assignedPrograms: req.params.id }
      });
      
      // Add program to new coach's assignedPrograms
      await Coach.findByIdAndUpdate(newCoachId, {
        $addToSet: { assignedPrograms: req.params.id }
      });
    }

    res.status(200).json({
      success: true,
      data: updatedProgram,
      message: 'Coaching program updated successfully'
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
      message: 'Error updating coaching program',
      error: error.message
    });
  }
};

// @desc    Delete coaching program
// @route   DELETE /api/programs/:id
// @access  Private (Coach/Admin only)
const deleteCoachingProgram = async (req, res) => {
  try {
    const program = await CoachingProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Coaching program not found'
      });
    }

    // Temporarily bypass authorization for development
    // if (program.coach.toString() !== req.user.coachId && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete this program'
    //   });
    // }

    // Check if there are active enrollments
    const activeEnrollments = await ProgramEnrollment.countDocuments({
      program: req.params.id,
      status: { $in: ['active', 'pending'] }
    });

    if (activeEnrollments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete program with active enrollments'
      });
    }

    await CoachingProgram.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Coaching program deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting coaching program',
      error: error.message
    });
  }
};

// @desc    Get programs by coach
// @route   GET /api/programs/coach/:coachId
// @access  Public
const getProgramsByCoach = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { 
          path: 'coach',
          populate: {
            path: 'userId',
            select: 'firstName lastName email'
          },
          select: 'specializations experience'
        }
      ]
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const programs = await CoachingProgram.find({ coach: req.params.coachId, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'coach',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        },
        select: 'specializations experience'
      });

    const totalDocs = await CoachingProgram.countDocuments({ coach: req.params.coachId, isActive: true });
    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    const result = {
      docs: programs,
      totalDocs,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coach programs',
      error: error.message
    });
  }
};

// @desc    Add material to program
// @route   POST /api/programs/:id/materials
// @access  Private (Coach only)
const addMaterial = async (req, res) => {
  try {
    const program = await CoachingProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Coaching program not found'
      });
    }

    // Temporarily bypass authorization for development
    // if (program.coach.toString() !== req.user.coachId && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to add materials to this program'
    //   });
    // }

    program.materials.push(req.body);
    await program.save();

    res.status(200).json({
      success: true,
      data: program,
      message: 'Material added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding material',
      error: error.message
    });
  }
};

// @desc    Get program statistics
// @route   GET /api/programs/:id/stats
// @access  Private (Coach only)
const getProgramStats = async (req, res) => {
  try {
    const program = await CoachingProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Coaching program not found'
      });
    }

    const enrollmentStats = await ProgramEnrollment.aggregate([
      { $match: { program: program._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = await ProgramEnrollment.aggregate([
      { 
        $match: { 
          program: program._id,
          paymentStatus: 'completed'
        }
      },
      {
        $lookup: {
          from: 'coachingprograms',
          localField: 'program',
          foreignField: '_id',
          as: 'programData'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $arrayElemAt: ['$programData.price', 0] } },
          completedPayments: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      totalEnrollments: program.currentEnrollments,
      availableSpots: program.maxParticipants - program.currentEnrollments,
      enrollmentsByStatus: enrollmentStats,
      revenue: totalRevenue[0] || { totalRevenue: 0, completedPayments: 0 },
      completionRate: 0 // Calculate based on your business logic
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching program statistics',
      error: error.message
    });
  }
};

export {
  getCoachingPrograms,
  getCoachingProgram,
  createCoachingProgram,
  updateCoachingProgram,
  deleteCoachingProgram,
  getProgramsByCoach,
  addMaterial,
  getProgramStats
};
