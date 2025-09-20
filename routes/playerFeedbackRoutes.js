import express from 'express';
const router = express.Router();
import {
  submitPlayerFeedback,
  getCoachFeedbacks,
  getPlayerFeedbacks,
  updateFeedbackVisibility,
  getCoachFeedbackStats
} from '../controllers/playerFeedbackController.js';

// Middleware (Note: You'll need to implement these middleware functions)
// const { protect, authorize } = require('../middleware/auth');

// All routes require authentication (uncomment when auth middleware is available)
// router.use(protect);

// Coach routes
router.post('/', /* authorize('coach'), */ submitPlayerFeedback);
router.get('/coach/:coachId', /* authorize('coach'), */ getCoachFeedbacks);
router.get('/coach/:coachId/stats', /* authorize('coach'), */ getCoachFeedbackStats);
router.put('/:id/visibility', /* authorize('coach'), */ updateFeedbackVisibility);

// Player routes
router.get('/player/:playerId', /* authorize('customer'), */ getPlayerFeedbacks);

export default router;
