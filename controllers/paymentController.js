import Payment from '../models/Payments.js';
import Order from '../models/Order.js';
import CartPending from '../models/cart_Pending.js';
import Product from '../models/Product.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';
import { sendLowStockAlert } from '../utils/wemailService.js';

// Create payment
const createPayment = async (req, res) => {
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
const getPayments = async (req, res) => {
  try {
    const { status, paymentType, userId, startDate, endDate, searchQuery, page = 1, limit = 10 } = req.query;
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
    
    // Handle search query for user names
    if (searchQuery) {
      // First find users that match the search query
      const User = (await import('../models/User.js')).default;
      const matchingUsers = await User.find({
        $or: [
          { firstName: { $regex: searchQuery, $options: 'i' } },
          { lastName: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = matchingUsers.map(user => user._id);
      if (userIds.length > 0) {
        query.userId = { $in: userIds };
      } else {
        // If no users found, return empty result
        return res.json({
          payments: [],
          totalPages: 0,
          currentPage: page,
          total: 0
        });
      }
    }
    
    const payments = await Payment.find(query)
      .populate('userId')
      .populate('orderId')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // For enrollment payments, find the related enrollment
    const paymentsWithEnrollment = await Promise.all(
      payments.map(async (payment) => {
        if (payment.paymentType === 'enrollment_payment') {
          const enrollment = await ProgramEnrollment.findOne({ paymentId: payment._id });
          return {
            ...payment.toObject(),
            enrollmentId: enrollment ? enrollment._id : null
          };
        }
        return payment.toObject();
      })
    );
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      payments: paymentsWithEnrollment,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment by ID
const getPayment = async (req, res) => {
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
const updatePaymentStatus = async (req, res) => {
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
const updatePayment = async (req, res) => {
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
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payments by user
const getPaymentsByUser = async (req, res) => {
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
const getPaymentsByOrder = async (req, res) => {
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
const processOrderPayment = async (req, res) => {
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
const processRefund = async (req, res) => {
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
const getPaymentStats = async (req, res) => {
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

export {
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
};

// New: Pay for selected Cart_Pending items by cartToken and productIds
// - Creates a completed Order with only the selected items
// - Creates a Payment record
// - Deletes those items from Cart_Pending
// - Returns order, payment, and remaining cart items for the cartToken
export const paySelectedCartItems = async (req, res) => {
  try {
    const { cartToken, productIds, customerId, address, paymentMethod } = req.body;

    if (!cartToken || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'cartToken and productIds are required' });
    }

    if (!customerId) {
      return res.status(400).json({ message: 'customerId is required' });
    }

    // Fetch selected cart pending items
    const items = await CartPending.find({
      cartToken,
      productId: { $in: productIds },
      status: 'cart_pending'
    }).populate('productId');

    if (!items || items.length === 0) {
      return res.status(404).json({ message: 'No matching cart items found to pay' });
    }

    // Build order items and compute totals using current stored line price/quantity
    let subtotal = 0;
    const orderItems = items.map((i) => {
      const unitPrice = Number(i.price ?? i.productId?.price) || 0;
      const qty = Number(i.quantity) || 1;
      subtotal += unitPrice * qty;
      return {
        productId: i.productId?._id || i.productId,
        quantity: qty,
        priceAtOrder: unitPrice
      };
    });

    const deliveryCharge = 450; // align with frontend
    const amount = subtotal + deliveryCharge;

    // Create completed order
    const order = new Order({
      customerId,
      items: orderItems,
      amount,
      address: address || '',
      status: 'completed',
      date: new Date()
    });
    await order.save();

    // Create payment linked to the order
    const payment = new Payment({
      userId: customerId,
      orderId: order._id,
      paymentType: 'order_payment',
      amount,
      status: 'success',
      method: paymentMethod || 'card',
      paymentDate: new Date()
    });
    await payment.save();

    // Attach paymentId to order
    order.paymentId = payment._id;
    await order.save();

    // Reduce stock quantities for all products in the order
    await reduceProductStock(orderItems);

    // Delete the purchased items from Cart_Pending
    await CartPending.deleteMany({ cartToken, productId: { $in: productIds } });

    // Return remaining cart items for the token
    const remainingCart = await CartPending.find({ cartToken, status: { $ne: 'removed' } })
      .populate('productId')
      .sort({ createdAt: 1 });

    const populatedOrder = await Order.findById(order._id)
      .populate('items.productId')
      .populate('paymentId');

    return res.status(200).json({
      success: true,
      order: populatedOrder,
      payment,
      remainingCart
    });
  } catch (error) {
    console.error('paySelectedCartItems error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Function to reduce product stock when order is completed
const reduceProductStock = async (orderItems) => {
  try {
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        // Reduce stock quantity
        const newStock = Math.max(0, product.stock_quantity - item.quantity);
        product.stock_quantity = newStock;
        
        // Log stock reduction
        console.log(`📦 Stock reduced for ${product.name}: ${product.stock_quantity + item.quantity} → ${newStock} (reduced by ${item.quantity})`);
        
        // Log low stock warning if stock is low
        if (newStock <= 10) {
          console.log(`⚠️ LOW STOCK WARNING: ${product.name} (ID: ${product.productId}) - Current stock: ${newStock}`);
          
          // Send email alert to admin
          try {
            await sendLowStockAlert(product);
            console.log(`📧 Low stock email alert sent for ${product.name}`);
          } catch (emailError) {
            console.error(`❌ Failed to send low stock email for ${product.name}:`, emailError);
          }
        }
        
        await product.save();
      }
    }
  } catch (error) {
    console.error('Error reducing product stock:', error);
    throw error;
  }
};
