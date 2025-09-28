import express from 'express';
import repairNotificationController from '../controllers/repairNotificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all repair notifications for a customer
router.get('/customer/:customerId', protect, repairNotificationController.getCustomerRepairNotifications);

// Get notification count for a customer
router.get('/customer/:customerId/count', protect, repairNotificationController.getNotificationCount);

// Mark a specific notification as read
router.put('/:notificationId/read', protect, repairNotificationController.markNotificationAsRead);

// Mark all notifications as read for a customer
router.put('/customer/:customerId/read-all', protect, repairNotificationController.markAllNotificationsAsRead);

// Delete a specific notification
router.delete('/:notificationId', protect, repairNotificationController.deleteNotification);

// Clear all notifications for a customer
router.delete('/customer/:customerId/clear-all', protect, repairNotificationController.clearAllNotifications);

// Create a new repair notification (for internal use)
router.post('/', protect, repairNotificationController.createRepairNotification);

export default router;

