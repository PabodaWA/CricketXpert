const express = require('express');
const router = express.Router();
const {
    createPayment,
    getPayments,
    getPayment,
    updatePaymentStatus,
    updatePayment,
    deletePayment,
    getPaymentsByUser,
    getPaymentsByOrder,
    processOrderPayment,
    processRefund,
    getPaymentStats
} = require('../controllers/paymentController.js');
const { protect, authorizeRoles } = require('../utils/protect.js');

// --- Admin & Manager Only Routes ---
router.get('/', protect, authorizeRoles('admin', 'order_manager'), getPayments);
router.get('/stats', protect, authorizeRoles('admin', 'order_manager'), getPaymentStats);
router.post('/process-order', protect, authorizeRoles('admin', 'order_manager'), processOrderPayment);
router.post('/:paymentId/refund', protect, authorizeRoles('admin', 'order_manager'), processRefund);

router.get('/:id', protect, authorizeRoles('admin', 'order_manager'), getPayment);
router.put('/:id/status', protect, authorizeRoles('admin', 'order_manager'), updatePaymentStatus);
router.put('/:id', protect, authorizeRoles('admin', 'order_manager'), updatePayment);
router.delete('/:id', protect, authorizeRoles('admin', 'order_manager'), deletePayment);

// --- Routes for specific users or orders (could be used by customers too) ---
router.get('/user/:userId', protect, getPaymentsByUser);
router.get('/order/:orderId', protect, getPaymentsByOrder);

// --- Public or Customer Route to create a payment ---
router.post('/', protect, createPayment); // Assuming any logged-in user can create a payment

module.exports = router;
