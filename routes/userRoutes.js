const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Create user
router.post('/', userController.createUser);

// Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

// Get user by username
const User = require("../models/User");

router.get("/search/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check user by username (for compatibility with fetchUserByUsername)
router.get("/check/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Find user by username (POST method)
router.post("/find", async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search users by name
router.get("/search/name/:name", async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { username: { $regex: req.params.name, $options: 'i' } },
        { firstName: { $regex: req.params.name, $options: 'i' } },
        { lastName: { $regex: req.params.name, $options: 'i' } }
      ]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search users by name (POST method)
router.post("/search", async (req, res) => {
  try {
    const { name } = req.body;
    const users = await User.find({
      $or: [
        { username: { $regex: name, $options: 'i' } },
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } }
      ]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test route to check if users exist
router.get("/test/exists", async (req, res) => {
  try {
    const count = await User.countDocuments();
    const allUsers = await User.find().select('username firstName lastName email _id');
    res.json({ 
      message: "User routes working", 
      totalUsers: count,
      allUsers: allUsers,
      sampleUsers: await User.find().limit(3).select('username firstName lastName email')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
