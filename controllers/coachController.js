import Coach from '../models/Coach.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Helper function for manual pagination
const paginateHelper = async (Model, filter, options) => {
  const skip = (options.page - 1) * options.limit;
  
  let query = Model.find(filter);
  
  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach(popOption => {
        query = query.populate(popOption);
      });
    } else {
      query = query.populate(options.populate);
    }
  }
  
  const docs = await query
    .sort(options.sort)
    .skip(skip)
    .limit(options.limit)
    .select(options.select);

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

// @desc    Get all coaches
// @route   GET /api/coaches
// @access  Public
const getAllCoaches = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      specialization,
      minRating,
      maxHourlyRate,
      minHourlyRate,
      isActive = true,
      search,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    // First, ensure all users with coach role have coach profiles
    try {
      // Find all users with coach role
      const coachUsers = await User.find({ role: 'coach' });
      
      if (coachUsers.length > 0) {
        // Find existing coach profiles
        const existingCoachUserIds = await Coach.find({}).distinct('userId');
        
        // Find users without coach profiles
        const usersWithoutProfiles = coachUsers.filter(user => 
          !existingCoachUserIds.some(coachUserId => coachUserId.toString() === user._id.toString())
        );

        // Create coach profiles for users without them
        for (const user of usersWithoutProfiles) {
          const coachData = {
            userId: user._id,
            specializations: ['General Coaching'],
            experience: 0,
            bio: '',
            hourlyRate: 0,
            achievements: [],
            isActive: true,
            availability: [],
            assignedSessions: 0,
            assignedPrograms: []
          };

          await Coach.create(coachData);
        }
      }
    } catch (profileError) {
      console.warn('Error creating missing coach profiles:', profileError);
      // Continue with fetching coaches even if profile creation fails
    }

    // Build filter object
    const filter = { isActive };
    
    if (specialization) {
      filter.specializations = { $in: [specialization] };
    }
    
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }
    
    if (minHourlyRate || maxHourlyRate) {
      filter.hourlyRate = {};
      if (minHourlyRate) filter.hourlyRate.$gte = parseFloat(minHourlyRate);
      if (maxHourlyRate) filter.hourlyRate.$lte = parseFloat(maxHourlyRate);
    }

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        {
          path: 'userId',
          select: 'firstName lastName email profileImageURL'
        },
        {
          path: 'assignedPrograms',
          select: 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate'
        }
      ]
    };

    // Add search functionality if search term provided
    if (search) {
      const userIds = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');

      filter.$or = [
        { userId: { $in: userIds } },
        { bio: { $regex: search, $options: 'i' } },
        { specializations: { $regex: search, $options: 'i' } },
        { achievements: { $regex: search, $options: 'i' } }
      ];
    }

    const coaches = await paginateHelper(Coach, filter, options);

    res.status(200).json({
      success: true,
      data: coaches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coaches',
      error: error.message
    });
  }
};

// @desc    Get single coach
// @route   GET /api/coaches/:id
// @access  Public
const getCoach = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id)
      .populate('userId', 'firstName lastName email profileImageURL contactNumber')
      .populate('assignedPrograms', 'title description category specialization difficulty fee duration totalSessions isActive maxParticipants currentEnrollments');

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.status(200).json({
      success: true,
      data: coach
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coach',
      error: error.message
    });
  }
};

// @desc    Get coach by user ID
// @route   GET /api/coaches/user/:userId
// @access  Public
const getCoachByUserId = async (req, res) => {
  try {
    const coach = await Coach.findOne({ userId: req.params.userId })
      .populate('userId', 'firstName lastName email profileImageURL contactNumber')
      .populate('assignedPrograms', 'title description category specialization difficulty fee duration totalSessions isActive maxParticipants currentEnrollments');

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: coach
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coach by user ID',
      error: error.message
    });
  }
};

// @desc    Create new coach profile
// @route   POST /api/coaches
// @access  Private (Admin or Coach)
const createCoach = async (req, res) => {
  try {
    const {
      userId,
      specializations,
      experience,
      certifications,
      bio,
      hourlyRate,
      availability,
      profileImage,
      achievements
    } = req.body;

    // Check if user exists and has coach role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'coach') {
      return res.status(400).json({
        success: false,
        message: 'User must have coach role to create coach profile'
      });
    }

    // Check if coach profile already exists for this user
    const existingCoach = await Coach.findOne({ userId });
    if (existingCoach) {
      return res.status(400).json({
        success: false,
        message: 'Coach profile already exists for this user'
      });
    }

    const coachData = {
      userId,
      specializations,
      experience,
      certifications,
      bio,
      hourlyRate,
      availability,
      profileImage,
      achievements
    };

    const coach = await Coach.create(coachData);
    
    // Populate user data for response
    const populatedCoach = await Coach.findById(coach._id)
      .populate('userId', 'firstName lastName email profileImageURL')
      .populate('assignedPrograms', 'title description category specialization difficulty fee duration totalSessions isActive maxParticipants currentEnrollments');

    res.status(201).json({
      success: true,
      data: populatedCoach,
      message: 'Coach profile created successfully'
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
        message: 'Coach profile already exists for this user'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating coach profile',
      error: error.message
    });
  }
};

