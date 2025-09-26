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
  customerRescheduleSession,
  cleanupDuplicateSessions,
  removeExtraSessions,
  fixSessionWeeks,
  debugSessionsForEnrollment,
  debugSessionCreation
} from '../controllers/sessionController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

// Test route to verify sessions routes are working (public)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Sessions routes are working' });
});

// Debug routes removed - no longer needed

// All other routes require authentication
router.use(protect);

// Customer reschedule route (MUST come before all /:id routes)
router.put('/reschedule', (req, res, next) => {
  console.log('Customer reschedule route hit:', req.body);
  next();
}, customerRescheduleSession);

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

// Cleanup route
router.post('/cleanup-duplicates', cleanupDuplicateSessions);

// Temporary cleanup route without authentication for testing
router.post('/cleanup-duplicates-test', (req, res, next) => {
  // Skip authentication for testing
  req.user = { _id: 'test-user' };
  next();
}, cleanupDuplicateSessions);

export default router;

