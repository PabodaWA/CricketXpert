import express from 'express';
import {
  createSessionRequest,
  getUserSessionRequests,
  getCoachSessionRequests,
  approveSessionRequest,
  rejectSessionRequest,
  cancelSessionRequest
} from '../controllers/sessionRequestController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.post('/', createSessionRequest);
router.get('/user', getUserSessionRequests);
router.put('/:id/cancel', cancelSessionRequest);

// Coach routes
router.get('/coach', authorizeRoles('coach', 'admin'), getCoachSessionRequests);
router.put('/:id/approve', authorizeRoles('coach', 'admin'), approveSessionRequest);
router.put('/:id/reject', authorizeRoles('coach', 'admin'), rejectSessionRequest);

export default router;
