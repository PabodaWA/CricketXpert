import Ground from '../models/Ground.js';

// @desc    Get all grounds
// @route   GET /api/grounds
// @access  Public
const getAllGrounds = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const grounds = await Ground.find()
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalGrounds = await Ground.countDocuments();

    res.status(200).json({
      success: true,
      data: grounds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalGrounds,
        pages: Math.ceil(totalGrounds / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grounds',
      error: error.message
    });
  }
};

// @desc    Get single ground
// @route   GET /api/grounds/:id
// @access  Public
const getGround = async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.id);

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ground
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ground',
      error: error.message
    });
  }
};

// @desc    Create new ground
// @route   POST /api/grounds
// @access  Private (Admin only)
const createGround = async (req, res) => {
  try {
    const ground = await Ground.create(req.body);

    res.status(201).json({
      success: true,
      data: ground,
      message: 'Ground created successfully'
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
      message: 'Error creating ground',
      error: error.message
    });
  }
};

// @desc    Update ground
// @route   PUT /api/grounds/:id
// @access  Private (Admin only)
const updateGround = async (req, res) => {
  try {
    const ground = await Ground.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ground,
      message: 'Ground updated successfully'
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
      message: 'Error updating ground',
      error: error.message
    });
  }
};

// @desc    Delete ground
// @route   DELETE /api/grounds/:id
// @access  Private (Admin only)
const deleteGround = async (req, res) => {
  try {
    const ground = await Ground.findByIdAndDelete(req.params.id);

    if (!ground) {
      return res.status(404).json({
        success: false,
        message: 'Ground not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ground deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ground',
      error: error.message
    });
  }
};

export {
  getAllGrounds,
  getGround,
  createGround,
  updateGround,
  deleteGround
};
