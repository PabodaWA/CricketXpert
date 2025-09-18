const Technician = require('../models/Technician');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 1. Create technician
exports.createTechnician = async (req, res) => {
  try {
    const { username, firstName, lastName, email, phone, skills, available } = req.body;
    
    console.log('=== TECHNICIAN CREATION DEBUG ===');
    console.log('Full request body:', req.body);
    console.log('Extracted data:', { username, firstName, lastName, email, phone, skills, available });
    console.log('Username exists?', !!username);
    console.log('Email exists?', !!email);
    
    // Validate required fields
    if (!username && !email) {
      return res.status(400).json({ 
        error: 'Either username or email is required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    console.log('Existing user search result:', existingUser);
    console.log('Searching for username:', username);
    console.log('Searching for email:', email);
    
    // Debug: Check if there are any users in the database
    const totalUsers = await User.countDocuments();
    console.log('Total users in database:', totalUsers);
    
    if (totalUsers > 0) {
      const sampleUsers = await User.find().limit(3).select('username email firstName lastName');
      console.log('Sample users in database:', sampleUsers);
    }
    
    if (existingUser) {
      console.log('User already exists:', existingUser._id);
      
      // Check if this user is already a technician
      const existingTechnician = await Technician.findOne({ technicianId: existingUser._id });
      if (existingTechnician) {
        return res.status(400).json({ 
          error: 'This user is already registered as a technician' 
        });
      }
      
      // User exists but not a technician, create technician record
      const technicianData = { 
        technicianId: existingUser._id, 
        skills: skills || [], 
        available: available !== undefined ? available : true 
      };
      
      console.log('Creating technician for existing user with data:', technicianData);
      console.log('Existing user ID:', existingUser._id);
      console.log('Existing user object:', existingUser);
      
      const technician = await Technician.create(technicianData);

      console.log('Technician created for existing user:', technician._id);

      // Populate the technician with user details
      const populatedTechnician = await Technician.findById(technician._id)
        .populate('technicianId', 'username email firstName lastName contactNumber');

      res.status(201).json({
        message: 'Technician created successfully for existing user',
        technician: populatedTechnician,
        defaultPassword: 'User already has an account'
      });
      return;
    }

    // Validate fields for new user creation
    if (!username) {
      return res.status(400).json({ 
        error: 'Username is required for new user creation' 
      });
    }
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required for new user creation' 
      });
    }

    // Create a default password (technician can change later)
    const defaultPassword = 'technician123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    console.log('Creating new user with data:', { username, email, firstName, lastName, phone });

    // Create user first
    const user = await User.create({
      username,
      email,
      passwordHash,
      role: 'technician',
      firstName,
      lastName,
      contactNumber: phone,
      status: 'active'
    });

    console.log('User created successfully:', user._id);
    console.log('User object:', user);

    // Create technician record with the user's ID
    const technicianData = { 
      technicianId: user._id, 
      skills: skills || [], 
      available: available !== undefined ? available : true 
    };
    
    console.log('Creating technician with data:', technicianData);
    
    const technician = await Technician.create(technicianData);

    console.log('Technician created successfully:', technician._id);

    // Populate the technician with user details
    const populatedTechnician = await Technician.findById(technician._id)
      .populate('technicianId', 'username email firstName lastName contactNumber');

    res.status(201).json({
      message: 'Technician created successfully',
      technician: populatedTechnician,
      defaultPassword: 'technician123' // Include default password in response
    });
  } catch (err) {
    console.error('Error creating technician:', err);
    res.status(500).json({ error: err.message });
  }
};

// 2. Get all technicians
exports.getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find().populate('technicianId', 'username email firstName lastName contactNumber');
    console.log('Retrieved technicians:', technicians.map(t => ({ 
      id: t._id, 
      skills: t.skills, 
      available: t.available,
      technicianId: t.technicianId 
    })));
    res.json(technicians);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get technician by ID
exports.getTechnicianById = async (req, res) => {
  try {
    const { id } = req.params;
    const technician = await Technician.findById(id).populate('technicianId', 'username email');
    if (!technician) return res.status(404).json({ error: 'Technician not found' });
    res.json(technician);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Update technician info
exports.updateTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { skills, available } = req.body;

    const technician = await Technician.findById(id);
    if (!technician) return res.status(404).json({ error: 'Technician not found' });

    if (skills) technician.skills = skills;
    if (available !== undefined) technician.available = available;

    await technician.save();
    res.json(technician);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Delete technician
exports.deleteTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Technician.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Technician not found' });
    res.json({ message: 'Technician deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
