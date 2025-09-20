import mongoose from 'mongoose';
import PlayerFeedback from '../models/PlayerFeedback.js';
import Session from '../models/Session.js';
import CoachingProgram from '../models/CoachingProgram.js';
import Coach from '../models/Coach.js';

// @desc    Submit feedback for a player
// @route   POST /api/player-feedback
// @access  Private (Coach only)
const submitPlayerFeedback = async (req, res) => {
  try {
    const { participantId, userId, rating, comment, categories = [] } = req.body;

    // Validate required fields
    if (!participantId || !userId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'participantId, userId, rating, and comment are required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Get the session and participant details
    const session = await Session.findOne({
      'participants._id': participantId
    }).populate('program coach participants.user');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session or participant not found'
      });
    }

    // Find the specific participant
    const participant = session.participants.find(p => p._id.toString() === participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this session'
      });
    }

    // Verify the user ID matches
    if (participant.user._id.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID does not match participant'
      });
    }

    // Check if feedback already exists for this session and player
    const existingFeedback = await PlayerFeedback.findOne({
      session: session._id,
      player: userId
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this player in this session'
      });
    }

    // Create the feedback
    const feedback = await PlayerFeedback.create({
      coach: session.coach._id,
      player: userId,
      session: session._id,
      program: session.program._id,
      rating,
      comment,
      categories
    });

    // Populate the feedback with related data
    const populatedFeedback = await PlayerFeedback.findById(feedback._id)
      .populate('coach', 'userId')
      .populate({
        path: 'coach',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .populate('player', 'firstName lastName')
      .populate('session', 'title scheduledDate')
      .populate('program', 'title');

    res.status(201).json({
      success: true,
      data: populatedFeedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting player feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};

// @desc    Get feedbacks submitted by a coach
// @route   GET /api/player-feedback/coach/:coachId
// @access  Private (Coach only)
const getCoachFeedbacks = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { page = 1, limit = 10, program, player } = req.query;

    // Build filter
    const filter = { coach: coachId };
    if (program) filter.program = program;
    if (player) filter.player = player;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedbacks = await PlayerFeedback.find(filter)
      .populate('player', 'firstName lastName email')
      .populate('session', 'title scheduledDate startTime endTime')
      .populate('program', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDocs = await PlayerFeedback.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        docs: feedbacks,
        totalDocs,
        limit: parseInt(limit),
        page: parseInt(page),
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching coach feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedbacks',
      error: error.message
    });
  }
};

// @desc    Get feedbacks for a specific player
// @route   GET /api/player-feedback/player/:playerId
// @access  Private (Player and Coach)
const getPlayerFeedbacks = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { page = 1, limit = 10, program } = req.query;

    // Build filter
    const filter = { 
      player: playerId,
      isVisibleToPlayer: true // Only show feedbacks that are visible to the player
    };
    if (program) filter.program = program;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedbacks = await PlayerFeedback.find(filter)
      .populate({
        path: 'coach',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .populate('session', 'title scheduledDate startTime endTime')
      .populate('program', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDocs = await PlayerFeedback.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        docs: feedbacks,
        totalDocs,
        limit: parseInt(limit),
        page: parseInt(page),
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching player feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedbacks',
      error: error.message
    });
  }
};

// @desc    Update feedback visibility
// @route   PUT /api/player-feedback/:id/visibility
// @access  Private (Coach only)
const updateFeedbackVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVisibleToPlayer } = req.body;

    const feedback = await PlayerFeedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.isVisibleToPlayer = isVisibleToPlayer;
    await feedback.save();

    res.status(200).json({
      success: true,
      data: feedback,
      message: `Feedback ${isVisibleToPlayer ? 'made visible' : 'hidden'} to player`
    });
  } catch (error) {
    console.error('Error updating feedback visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feedback visibility',
      error: error.message
    });
  }
};

// @desc    Get feedback statistics for a coach
// @route   GET /api/player-feedback/coach/:coachId/stats
// @access  Private (Coach only)
const getCoachFeedbackStats = async (req, res) => {
  try {
    const { coachId } = req.params;

    const stats = await PlayerFeedback.aggregate([
      { $match: { coach: new mongoose.Types.ObjectId(coachId) } },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.length > 0 && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach(rating => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
    }

    const result = {
      totalFeedbacks: stats.length > 0 ? stats[0].totalFeedbacks : 0,
      averageRating: stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0,
      ratingDistribution
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching coach feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback statistics',
      error: error.message
    });
  }
};

export {
  submitPlayerFeedback,
  getCoachFeedbacks,
  getPlayerFeedbacks,
  updateFeedbackVisibility,
  getCoachFeedbackStats
};
