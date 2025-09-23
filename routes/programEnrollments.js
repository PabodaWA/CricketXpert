import express from 'express';
import {
  getAllEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  cancelEnrollment,
  getUserEnrollments,
  updateProgress,
  addFeedback,
  getProgramEnrollmentStats,
  activateEnrollment,
  debugAllEnrollments,
  processEnrollmentPayment
} from '../controllers/programEnrollmentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin only routes
router.get('/', /* authorize('admin'), */ getAllEnrollments);
router.get('/program/:programId/stats', /* authorize('coach', 'admin'), */ getProgramEnrollmentStats);

// User accessible routes
router.get('/:id', getEnrollment);
router.post('/', createEnrollment);
router.put('/:id', updateEnrollment);
router.delete('/:id', cancelEnrollment);

// User-specific routes
router.get('/user/:userId', getUserEnrollments); // Get enrollments for specific user
router.get('/user', getUserEnrollments); // Get enrollments for authenticated user

// Coach/Admin routes
router.put('/:id/progress', /* authorize('coach', 'admin'), */ updateProgress);

// User/Coach routes  
router.post('/:id/feedback', addFeedback);

// Activation route
router.put('/:id/activate', activateEnrollment);

// Debug route
router.get('/debug/all', debugAllEnrollments);

// Payment route
router.post('/:id/payment', processEnrollmentPayment);

export default router;
