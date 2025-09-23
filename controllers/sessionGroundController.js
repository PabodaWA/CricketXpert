import SessionGround from '../models/SessionGround.js';
import Session from '../models/Session.js';
import Ground from '../models/Ground.js';
import Payments from '../models/Payments.js';
import User from '../models/User.js';

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

// @desc    Get all session ground bookings
// @route   GET /api/session-grounds
// @access  Private
const getAllSessionGrounds = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      ground,
      status,
      bookingDate,
      paymentStatus,
      sortBy = 'bookingDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (ground) filter.ground = ground;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    if (bookingDate) {
      const startDate = new Date(bookingDate);
      const endDate = new Date(bookingDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.bookingDate = { $gte: startDate, $lt: endDate };
    }

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        { path: 'session', select: 'title sessionNumber week program' },
        { path: 'ground', select: 'name location facilities' },
        { path: 'paymentId', select: 'amount status' },
        { path: 'approvedBy', select: 'name email' }
      ]
    };

    const bookings = await paginateHelper(SessionGround, filter, options);

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching session ground bookings',
      error: error.message
    });
  }
};

// @desc    Get single session ground booking
// @route   GET /api/session-grounds/:id
// @access  Private
const getSessionGround = async (req, res) => {
  try {
    const booking = await SessionGround.findById(req.params.id)
      .populate('session', 'title sessionNumber week program coach')
      .populate('ground', 'name location facilities equipment')
      .populate('paymentId', 'amount status method')
      .populate('approvedBy', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Session ground booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching session ground booking',
      error: error.message
    });
  }
};

// @desc    Create new session ground booking
// @route   POST /api/session-grounds
// @access  Private
const createSessionGround = async (req, res) => {
  try {
    console.log('SessionGround creation request:', {
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    const {
      sessionId,
      groundId,
      groundSlot,
      bookingDate,
      startTime,
      endTime,
      duration,
      bookingType = 'session',
      specialRequirements = [],
      notes,
      isRecurring = false,
      recurringPattern
    } = req.body;

    console.log('Processed booking data:', {
      sessionId,
      groundId,
      groundSlot,
      bookingDate,
      startTime,
      endTime,
      duration,
      bookingType
    });

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify ground exists and get pricing
    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    // Check if slot is available
    const isAvailable = await SessionGround.isSlotAvailable(
      groundId,
      groundSlot,
      new Date(bookingDate),
      startTime,
      endTime
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Ground slot is not available at the specified time'
      });
    }

    // Calculate price
    const price = ground.pricePerSlot * Math.ceil(duration / 60); // Price per hour

    const bookingData = {
      session: sessionId,
      ground: groundId,
      groundSlot,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      duration,
      bookingType,
      price,
      specialRequirements,
      notes,
      isRecurring,
      recurringPattern
    };

    let booking;

    if (isRecurring && recurringPattern) {
      // Create recurring bookings
      const bookings = await SessionGround.createRecurringBookings(bookingData, recurringPattern);
      booking = bookings[0]; // Return first booking for response
    } else {
      // Create single booking
      booking = await SessionGround.create(bookingData);
    }

    const populatedBooking = await SessionGround.findById(booking._id)
      .populate('session', 'title sessionNumber')
      .populate('ground', 'name location');

    res.status(201).json({
      success: true,
      data: populatedBooking,
      message: 'Session ground booking created successfully'
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
        message: 'Booking conflicts with existing booking'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating session ground booking',
      error: error.message
    });
  }
};

// @desc    Update session ground booking
// @route   PUT /api/session-grounds/:id
// @access  Private
const updateSessionGround = async (req, res) => {
  try {
    const booking = await SessionGround.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Session ground booking not found'
      });
    }

    // Check if booking can be modified
    if (!booking.canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be modified (too close to start time)'
      });
    }

    // If updating time/ground, check availability
    if (req.body.ground || req.body.groundSlot || req.body.bookingDate || req.body.startTime || req.body.endTime) {
      const ground = req.body.ground || booking.ground;
      const groundSlot = req.body.groundSlot || booking.groundSlot;
      const bookingDate = req.body.bookingDate || booking.bookingDate;
      const startTime = req.body.startTime || booking.startTime;
      const endTime = req.body.endTime || booking.endTime;

      const isAvailable = await SessionGround.isSlotAvailable(
        ground,
        groundSlot,
        new Date(bookingDate),
        startTime,
        endTime,
        booking._id
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Ground slot is not available at the specified time'
        });
      }
    }

    const updatedBooking = await SessionGround.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('session', 'title sessionNumber')
     .populate('ground', 'name location');

    res.status(200).json({
      success: true,
      data: updatedBooking,
      message: 'Session ground booking updated successfully'
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
      message: 'Error updating session ground booking',
      error: error.message
    });
  }
};

