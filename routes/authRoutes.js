const express = require('express');
const router = express.Router();

// --- Add 'resetPassword' to this import list ---
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController.js');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

// This route work after resetPassword is imported
router.post('/reset-password', resetPassword);

module.exports = router;
