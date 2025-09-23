import express from 'express';
const router = express.Router();
import {
  getAllSessions,
  getSession,
  createSession,
  createDirectSession,
  updateSession,
  deleteSession,
  addParticipant,
  removeParticipant,
  markAttendance,
  getSessionsByProgram,
  getSessionsByCoach,
  getSessionsByEnrollment,
  getGroundAvailability,
  rescheduleSession,
  debugSessionCreation
} from '../controllers/sessionController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

// All routes require authentication
router.use(protect);

// General session routes
router.get('/', getAllSessions);
router.get('/:id', getSession);

// Coach only routes
router.post('/', /* authorize('coach', 'admin'), */ createSession);
router.put('/:id', /* authorize('coach', 'admin'), */ updateSession);
router.delete('/:id', /* authorize('coach', 'admin'), */ deleteSession);

// Manager/Admin only routes
router.put('/:id/reschedule', /* authorize('manager', 'admin'), */ rescheduleSession);

// Coach attendance management
router.put('/:id/attendance', /* authorize('coach', 'admin'), */ markAttendance);

// User participation routes
router.post('/:id/participants', addParticipant);
router.delete('/:id/participants/:participantId', removeParticipant);

// Direct session booking (no coach approval required)
router.post('/direct-booking', createDirectSession);

// Filter routes
router.get('/program/:programId', getSessionsByProgram);
router.get('/coach/:coachId', getSessionsByCoach);
router.get('/enrollment/:enrollmentId', getSessionsByEnrollment);

// Ground availability
router.get('/ground/:groundId/availability', getGroundAvailability);

// Debug route
router.post('/debug', debugSessionCreation);

export default router;

