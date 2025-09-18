const express = require('express');
const router = express.Router();
const {
  getAllCoaches,
  getCoach,
  createCoach,
  updateCoach,
  deleteCoach,
  getCoachesBySpecialization,
  updateCoachAvailability,
  updateCoachRating,
  assignProgramToCoach,
  removeProgramFromCoach,
  getCoachStats,
  toggleCoachStatus
} = require('../controllers/coachController');

// Middleware (Note: You'll need to implement these middleware functions)
// const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllCoaches); // Get all coaches with filtering
router.get('/specialization/:specialization', getCoachesBySpecialization); // Get coaches by specialization
router.get('/:id', getCoach); // Get single coach profile

// Protected routes (uncomment when auth middleware is available)
// router.use(protect); // Require authentication for all routes below

// Coach and Admin routes
router.post('/', /* authorize('admin', 'coaching_manager'), */ createCoach); // Create coach profile
router.put('/:id', /* authorize('admin', 'coach'), */ updateCoach); // Update coach profile
router.put('/:id/availability', /* authorize('admin', 'coach'), */ updateCoachAvailability); // Update availability

// Admin and Coaching Manager routes
router.delete('/:id', /* authorize('admin'), */ deleteCoach); // Delete/deactivate coach
router.put('/:id/status', /* authorize('admin'), */ toggleCoachStatus); // Change coach status
router.get('/stats/overview', /* authorize('admin', 'coaching_manager'), */ getCoachStats); // Get coach statistics
router.put('/:id/assign-program', /* authorize('admin', 'coaching_manager'), */ assignProgramToCoach); // Assign program
router.put('/:id/remove-program', /* authorize('admin', 'coaching_manager'), */ removeProgramFromCoach); // Remove program

// System routes (for internal use)
router.put('/:id/rating', /* authorize('admin', 'system'), */ updateCoachRating); // Update rating (called by feedback system)

module.exports = router;






