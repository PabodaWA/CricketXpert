const express = require('express');
const router = express.Router();
const {
  getCoachingPrograms,
  getCoachingProgram,
  createCoachingProgram,
  updateCoachingProgram,
  deleteCoachingProgram,
  getProgramsByCoach,
  addMaterial,
  getProgramStats
} = require('../controllers/coachingProgramController');

// Middleware (Note: You'll need to implement these middleware functions)
// const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getCoachingPrograms);
router.get('/:id', getCoachingProgram);
router.get('/coach/:coachId', getProgramsByCoach);

// Protected routes (uncomment when auth middleware is available)
// router.use(protect); // Require authentication for all routes below

// Coach/Admin only routes
router.post('/', /* authorize('coach', 'admin'), */ createCoachingProgram);
router.put('/:id', /* authorize('coach', 'admin'), */ updateCoachingProgram);
router.delete('/:id', /* authorize('coach', 'admin'), */ deleteCoachingProgram);
router.post('/:id/materials', /* authorize('coach', 'admin'), */ addMaterial);

// Admin/Coach only routes
router.get('/:id/stats', /* authorize('coach', 'admin'), */ getProgramStats);

module.exports = router;