// @desc    Update coach profile
// @route   PUT /api/coaches/:id
// @access  Private (Coach owner or Admin)
const updateCoach = async (req, res) => {
  try {
    const coachId = req.params.id;
    const updateData = { ...req.body };

    console.log('=== COACH UPDATE REQUEST ===');
    console.log('Coach ID:', coachId);
    console.log('Update Data:', updateData);

    // Remove fields that shouldn't be updated via this endpoint
    delete updateData.rating;
    delete updateData.totalReviews;

    const coach = await Coach.findById(coachId);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Check authorization (coach can update own profile, admin can update any) - temporarily disabled for development
    // if (req.user && req.user.id !== coach.userId.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this coach profile'
    //   });
    // }

    // If userId data is provided, update the User document first
    if (updateData.userId && typeof updateData.userId === 'object') {
      const userUpdateData = {
        firstName: updateData.userId.firstName,
        lastName: updateData.userId.lastName,
        email: updateData.userId.email
      };
      
      console.log('Updating User with:', userUpdateData);
      
      await User.findByIdAndUpdate(
        coach.userId,
        userUpdateData,
        { new: true, runValidators: true }
      );
      
      // Remove userId from coach update data
      delete updateData.userId;
    }

    console.log('Updating Coach with:', updateData);

    const updatedCoach = await Coach.findByIdAndUpdate(
      coachId,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email profileImageURL')
     .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

    console.log('Updated Coach:', updatedCoach);

    res.status(200).json({
      success: true,
      data: updatedCoach,
      message: 'Coach profile updated successfully'
    });
  } catch (error) {
    console.error('Coach update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating coach profile',
      error: error.message
    });
  }
};

// @desc    Delete coach profile
// @route   DELETE /api/coaches/:id
// @access  Private (Admin only)
const deleteCoach = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Soft delete by setting isActive to false instead of actual deletion
    coach.isActive = false;
    await coach.save();

    res.status(200).json({
      success: true,
      message: 'Coach profile deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting coach profile',
      error: error.message
    });
  }
};

// @desc    Get coaches by specialization
// @route   GET /api/coaches/specialization/:specialization
// @access  Public
const getCoachesBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    const { page = 1, limit = 10, sortBy = 'rating', sortOrder = 'desc' } = req.query;

    const filter = {
      specializations: { $in: [specialization] },
      isActive: true
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        {
          path: 'userId',
          select: 'firstName lastName email profileImageURL'
        },
        {
          path: 'assignedPrograms',
          select: 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate'
        }
      ]
    };

    const coaches = await paginateHelper(Coach, filter, options);

    res.status(200).json({
      success: true,
      data: coaches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coaches by specialization',
      error: error.message
    });
  }
};

// @desc    Update coach availability
// @route   PUT /api/coaches/:id/availability
// @access  Private (Coach owner or Admin)
const updateCoachAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const coachId = req.params.id;

    const coach = await Coach.findById(coachId);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Check authorization - temporarily disabled for development
    // if (req.user && req.user.id !== coach.userId.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this coach availability'
    //   });
    // }

    coach.availability = availability;
    await coach.save();

    const updatedCoach = await Coach.findById(coachId)
      .populate('userId', 'firstName lastName email profileImageURL')
      .populate('assignedPrograms', 'title description category specialization difficulty fee duration totalSessions isActive maxParticipants currentEnrollments');

    res.status(200).json({
      success: true,
      data: updatedCoach,
      message: 'Coach availability updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating coach availability',
      error: error.message
    });
  }
};

// @desc    Update coach rating
// @route   PUT /api/coaches/:id/rating
// @access  Private (System use - called after feedback submission)
const updateCoachRating = async (req, res) => {
  try {
    const { rating, totalReviews } = req.body;
    const coachId = req.params.id;

    const coach = await Coach.findById(coachId);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    coach.rating = rating;
    coach.totalReviews = totalReviews;
    await coach.save();

    const updatedCoach = await Coach.findById(coachId)
      .populate('userId', 'firstName lastName email profileImageURL')
      .populate('assignedPrograms', 'title description category specialization difficulty fee duration totalSessions isActive maxParticipants currentEnrollments');

    res.status(200).json({
      success: true,
      data: updatedCoach,
      message: 'Coach rating updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating coach rating',
      error: error.message
    });
  }
};

// @desc    Assign program to coach
// @route   PUT /api/coaches/:id/assign-program
// @access  Private (Admin or Coaching Manager)
const assignProgramToCoach = async (req, res) => {
  try {
    const { programId } = req.body;
    const coachId = req.params.id;

    const coach = await Coach.findById(coachId);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Check if program is already assigned
    if (coach.assignedPrograms.includes(programId)) {
      return res.status(400).json({
        success: false,
        message: 'Program already assigned to this coach'
      });
    }

    coach.assignedPrograms.push(programId);
    await coach.save();

    const updatedCoach = await Coach.findById(coachId)
      .populate('userId', 'firstName lastName email profileImageURL')
      .populate('assignedPrograms', 'title description category specialization difficulty fee duration totalSessions isActive maxParticipants currentEnrollments');

    res.status(200).json({
      success: true,
      data: updatedCoach,
      message: 'Program assigned to coach successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning program to coach',
      error: error.message
    });
  }
};

