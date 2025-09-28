import RepairNotification from '../models/RepairNotification.js';
import RepairRequest from '../models/RepairRequest.js';
import User from '../models/User.js';

/**
 * Create a new repair notification
 */
const createRepairNotification = async (req, res) => {
  try {
    const { customerId, repairRequestId, type, title, message, metadata } = req.body;

    if (!customerId || !repairRequestId || !type || !title || !message) {
      return res.status(400).json({ 
        error: 'customerId, repairRequestId, type, title, and message are required' 
      });
    }

    const notification = await RepairNotification.create({
      customerId,
      repairRequestId,
      type,
      title,
      message,
      metadata: metadata || {}
    });

    res.status(201).json({ 
      message: 'Repair notification created successfully', 
      notification 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all repair notifications for a customer
 */
const getCustomerRepairNotifications = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    let filter = { customerId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await RepairNotification.find(filter)
      .populate('repairRequestId', 'equipmentType damageType status repairProgress')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await RepairNotification.countDocuments(filter);
    const unreadCount = await RepairNotification.countDocuments({ 
      customerId, 
      isRead: false 
    });

    res.json({
      notifications,
      totalCount,
      unreadCount,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await RepairNotification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ 
      message: 'Notification marked as read', 
      notification 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark all notifications as read for a customer
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await RepairNotification.updateMany(
      { customerId, isRead: false },
      { isRead: true }
    );

    res.json({ 
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await RepairNotification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Clear all notifications for a customer
 */
const clearAllNotifications = async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await RepairNotification.deleteMany({ customerId });

    res.json({ 
      message: `${result.deletedCount} notifications cleared`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get notification count for a customer
 */
const getNotificationCount = async (req, res) => {
  try {
    const { customerId } = req.params;

    const totalCount = await RepairNotification.countDocuments({ customerId });
    const unreadCount = await RepairNotification.countDocuments({ 
      customerId, 
      isRead: false 
    });

    res.json({
      totalCount,
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create notification when repair request is submitted
 * This is a helper function that can be called from other controllers
 */
const createRepairSubmissionNotification = async (customerId, repairRequestId, repairData) => {
  try {
    const customer = await User.findById(customerId);
    if (!customer) {
      console.error('Customer not found for notification:', customerId);
      return null;
    }

    const notification = await RepairNotification.create({
      customerId,
      repairRequestId,
      type: 'repair_submitted',
      title: 'Repair Request Submitted',
      message: `Your repair request for ${repairData.equipmentType || 'equipment'} has been submitted successfully. We'll review it and get back to you within 24 hours.`,
      metadata: {
        equipmentType: repairData.equipmentType,
        damageType: repairData.damageType,
        status: repairData.status,
        repairProgress: repairData.repairProgress || 0
      }
    });

    console.log('✅ Repair submission notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('❌ Error creating repair submission notification:', error);
    return null;
  }
};

/**
 * Create notification when repair request status changes
 */
const createRepairStatusNotification = async (customerId, repairRequestId, status, repairData) => {
  try {
    const customer = await User.findById(customerId);
    if (!customer) {
      console.error('Customer not found for notification:', customerId);
      return null;
    }

    let type, title, message;

    switch (status.toLowerCase()) {
      case 'approved':
        type = 'repair_approved';
        title = 'Repair Request Approved';
        message = `Great news! Your repair request has been approved. Cost estimate: $${repairData.costEstimate || 'TBD'}, Time estimate: ${repairData.timeEstimate || 'TBD'}`;
        break;
      case 'rejected':
        type = 'repair_rejected';
        title = 'Repair Request Update';
        message = `Your repair request has been reviewed. ${repairData.rejectionReason ? `Reason: ${repairData.rejectionReason}` : 'Please contact us for more details.'}`;
        break;
      case 'in repair':
        type = 'repair_in_progress';
        title = 'Repair In Progress';
        message = `Your equipment repair is now in progress. Progress: ${repairData.repairProgress || 0}%`;
        break;
      case 'ready for pickup':
      case 'completed':
        type = 'repair_completed';
        title = 'Repair Completed';
        message = `Your equipment repair is complete and ready for pickup!`;
        break;
      default:
        type = 'repair_in_progress';
        title = 'Repair Status Update';
        message = `Your repair request status has been updated to: ${status}`;
    }

    const notification = await RepairNotification.create({
      customerId,
      repairRequestId,
      type,
      title,
      message,
      metadata: {
        equipmentType: repairData.equipmentType,
        damageType: repairData.damageType,
        status: status,
        repairProgress: repairData.repairProgress || 0
      }
    });

    console.log('✅ Repair status notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('❌ Error creating repair status notification:', error);
    return null;
  }
};

export default {
  createRepairNotification,
  getCustomerRepairNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationCount,
  createRepairSubmissionNotification,
  createRepairStatusNotification
};

