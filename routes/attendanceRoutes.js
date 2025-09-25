import express from 'express';
import {
  markAttendance,
  getSessionAttendance,
  getCoachAttendanceSummary,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController.js';

const router = express.Router();

// Attendance routes
router.post('/mark', markAttendance); // Mark attendance for session participants
router.get('/session/:sessionId', getSessionAttendance); // Get session attendance
router.get('/coach/:coachId', getCoachAttendanceSummary); // Get coach attendance summary
router.put('/:id', updateAttendance); // Update attendance record
router.delete('/:id', deleteAttendance); // Delete attendance record

export default router;