// @desc    Remove program from coach
// @route   PUT /api/coaches/:id/remove-program
// @access  Private (Admin or Coaching Manager)
const removeProgramFromCoach = async (req, res) => {
  try {
    const { programId } = req.body;
    const coachId = req.params.id;

    const coach = await Coach.findById(coachId);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Remove program from assigned programs
    coach.assignedPrograms = coach.assignedPrograms.filter(
      id => id.toString() !== programId
    );
    await coach.save();

    const updatedCoach = await Coach.findById(coachId)
      .populate('userId', 'firstName lastName email profileImageURL')
      .populate('assignedPrograms', 'title description category specialization difficulty fee duration totalSessions isActive maxParticipants currentEnrollments');

    res.status(200).json({
      success: true,
      data: updatedCoach,
      message: 'Program removed from coach successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing program from coach',
      error: error.message
    });
  }
};

// @desc    Get coach statistics
// @route   GET /api/coaches/stats
// @access  Private (Admin or Coaching Manager)
const getCoachStats = async (req, res) => {
  try {
    const totalCoaches = await Coach.countDocuments();
    const activeCoaches = await Coach.countDocuments({ isActive: true });
    
    const specializationStats = await Coach.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$specializations' },
      {
        $group: {
          _id: '$specializations',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const ratingStats = await Coach.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          highestRating: { $max: '$rating' },
          lowestRating: { $min: '$rating' },
          totalReviews: { $sum: '$totalReviews' }
        }
      }
    ]);

    const experienceStats = await Coach.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$experience', 2] }, then: '0-2 years' },
                { case: { $lt: ['$experience', 5] }, then: '2-5 years' },
                { case: { $lt: ['$experience', 10] }, then: '5-10 years' },
                { case: { $gte: ['$experience', 10] }, then: '10+ years' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCoaches,
        activeCoaches,
        inactiveCoaches: totalCoaches - activeCoaches,
        specializationBreakdown: specializationStats,
        ratingStatistics: ratingStats[0] || {},
        experienceBreakdown: experienceStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coach statistics',
      error: error.message
    });
  }
};

