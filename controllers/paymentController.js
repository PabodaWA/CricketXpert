const Payment = require('../models/Payments');
const Order = require('../models/Order');

// Create payment
exports.createPayment = async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      paymentDate: req.body.paymentDate || new Date()
    };
    
    const payment = new Payment(paymentData);
    await payment.save();
    
    const populatedPayment = await Payment.findById(payment._id)
      .populate('userId')
      .populate('orderId');
    
    res.status(201).json(populatedPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all payments
exports.getPayments = async (req, res) => {
  try {
    const { status, paymentType, userId, startDate, endDate, page = 1, limit = 10 } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    if (userId) query.userId = userId;
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const payments = await Payment.find(query)
      .populate('userId')
      .populate('orderId')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment by ID
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId')
      .populate('orderId');
    
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['success', 'failed', 'pending', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'success' && { paymentDate: new Date() })
      },
      { new: true }
    ).populate('userId').populate('orderId');
    
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update payment details
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId').populate('orderId');
    
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payments by user
exports.getPaymentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, paymentType } = req.query;
    let query = { userId };
    
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    
    const payments = await Payment.find(query)
      .populate('orderId')
      .sort({ paymentDate: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payments by order
exports.getPaymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payments = await Payment.find({ orderId })
      .populate('userId')
      .sort({ paymentDate: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process order payment (manual order status update)
exports.processOrderPayment = async (req, res) => {
  try {
    const { orderId, userId, amount, paymentMethod, orderStatus } = req.body;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Verify amount matches
    if (amount !== order.amount) {
      return res.status(400).json({ message: 'Payment amount does not match order total' });
    }

    // Create payment record
    const payment = new Payment({
      userId,
      orderId,
      paymentType: 'order_payment',
      amount,
      status: 'success',
      paymentDate: new Date()
    });

    await payment.save();

    // Update order with paymentId + manual status
    await Order.findByIdAndUpdate(orderId, { 
      paymentId: payment._id,
      ...(orderStatus && { status: orderStatus }) // <-- manual order status update
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('userId')
      .populate('orderId');

    res.status(201).json(populatedPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Process refund
exports.processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { refundAmount, reason } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    if (payment.status !== 'success') {
      return res.status(400).json({ message: 'Can only refund successful payments' });
    }
    
    if (refundAmount > payment.amount) {
      return res.status(400).json({ message: 'Refund amount cannot exceed payment amount' });
    }
    
    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      { 
        status: 'refunded',
        refundAmount,
        refundReason: reason,
        refundDate: new Date()
      },
      { new: true }
    ).populate('userId').populate('orderId');
    
    if (payment.orderId) {
      await Order.findByIdAndUpdate(payment.orderId, { status: 'cancelled' });
    }
    
    res.json(updatedPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const stats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulPayments: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          pendingPayments: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          failedPayments: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          refundedPayments: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
          successfulAmount: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0] } }
        }
      }
    ]);
    
    const paymentTypeStats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    res.json({
      overall: stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        refundedPayments: 0,
        successfulAmount: 0
      },
      byType: paymentTypeStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
