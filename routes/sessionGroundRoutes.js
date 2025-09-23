import express from 'express';
const router = express.Router();
import {
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
} from '../controllers/sessionGroundController.js';

// Middleware (Note: You'll need to implement these middleware functions)
// const { protect, authorize } = require('../middleware/auth');

// All routes require authentication (uncomment when auth middleware is available)
// router.use(protect);

// General session ground routes
router.get('/', getAllSessionGrounds);
router.get('/upcoming', getUpcomingBookings);
router.get('/stats', /* authorize('admin', 'manager'), */ getBookingStats);
router.get('/:id', getSessionGround);

// Create and update routes
router.post('/', createSessionGround);
router.put('/:id', updateSessionGround);

// Booking management routes
router.put('/:id/cancel', cancelSessionGround);
router.put('/:id/confirm', /* authorize('admin', 'manager'), */ confirmSessionGround);
router.put('/:id/complete', /* authorize('admin', 'manager'), */ completeSessionGround);

// Ground availability
router.get('/ground/:groundId/availability', getGroundAvailability);

// Filter routes
router.get('/session/:sessionId', getBookingsBySession);
router.get('/ground/:groundId', getBookingsByGround);

export default router;