// @desc    Toggle coach active status
// @route   PUT /api/coaches/:id/status
// @access  Private (Admin only)
const toggleCoachStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    coach.isActive = isActive;
    await coach.save();

    const updatedCoach = await Coach.findById(coach._id)
      .populate('userId', 'firstName lastName email profileImageURL')
      .populate('assignedPrograms', 'title description category specialization difficulty fee duration totalSessions isActive maxParticipants currentEnrollments');

    res.status(200).json({
      success: true,
      data: updatedCoach,
      message: `Coach ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating coach status',
      error: error.message
    });
  }
};

// @desc    Create coach profile for user with coach role
// @route   POST /api/coaches/create-for-user/:userId
// @access  Private (Admin only)
const createCoachProfileForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { specializations, experience, bio, hourlyRate, achievements } = req.body;

    // Check if user exists and has coach role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'coach') {
      return res.status(400).json({
        success: false,
        message: 'User must have coach role to create coach profile'
      });
    }

    // Check if coach profile already exists
    const existingCoach = await Coach.findOne({ userId });
    if (existingCoach) {
      return res.status(400).json({
        success: false,
        message: 'Coach profile already exists for this user'
      });
    }

    // Create coach profile with provided data or defaults
    const coachData = {
      userId,
      specializations: specializations || ['General Coaching'],
      experience: experience || 0,
      bio: bio || '',
      hourlyRate: hourlyRate || 0,
      achievements: achievements || [],
      isActive: true,
      availability: [],
      assignedSessions: 0,
      assignedPrograms: []
    };

    const coach = await Coach.create(coachData);
    
    // Populate user data for response
    const populatedCoach = await Coach.findById(coach._id)
      .populate('userId', 'firstName lastName email profileImageURL')
      .populate('assignedPrograms', 'title description category specialization difficulty fee duration totalSessions isActive maxParticipants currentEnrollments');

    res.status(201).json({
      success: true,
      data: populatedCoach,
      message: 'Coach profile created successfully for user'
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
      message: 'Error creating coach profile for user',
      error: error.message
    });
  }
};

// @desc    Create coach profiles for all users with coach role who don't have profiles
// @route   POST /api/coaches/create-missing-profiles
// @access  Private (Admin only)
const createMissingCoachProfiles = async (req, res) => {
  try {
    // Find all users with coach role
    const coachUsers = await User.find({ role: 'coach' });
    
    if (coachUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users with coach role found',
        created: 0
      });
    }

    // Find existing coach profiles
    const existingCoachUserIds = await Coach.find({}).distinct('userId');
    
    // Find users without coach profiles
    const usersWithoutProfiles = coachUsers.filter(user => 
      !existingCoachUserIds.some(coachUserId => coachUserId.toString() === user._id.toString())
    );

    if (usersWithoutProfiles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All users with coach role already have coach profiles',
        created: 0
      });
    }

    // Create coach profiles for users without them
    const createdProfiles = [];
    for (const user of usersWithoutProfiles) {
      const coachData = {
        userId: user._id,
        specializations: ['General Coaching'],
        experience: 0,
        bio: '',
        hourlyRate: 0,
        achievements: [],
        isActive: true,
        availability: [],
        assignedSessions: 0,
        assignedPrograms: []
      };

      const coach = await Coach.create(coachData);
      createdProfiles.push({
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        coachId: coach._id
      });
    }

    res.status(200).json({
      success: true,
      message: `Created ${createdProfiles.length} coach profiles`,
      created: createdProfiles.length,
      profiles: createdProfiles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating missing coach profiles',
      error: error.message
    });
  }
};

// @desc    Sync coaches - create missing profiles and return all coaches
// @route   GET /api/coaches/sync-coaches
// @access  Private (Admin only)
const syncCoaches = async (req, res) => {
  try {
    // First create missing coach profiles
    const coachUsers = await User.find({ role: 'coach' });
    
    if (coachUsers.length > 0) {
      const existingCoachUserIds = await Coach.find({}).distinct('userId');
      const usersWithoutProfiles = coachUsers.filter(user => 
        !existingCoachUserIds.some(coachUserId => coachUserId.toString() === user._id.toString())
      );

      // Create coach profiles for users without them
      for (const user of usersWithoutProfiles) {
        const coachData = {
          userId: user._id,
          specializations: ['General Coaching'],
          experience: 0,
          bio: '',
          hourlyRate: 0,
          achievements: [],
          isActive: true,
          availability: [],
          assignedSessions: 0,
          assignedPrograms: []
        };

        await Coach.create(coachData);
      }
    }

    // Now fetch all coaches with pagination
    const { page = 1, limit = 50 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'userId',
          select: 'firstName lastName email profileImageURL'
        },
        {
          path: 'assignedPrograms',
          select: 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate'
        }
      ]
    };

    const coaches = await paginateHelper(Coach, { isActive: true }, options);

    res.status(200).json({
      success: true,
      data: coaches,
      message: 'Coaches synced successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error syncing coaches',
      error: error.message
    });
  }
};

// @desc    Get coach availability for booking
// @route   GET /api/coaches/:id/availability
// @access  Public
const getCoachAvailability = async (req, res) => {
  try {
    const { id: coachId } = req.params;
    const { date, duration = 60, enrollmentDate, programDuration, sessionNumber } = req.query;

    const coach = await Coach.findById(coachId)
      .populate('userId', 'firstName lastName email');

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    if (!coach.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Coach is not currently active'
      });
    }

    // Get coach's general availability
    const coachAvailability = coach.availability || [];

    // If specific date is requested, check for existing sessions
    let availableSlots = [];
    if (date) {
      const searchDate = new Date(date);
      
      // Validate that the requested date is within the program duration
      if (enrollmentDate && programDuration) {
        const enrollment = new Date(enrollmentDate);
        const programEndDate = new Date(enrollment);
        programEndDate.setDate(programEndDate.getDate() + (parseInt(programDuration) * 7)); // Add weeks
        
        if (searchDate < enrollment || searchDate > programEndDate) {
          return res.status(400).json({
            success: false,
            message: `Session can only be booked between ${enrollment.toDateString()} and ${programEndDate.toDateString()}`,
            validDateRange: {
              startDate: enrollment,
              endDate: programEndDate
            }
          });
        }

        // If sessionNumber is provided, validate it's in the correct week
        if (sessionNumber) {
          const sessionNum = parseInt(sessionNumber);
          const enrollmentWeek = Math.floor((searchDate - enrollment) / (7 * 24 * 60 * 60 * 1000)) + 1;
          
          if (sessionNum !== enrollmentWeek) {
            return res.status(400).json({
              success: false,
              message: `Session ${sessionNum} must be booked in Week ${sessionNum}. You are trying to book in Week ${enrollmentWeek}`,
              expectedWeek: sessionNum,
              actualWeek: enrollmentWeek
            });
          }
        }
      }
      
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

      // Get existing sessions for this coach on this date
      const Session = (await import('../models/Session.js')).default;
      const existingSessions = await Session.find({
        coach: coachId,
        scheduledDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $nin: ['cancelled'] }
      }).select('startTime endTime duration');

      // Generate available time slots based on coach's availability
      const availableTimes = [];
      
      for (const availability of coachAvailability) {
        const dayOfWeek = searchDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = dayNames[dayOfWeek].toLowerCase();
        
        if (availability.day.toLowerCase() === currentDayName) {
          // Generate hourly slots within coach's availability window
          const startHour = parseInt(availability.startTime.split(':')[0]);
          const endHour = parseInt(availability.endTime.split(':')[0]);
          
          // Generate 2-hour slots within coach's availability window
          for (let hour = startHour; hour < endHour - 1; hour += 2) {
            const slotStartTime = `${hour.toString().padStart(2, '0')}:00`;
            const slotEndTime = `${(hour + 2).toString().padStart(2, '0')}:00`;
            
            // Check if this slot conflicts with existing sessions
            const hasConflict = existingSessions.some(session => {
              const sessionStart = session.startTime;
              const sessionEnd = session.endTime;
              return (slotStartTime < sessionEnd && slotEndTime > sessionStart);
            });
            
            if (!hasConflict) {
              availableTimes.push({
                startTime: slotStartTime,
                endTime: slotEndTime,
                available: true,
                duration: 120 // 2 hours in minutes
              });
            }
          }
        }
      }

      availableSlots = availableTimes;
    }

    res.status(200).json({
      success: true,
      data: {
        coach: {
          _id: coach._id,
          name: `${coach.userId.firstName} ${coach.userId.lastName}`,
          email: coach.userId.email
        },
        generalAvailability: coachAvailability,
        availableSlots: availableSlots,
        requestedDate: date || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coach availability',
      error: error.message
    });
  }
};

// @desc    Get valid booking date range for a program
// @route   GET /api/coaches/:id/booking-range
// @access  Public
const getBookingDateRange = async (req, res) => {
  try {
    const { id: coachId } = req.params;
    const { enrollmentDate, programDuration } = req.query;

    if (!enrollmentDate || !programDuration) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment date and program duration are required'
      });
    }

    const enrollment = new Date(enrollmentDate);
    const programEndDate = new Date(enrollment);
    programEndDate.setDate(programEndDate.getDate() + (parseInt(programDuration) * 7));

    // Generate all valid dates within the program duration
    const validDates = [];
    const currentDate = new Date(enrollment);
    
    while (currentDate <= programEndDate) {
      validDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: {
        enrollmentDate: enrollment,
        programEndDate: programEndDate,
        validDates: validDates,
        totalDays: validDates.length,
        programDuration: parseInt(programDuration)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking date range',
      error: error.message
    });
  }
};

// @desc    Get weekly session structure for a program
// @route   GET /api/coaches/:id/weekly-sessions
// @access  Public
const getWeeklySessionStructure = async (req, res) => {
  try {
    const { id: coachId } = req.params;
    const { enrollmentDate, programDuration } = req.query;

    if (!enrollmentDate || !programDuration) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment date and program duration are required'
      });
    }

    const enrollment = new Date(enrollmentDate);
    const totalWeeks = parseInt(programDuration);
    const weeklySessions = [];

    for (let week = 1; week <= totalWeeks; week++) {
      const weekStartDate = new Date(enrollment);
      weekStartDate.setDate(weekStartDate.getDate() + ((week - 1) * 7));
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      weeklySessions.push({
        week: week,
        sessionNumber: week,
        weekStartDate: weekStartDate,
        weekEndDate: weekEndDate,
        weekLabel: `Week ${week}`,
        sessionLabel: `Session ${week}`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        enrollmentDate: enrollment,
        programDuration: totalWeeks,
        totalSessions: totalWeeks,
        weeklySessions: weeklySessions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly session structure',
      error: error.message
    });
  }
};

// @desc    Get enrolled programs for a coach
// @route   GET /api/coaches/:id/enrolled-programs
// @access  Public
const getCoachEnrolledPrograms = async (req, res) => {
  try {
    const { id: coachId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Import ProgramEnrollment model
    const ProgramEnrollment = (await import('../models/ProgramEnrollment.js')).default;

    // First, find all programs where this coach is assigned
    const CoachingProgram = (await import('../models/CoachingProgram.js')).default;
    const coachPrograms = await CoachingProgram.find({ coach: coachId }).select('_id');
    const programIds = coachPrograms.map(program => program._id);
    
    // Build filter to find enrollments for these programs
    const filter = {
      program: { $in: programIds },
      status: status || { $in: ['active', 'pending', 'completed'] }
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { enrollmentDate: -1 },
      populate: [
        { 
          path: 'user', 
          select: 'firstName lastName email contactNumber' 
        },
        { 
          path: 'program', 
          select: 'title description category specialization fee duration totalSessions isActive',
          populate: {
            path: 'coach',
            select: 'userId',
            populate: {
              path: 'userId',
              select: 'firstName lastName email'
            }
          }
        },
        { 
          path: 'sessions', 
          select: 'title scheduledDate status startTime endTime' 
        }
      ]
    };

    // Get enrollments for programs where this coach is assigned
    const enrollments = await ProgramEnrollment.find(filter)
      .populate(options.populate)
      .sort(options.sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    const totalDocs = await ProgramEnrollment.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / options.limit);

    console.log('Coach ID:', coachId);
    console.log('Program IDs found:', programIds);
    console.log('Enrollments found:', enrollments.length);
    console.log('Sample enrollment:', enrollments[0]);

    const result = {
      docs: enrollments,
      totalDocs,
      limit: options.limit,
      page: options.page,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coach enrolled programs',
      error: error.message
    });
  }
};

// @desc    Test endpoint to verify API is working
// @route   GET /api/coaches/test
// @access  Public
const testCoachEndpoint = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Coach API endpoint is working!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test endpoint error',
      error: error.message
    });
  }
};

// @desc    Test attendance endpoint
// @route   PUT /api/coaches/test-attendance
// @access  Public
const testAttendanceEndpoint = async (req, res) => {
  try {
    console.log('=== TEST ATTENDANCE ENDPOINT ===');
    console.log('Request body:', req.body);
    res.status(200).json({
      success: true,
      message: 'Attendance endpoint is working!',
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test attendance endpoint error',
      error: error.message
    });
  }
};

// @desc    Mark attendance for session participants
// @route   PUT /api/coaches/:id/sessions/:sessionId/attendance
// @access  Private (Coach only)
const markSessionAttendance = async (req, res) => {
  try {
    console.log('=== ATTENDANCE MARKING REQUEST ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const { id: coachId } = req.params;
    const { sessionId } = req.params;
    const { attendanceData } = req.body;

    console.log('Extracted values:');
    console.log('- Coach ID:', coachId);
    console.log('- Session ID:', sessionId);
    console.log('- Attendance Data:', attendanceData);

    // Validate attendance data
    if (!attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({
        success: false,
        message: 'Attendance data is required and must be an array'
      });
    }

    // Use direct MongoDB operations to avoid model conflicts
    const db = mongoose.connection.db;
    
    console.log('Using direct MongoDB operations to avoid model conflicts');

    // Find the session using direct MongoDB query
    const session = await db.collection('sessions').findOne({ _id: new mongoose.Types.ObjectId(sessionId) });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    console.log('Session found:', session.title);
    console.log('Session coach:', session.coach);
    console.log('Session participants:', session.participants.length);

    // Verify this coach is assigned to this session
    if (session.coach.toString() !== coachId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark attendance for this session'
      });
    }

    // Update attendance for each participant using direct MongoDB update
    console.log('Processing attendance data:', attendanceData);
    console.log('Session participants before update:', session.participants);
    
    for (const attendance of attendanceData) {
      console.log('Processing attendance item:', attendance);
      
      if (!attendance.participantId || typeof attendance.attended !== 'boolean') {
        console.warn('Invalid attendance item:', attendance);
        continue;
      }
      
      console.log(`Updating participant ${attendance.participantId}: attended=${attendance.attended}`);
      
      // First, let's check if the participant exists in the session
      // Try to find by participant._id first, then by user._id as fallback
      let participantExists = session.participants.find(p => p._id.toString() === attendance.participantId);
      
      if (!participantExists) {
        // Fallback: try to find by user._id (in case frontend sends user ID instead of participant ID)
        participantExists = session.participants.find(p => p.user.toString() === attendance.participantId);
      }
      
      console.log('Participant exists in session:', participantExists);
      
      if (!participantExists) {
        console.error('Participant not found in session:', attendance.participantId);
        console.log('Available participants:', session.participants.map(p => ({
          _id: p._id,
          user: p.user,
          attended: p.attended
        })));
        continue;
      }
      
      // Update the specific participant in the session
      // Try participant._id first, then user._id as fallback
      let updateResult = await db.collection('sessions').updateOne(
        { 
          _id: new mongoose.Types.ObjectId(sessionId),
          'participants._id': new mongoose.Types.ObjectId(attendance.participantId)
        },
        {
          $set: {
            'participants.$.attended': attendance.attended,
            'participants.$.attendanceMarkedAt': new Date()
          }
        }
      );
      
      // If update by participant._id failed, try by user._id
      if (updateResult.matchedCount === 0) {
        updateResult = await db.collection('sessions').updateOne(
          { 
            _id: new mongoose.Types.ObjectId(sessionId),
            'participants.user': new mongoose.Types.ObjectId(attendance.participantId)
          },
          {
            $set: {
              'participants.$.attended': attendance.attended,
              'participants.$.attendanceMarkedAt': new Date()
            }
          }
        );
      }
      
      console.log('Update result:', updateResult);
      console.log(`Updated participant ${attendance.participantId} successfully`);
    }

    console.log('Attendance marking completed successfully');
    
    // Keep the original simple attendance marking without database changes
    console.log('Attendance marking completed successfully');
    
    // Fetch the updated session to verify the changes were saved
    const updatedSession = await db.collection('sessions').findOne({ _id: new mongoose.Types.ObjectId(sessionId) });
    
    console.log('=== VERIFICATION: Updated session data ===');
    console.log('Updated session participants:', updatedSession.participants.map(p => ({
      _id: p._id,
      user: p.user,
      attended: p.attended,
      attendanceMarkedAt: p.attendanceMarkedAt
    })));
    
    // Verify that the attendance was actually saved
    const verificationResults = attendanceData.map(attendance => {
      const participant = updatedSession.participants.find(p => 
        p._id.toString() === attendance.participantId || 
        p.user.toString() === attendance.participantId
      );
      return {
        participantId: attendance.participantId,
        expectedAttended: attendance.attended,
        actualAttended: participant?.attended,
        verified: participant?.attended === attendance.attended
      };
    });
    
    console.log('Attendance verification results:', verificationResults);
    
    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        session: updatedSession,
        attendanceData: attendanceData,
        verification: verificationResults
      }
    });
    
  } catch (error) {
    console.error('=== ATTENDANCE MARKING ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error marking session attendance',
      error: error.message
    });
  }
};

// @desc    Get session attendance details
// @route   GET /api/coaches/:id/sessions/:sessionId/attendance
// @access  Private (Coach only)
const getSessionAttendance = async (req, res) => {
  try {
    const { id: coachId } = req.params;
    const { sessionId } = req.params;

    // Import Session model
    const Session = (await import('../models/Session.js')).default;

    const session = await Session.findById(sessionId)
      .populate('participants.user', 'firstName lastName email contactNumber')
      .populate('participants.enrollment')
      .populate('program', 'title description category')
      .populate('coach', 'userId')
      .populate('ground', 'name location');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify this coach is assigned to this session
    if (session.coach.toString() !== coachId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view attendance for this session'
      });
    }

    // Calculate attendance statistics
    const totalParticipants = session.participants.length;
    const attendedCount = session.participants.filter(p => p.attended).length;
    const attendancePercentage = totalParticipants > 0 ? Math.round((attendedCount / totalParticipants) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        session: {
          _id: session._id,
          title: session.title,
          description: session.description,
          scheduledDate: session.scheduledDate,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          program: session.program,
          ground: session.ground
        },
        participants: session.participants,
        attendanceStats: {
          totalParticipants,
          attendedCount,
          absentCount: totalParticipants - attendedCount,
          attendancePercentage
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching session attendance',
      error: error.message
    });
  }
};

// @desc    Get coach's sessions with attendance data
// @route   GET /api/coaches/:id/sessions
// @access  Private (Coach only)
const getCoachSessions = async (req, res) => {
  try {
    const { id: coachId } = req.params;
    const { page = 1, limit = 10, status, date } = req.query;

    // Import Session model
    const Session = (await import('../models/Session.js')).default;

    // Build filter
    const filter = { coach: coachId };
    
    if (status && status !== 'All Status') {
      filter.status = status;
    }
    
    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
      filter.scheduledDate = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { scheduledDate: -1 },
      populate: [
        { 
          path: 'participants.user', 
          select: 'firstName lastName email' 
        },
        { 
          path: 'program', 
          select: 'title description category' 
        },
        { 
          path: 'ground', 
          select: 'name location' 
        }
      ]
    };

    const sessions = await Session.find(filter)
      .populate(options.populate)
      .sort(options.sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    const totalDocs = await Session.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / options.limit);

    // Add attendance statistics to each session
    const sessionsWithStats = sessions.map(session => {
      const totalParticipants = session.participants.length;
      const attendedCount = session.participants.filter(p => p.attended).length;
      const attendancePercentage = totalParticipants > 0 ? Math.round((attendedCount / totalParticipants) * 100) : 0;

      return {
        ...session.toObject(),
        attendanceStats: {
          totalParticipants,
          attendedCount,
          absentCount: totalParticipants - attendedCount,
          attendancePercentage
        }
      };
    });

    const result = {
      docs: sessionsWithStats,
      totalDocs,
      limit: options.limit,
      page: options.page,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coach sessions',
      error: error.message
    });
  }
};

// @desc    Create sessions for enrolled programs
// @route   POST /api/coaches/:id/create-sessions
// @access  Private (Coach only)
const createSessionsForEnrollments = async (req, res) => {
  try {
    const { id: coachId } = req.params;
    const { programId } = req.body;

    // Import required models
    const Session = (await import('../models/Session.js')).default;
    const ProgramEnrollment = (await import('../models/ProgramEnrollment.js')).default;
    const CoachingProgram = (await import('../models/CoachingProgram.js')).default;
    const Ground = (await import('../models/Ground.js')).default;

    // Get the program
    const program = await CoachingProgram.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    // Verify coach has access to this program
    if (program.coach.toString() !== coachId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create sessions for this program'
      });
    }

    // Get all active enrollments for this program
    const enrollments = await ProgramEnrollment.find({
      program: programId,
      status: 'active'
    }).populate('user', 'firstName lastName email');

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active enrollments found for this program'
      });
    }

    // Get or create a default ground
    let ground = await Ground.findOne();
    if (!ground) {
      ground = await Ground.create({
        name: 'Main Cricket Ground',
        location: 'Default Location',
        capacity: 20,
        facilities: ['Cricket Pitch', 'Changing Rooms'],
        isActive: true
      });
    }

    const createdSessions = [];

    // Create sessions for each week of the program
    for (let week = 1; week <= program.duration; week++) {
      // Calculate session date (start from today + (week-1) * 7 days)
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() + ((week - 1) * 7));

      // Create session data
      const sessionData = {
        program: programId,
        coach: coachId,
        title: `Session ${week} - ${program.title}`,
        description: `Week ${week} session for ${program.title}`,
        sessionNumber: week,
        week: week,
        scheduledDate: sessionDate,
        startTime: '10:00',
        endTime: '12:00',
        duration: 120, // 2 hours
        ground: ground._id,
        groundSlot: 1,
        status: 'scheduled',
        bookingDeadline: new Date(sessionDate.getTime() - (24 * 60 * 60 * 1000)), // 24 hours before session
        participants: enrollments.map(enrollment => ({
          user: enrollment.user._id,
          enrollment: enrollment._id,
          attended: false
        }))
      };

      // Create the session
      const session = await Session.create(sessionData);
      
      // Update enrollment with session reference
      for (const enrollment of enrollments) {
        enrollment.sessions.push(session._id);
        await enrollment.save();
      }

      createdSessions.push(session);
    }

    // Populate the created sessions
    const populatedSessions = await Session.find({
      _id: { $in: createdSessions.map(s => s._id) }
    }).populate([
      { path: 'participants.user', select: 'firstName lastName email' },
      { path: 'program', select: 'title description' },
      { path: 'ground', select: 'name location' }
    ]);

    res.status(201).json({
      success: true,
      message: `Created ${createdSessions.length} sessions for ${enrollments.length} participants`,
      data: populatedSessions
    });

  } catch (error) {
    console.error('Error creating sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sessions',
      error: error.message
    });
  }
};

// @desc    Get enrolled customers for coach's programs
// @route   GET /api/coaches/:coachId/enrolled-customers
// @access  Private (Coach only)
const getEnrolledCustomers = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { programId } = req.query;

    // Get coach's programs
    const coach = await Coach.findById(coachId).populate('assignedPrograms');
    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    let programIds = coach.assignedPrograms.map(p => p._id);
    
    // Filter by specific program if provided
    if (programId) {
      programIds = [programId];
    }

    // Get enrollments for coach's programs
    const ProgramEnrollment = (await import('../models/ProgramEnrollment.js')).default;
    const enrollments = await ProgramEnrollment.find({
      program: { $in: programIds },
      status: { $in: ['active', 'pending'] }
    })
    .populate('user', 'firstName lastName email phone')
    .populate('program', 'name description')
    .sort({ enrollmentDate: -1 });

    // Group by program
    const customersByProgram = {};
    enrollments.forEach(enrollment => {
      const programId = enrollment.program._id.toString();
      if (!customersByProgram[programId]) {
        customersByProgram[programId] = {
          program: enrollment.program,
          customers: []
        };
      }
      customersByProgram[programId].customers.push({
        enrollmentId: enrollment._id,
        user: enrollment.user,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status,
        progress: enrollment.progress
      });
    });

    res.status(200).json({
      success: true,
      data: {
        customersByProgram: Object.values(customersByProgram),
        totalCustomers: enrollments.length
      }
    });

  } catch (error) {
    console.error('Error fetching enrolled customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled customers',
      error: error.message
    });
  }
};

// @desc    Get individual player sessions
// @route   GET /api/coaches/:coachId/customers/:customerId/sessions
// @access  Private (Coach only)
const getCustomerSessions = async (req, res) => {
  try {
    const { coachId, customerId } = req.params;
    const { enrollmentId } = req.query;

    if (!enrollmentId) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment ID is required'
      });
    }

    // Get enrollment details
    const ProgramEnrollment = (await import('../models/ProgramEnrollment.js')).default;
    const Session = (await import('../models/Session.js')).default;
    const Attendance = (await import('../models/Attendance.js')).default;

    const enrollment = await ProgramEnrollment.findById(enrollmentId)
      .populate('user', 'firstName lastName email')
      .populate('program', 'name description');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Get sessions for this enrollment
    const sessions = await Session.find({
      program: enrollment.program._id,
      coach: coachId
    })
    .populate('ground', 'name location')
    .sort({ scheduledDate: -1 });

    // Get attendance records for these sessions
    const sessionIds = sessions.map(s => s._id);
    const attendanceRecords = await Attendance.find({
      session: { $in: sessionIds },
      participant: customerId
    }).populate('session');

    // Combine session data with attendance
    const sessionsWithAttendance = sessions.map(session => {
      const attendance = attendanceRecords.find(ar => ar.session._id.toString() === session._id.toString());
      return {
        ...session.toObject(),
        attendance: attendance ? {
          attended: attendance.attended,
          status: attendance.status,
          attendanceMarkedAt: attendance.attendanceMarkedAt,
          performance: attendance.performance,
          remarks: attendance.remarks
        } : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        customer: enrollment.user,
        program: enrollment.program,
        enrollment: enrollment,
        sessions: sessionsWithAttendance
      }
    });

  } catch (error) {
    console.error('Error fetching customer sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer sessions',
      error: error.message
    });
  }
};

export {
  getAllCoaches,
  getCoach,
  getCoachByUserId,
  createCoach,
  updateCoach,
  deleteCoach,
  getCoachesBySpecialization,
  updateCoachAvailability,
  updateCoachRating,
  assignProgramToCoach,
  removeProgramFromCoach,
  getCoachStats,
  toggleCoachStatus,
  createCoachProfileForUser,
  createMissingCoachProfiles,
  syncCoaches,
  getCoachAvailability,
  getBookingDateRange,
  getWeeklySessionStructure,
  getCoachEnrolledPrograms,
  markSessionAttendance,
  getSessionAttendance,
  getCoachSessions,
  createSessionsForEnrollments,
  testCoachEndpoint,
  testAttendanceEndpoint,
  simpleAttendanceMarking,
  getEnrolledCustomers,
  getCustomerSessions
};

// @desc    Simple attendance marking without models
// @route   PUT /api/coaches/simple-attendance
// @access  Public
const simpleAttendanceMarking = async (req, res) => {
  try {
    console.log('=== SIMPLE ATTENDANCE MARKING ===');
    console.log('Request body:', req.body);
    
    const { sessionId, attendanceData } = req.body;
    
    if (!sessionId || !attendanceData) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and attendance data are required'
      });
    }
    
    // Use direct MongoDB operations
    const db = mongoose.connection.db;
    
    // Find the session
    const session = await db.collection('sessions').findOne({ _id: new mongoose.Types.ObjectId(sessionId) });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    console.log('Session found:', session.title);
    
    // Update attendance for each participant
    for (const attendance of attendanceData) {
      if (!attendance.participantId || typeof attendance.attended !== 'boolean') {
        continue;
      }
      
      console.log(`Updating participant ${attendance.participantId}: attended=${attendance.attended}`);
      
      await db.collection('sessions').updateOne(
        { 
          _id: new mongoose.Types.ObjectId(sessionId),
          'participants._id': new mongoose.Types.ObjectId(attendance.participantId)
        },
        {
          $set: {
            'participants.$.attended': attendance.attended,
            'participants.$.attendanceMarkedAt': new Date()
          }
        }
      );
    }
    
    console.log('Simple attendance marking completed successfully');
    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully'
    });
    
  } catch (error) {
    console.error('Simple attendance marking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
};