// @desc    Cancel session ground booking
// @route   PUT /api/session-grounds/:id/cancel
// @access  Private
const cancelSessionGround = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await SessionGround.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Session ground booking not found'
      });
    }

    if (!booking.canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled (too close to start time)'
      });
    }

    await booking.cancel(reason);

    res.status(200).json({
      success: true,
      message: 'Session ground booking cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling session ground booking',
      error: error.message
    });
  }
};

// @desc    Confirm session ground booking
// @route   PUT /api/session-grounds/:id/confirm
// @access  Private (Manager/Admin)
const confirmSessionGround = async (req, res) => {
  try {
    const booking = await SessionGround.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Session ground booking not found'
      });
    }

    await booking.confirm();

    res.status(200).json({
      success: true,
      message: 'Session ground booking confirmed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error confirming session ground booking',
      error: error.message
    });
  }
};

// @desc    Complete session ground booking
// @route   PUT /api/session-grounds/:id/complete
// @access  Private (Manager/Admin)
const completeSessionGround = async (req, res) => {
  try {
    const { groundCondition, maintenanceNotes } = req.body;
    const booking = await SessionGround.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Session ground booking not found'
      });
    }

    await booking.complete(groundCondition, maintenanceNotes);

    res.status(200).json({
      success: true,
      message: 'Session ground booking completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing session ground booking',
      error: error.message
    });
  }
};

// @desc    Get ground availability
// @route   GET /api/session-grounds/ground/:groundId/availability
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

    const availability = await SessionGround.getGroundAvailability(groundId, date, duration);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ground availability',
      error: error.message
    });
  }
};

// @desc    Get bookings by session
// @route   GET /api/session-grounds/session/:sessionId
// @access  Private
const getBookingsBySession = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const filter = { session: req.params.sessionId };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { bookingDate: 1 },
      populate: [
        { path: 'ground', select: 'name location facilities' },
        { path: 'paymentId', select: 'amount status' }
      ]
    };

    const bookings = await paginateHelper(SessionGround, filter, options);

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching session bookings',
      error: error.message
    });
  }
};

// @desc    Get bookings by ground
// @route   GET /api/session-grounds/ground/:groundId
// @access  Private
const getBookingsByGround = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, status } = req.query;
    
    const filter = { ground: req.params.groundId };
    if (status) filter.status = status;
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.bookingDate = { $gte: startDate, $lt: endDate };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { bookingDate: 1, startTime: 1 },
      populate: [
        { path: 'session', select: 'title sessionNumber week' },
        { path: 'paymentId', select: 'amount status' }
      ]
    };

    const bookings = await paginateHelper(SessionGround, filter, options);

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ground bookings',
      error: error.message
    });
  }
};

// @desc    Get upcoming bookings
// @route   GET /api/session-grounds/upcoming
// @access  Private
const getUpcomingBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, days = 7 } = req.query;
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));
    
    const filter = {
      bookingDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['booked', 'confirmed'] }
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { bookingDate: 1, startTime: 1 },
      populate: [
        { path: 'session', select: 'title sessionNumber week program' },
        { path: 'ground', select: 'name location' },
        { path: 'paymentId', select: 'amount status' }
      ]
    };

    const bookings = await paginateHelper(SessionGround, filter, options);

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming bookings',
      error: error.message
    });
  }
};

// @desc    Get booking statistics
// @route   GET /api/session-grounds/stats
// @access  Private (Admin/Manager)
const getBookingStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    const stats = await SessionGround.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const groundStats = await SessionGround.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$ground',
          bookings: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      {
        $lookup: {
          from: 'grounds',
          localField: '_id',
          foreignField: '_id',
          as: 'ground'
        }
      },
      {
        $unwind: '$ground'
      },
      {
        $project: {
          groundName: '$ground.name',
          bookings: 1,
          revenue: 1
        }
      },
      {
        $sort: { bookings: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        overview: stats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          completedBookings: 0
        },
        topGrounds: groundStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking statistics',
      error: error.message
    });
  }
};

export {
  getAllSessionGrounds,
  getSessionGround,
  createSessionGround,
  updateSessionGround,
  cancelSessionGround,
  confirmSessionGround,
  completeSessionGround,
  getGroundAvailability,
  getBookingsBySession,
  getBookingsByGround,
  getUpcomingBookings,
  getBookingStats
};
