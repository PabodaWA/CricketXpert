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
      .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

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
      .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

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
      .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

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
      .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

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
      .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

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
      .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

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
      .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

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
      .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

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
      .populate('assignedPrograms', 'title description category specialization isActive price currentEnrollments maxParticipants duration startDate endDate');

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
  getWeeklySessionStructure
};

