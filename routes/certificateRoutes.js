import express from 'express';
import {
  checkCertificateEligibility,
  generateCertificate,
  downloadCertificate,
  getUserCertificates,
  verifyCertificate
} from '../controllers/certificateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/certificates/eligibility/:enrollmentId
// @desc    Check certificate eligibility for an enrollment
// @access  Private
router.get('/eligibility/:enrollmentId', protect, checkCertificateEligibility);

// @route   POST /api/certificates/generate/:enrollmentId
// @desc    Generate certificate for eligible enrollment
// @access  Private
router.post('/generate/:enrollmentId', protect, generateCertificate);

// @route   GET /api/certificates/download/:certificateId
// @desc    Download certificate PDF
// @access  Private
router.get('/download/:certificateId', protect, downloadCertificate);

// @route   GET /api/certificates/user/:userId
// @desc    Get user's certificates
// @access  Private
router.get('/user/:userId', protect, getUserCertificates);

// @route   GET /api/certificates/verify/:certificateNumber
// @desc    Verify certificate (public endpoint)
// @access  Public
router.get('/verify/:certificateNumber', verifyCertificate);

export default router;
