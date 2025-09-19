import express from 'express';
const router = express.Router();
import {
  getAllSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  addParticipant,
  removeParticipant,
  markAttendance,
  getSessionsByProgram,
  getSessionsByCoach,
  getGroundAvailability
} from '../controllers/sessionController.js';

// Middleware (Note: You'll need to implement these middleware functions)
// const { protect, authorize } = require('../middleware/auth');

// All routes require authentication (uncomment when auth middleware is available)
// router.use(protect);

// General session routes
router.get('/', getAllSessions);
router.get('/:id', getSession);

// Coach only routes
router.post('/', /* authorize('coach', 'admin'), */ createSession);
router.put('/:id', /* authorize('coach', 'admin'), */ updateSession);
router.delete('/:id', /* authorize('coach', 'admin'), */ deleteSession);

// Coach attendance management
router.put('/:id/attendance', /* authorize('coach', 'admin'), */ markAttendance);

// User participation routes
router.post('/:id/participants', addParticipant);
router.delete('/:id/participants/:participantId', removeParticipant);

// Filter routes
router.get('/program/:programId', getSessionsByProgram);
router.get('/coach/:coachId', getSessionsByCoach);

// Ground availability
router.get('/ground/:groundId/availability', getGroundAvailability);

export default router;

