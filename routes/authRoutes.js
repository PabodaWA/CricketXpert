import express from 'express';
const router = express.Router();

// --- Add 'resetPassword' to this import list ---
import { registerUser, loginUser, forgotPassword, resetPassword, sendEmailVerification, verifyEmailCode } from '../controllers/authController.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

// This route work after resetPassword is imported
router.post('/reset-password', resetPassword);

// Email verification routes
router.post('/send-email-verification', sendEmailVerification);
router.post('/verify-email-code', verifyEmailCode);

export default router;
