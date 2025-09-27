import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js'; // Added for customer email
import { sendLowStockAlert, sendOrderConfirmationEmail, sendOrderManagerNotificationEmail } from '../utils/wemailService.js';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';

// Create order
const createOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    
    // If order is created with completed status, reduce stock
    if (order.status === 'completed') {
      await reduceProductStock(order.items);
      
      // Send email notifications for completed orders
      try {
        console.log('📧 Sending order confirmation emails for completed order...');
        
        // Get populated order with customer details for email
        const populatedOrder = await Order.findById(order._id)
          .populate('items.productId')
          .populate('customerId')
          .populate('paymentId');
        
        // Send confirmation email to customer
        if (populatedOrder.customerId && populatedOrder.customerId.email) {
          await sendOrderConfirmationEmail(populatedOrder, populatedOrder.customerId);
          console.log(`📧 Order confirmation email sent to customer: ${populatedOrder.customerId.email}`);
        } else {
          console.log('⚠️ Customer email not found, skipping customer confirmation email');
        }

        // Send notification email to order manager
        await sendOrderManagerNotificationEmail(populatedOrder, populatedOrder.customerId);
        console.log('📧 Order notification email sent to manager');
        
      } catch (emailError) {
        console.error('❌ Failed to send order confirmation emails:', emailError);
        // Continue with response even if emails fail
      }
    }
    
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create cart order (pending order when items are added to cart)
const createCartOrder = async (req, res) => {
  try {
    const { customerId, items, amount, address } = req.body;
    
    // Check if user already has a pending cart order
    let existingCartOrder = await Order.findOne({ 
      customerId, 
      status: 'cart_pending' 
    });

    if (existingCartOrder) {
      // Update existing cart order
      existingCartOrder.items = items;
      existingCartOrder.amount = amount;
      existingCartOrder.address = address;
      existingCartOrder.date = new Date();
      await existingCartOrder.save();
      res.json(existingCartOrder);
    } else {
      // Create new cart order
      const cartOrder = new Order({
        customerId,
        items,
        amount,
        address,
        status: 'cart_pending',
        date: new Date()
      });
      await cartOrder.save();
      res.status(201).json(cartOrder);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get cart order for a user
const getCartOrder = async (req, res) => {
  try {
    const { customerId } = req.params;
    const cartOrder = await Order.findOne({ 
      customerId, 
      status: 'cart_pending' 
    }).populate('items.productId');
    
    if (!cartOrder) {
      return res.status(404).json({ message: 'No pending cart order found' });
    }
    
    res.json(cartOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update cart order to completed order (when payment is successful)
const completeCartOrder = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status !== 'cart_pending') {
      return res.status(400).json({ message: 'Order is not in cart pending status' });
    }
    
    // Update order status and add payment ID
    // After payment, mark as completed per requirement
    order.status = 'completed';
    order.paymentId = paymentId;
    order.date = new Date();
    await order.save();
    
    // Reduce stock quantities for all products in the order
    await reduceProductStock(order.items);
    
    // Get populated order with customer details for email
    const populatedOrder = await Order.findById(order._id)
      .populate('items.productId')
      .populate('customerId')
      .populate('paymentId');

    // Send email notifications after successful order completion
    try {
      console.log('📧 Sending order confirmation emails...');
      
      // Send confirmation email to customer
      if (populatedOrder.customerId && populatedOrder.customerId.email) {
        await sendOrderConfirmationEmail(populatedOrder, populatedOrder.customerId);
        console.log(`📧 Order confirmation email sent to customer: ${populatedOrder.customerId.email}`);
      } else {
        console.log('⚠️ Customer email not found, skipping customer confirmation email');
      }

      // Send notification email to order manager
      await sendOrderManagerNotificationEmail(populatedOrder, populatedOrder.customerId);
      console.log('📧 Order notification email sent to manager');
      
    } catch (emailError) {
      console.error('❌ Failed to send order confirmation emails:', emailError);
      // Continue with response even if emails fail
    }
    
    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete cart order (when user clears cart)
const deleteCartOrder = async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await Order.deleteOne({ 
      customerId, 
      status: 'cart_pending' 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No pending cart order found' });
    }
    
    res.json({ message: 'Cart order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all orders (optionally include cart pending items from Cart_Pending)
const getOrders = async (req, res) => {
  try {
    const includeCartPending = String(req.query.includeCartPending || '').toLowerCase();
    const shouldIncludeCartPending = includeCartPending === '1' || includeCartPending === 'true';

    const orders = await Order.find().populate("items.productId");

    // Map orders with a type field for unified frontend rendering
    const typedOrders = orders.map((o) => ({ ...o.toObject(), type: 'order' }));

    if (!shouldIncludeCartPending) {
      return res.json(typedOrders);
    }

    // Lazy import to avoid circular deps at top (and only when needed)
    const { default: CartPending } = await import('../models/cart_Pending.js');

    const cartPendingItems = await CartPending.find({ status: { $ne: 'removed' } })
      .populate('productId')
      .sort({ createdAt: -1 });

    // Normalize cart pending items to order-like objects
    const normalizedCartPending = cartPendingItems.map((cp) => {
      const product = cp.productId || {};
      return {
        _id: cp._id,
        type: 'cart_pending',
        status: cp.status || 'cart_pending',
        cartToken: cp.cartToken,
        productTitle: cp.title || product.name || 'Unknown',
        price: Number(cp.price || product.price || 0),
        quantity: Number(cp.quantity || 1),
        total: Number(cp.total || 0),
        amount: Number(cp.total || 0),
        createdAt: cp.createdAt,
        updatedAt: cp.updatedAt,
        date: cp.createdAt,
        // Keep existing fields for compatibility (set to sensible defaults)
        customerId: null,
        address: '',
        items: [],
      };
    });

    // Combine and sort by newest first using date/createdAt
    const combined = [...typedOrders, ...normalizedCartPending].sort((a, b) => {
      const aTime = new Date(a.date || a.createdAt || 0).getTime();
      const bTime = new Date(b.date || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    return res.json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get order by ID
const getOrder = async (req, res) => {
  try {
    console.log('Getting order with ID:', req.params.id);
    const order = await Order.findById(req.params.id).populate("items.productId");
    console.log('Found order:', order ? 'Yes' : 'No');
    
    if (!order) {
      console.log('Order not found for ID:', req.params.id);
      return res.status(404).json({ message: "Order not found" });
    }
    
    console.log('Order details:', {
      id: order._id,
      status: order.status,
      amount: order.amount,
      itemsCount: order.items?.length,
      items: order.items?.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: item.priceAtOrder,
        productPopulated: !!item.productId
      }))
    });
    
    // If items don't have populated product data, try to populate them
    if (order.items && order.items.some(item => !item.productId || typeof item.productId === 'string')) {
      console.log('Re-populating order items...');
      const populatedOrder = await Order.findById(req.params.id).populate("items.productId");
      res.json(populatedOrder);
    } else {
      res.json(order);
    }
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ message: error.message });
  }
};

/* Update order status
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};*/



// Manual order status update by manager
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['created', 'processing', 'completed', 'cancelled', 'cart_pending'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const previousStatus = order.status;

    // Handle stock changes based on status transitions
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      // Order is being cancelled - restore stock if it was previously paid/created
      if (previousStatus === 'created' || previousStatus === 'processing' || previousStatus === 'completed') {
        await restoreProductStock(order.items);
      }
    }

    // Update order status
    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order details (address, amount, status, items)
const updateOrder = async (req, res) => {
  try {
    const { address, amount, status, items } = req.body;
    const validStatuses = ['created', 'processing', 'completed', 'cancelled', 'cart_pending'];

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Validate status if provided
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const previousStatus = order.status;

    // Update fields if provided
    if (address !== undefined) order.address = address;
    if (amount !== undefined) order.amount = amount;
    if (status !== undefined) order.status = status;
    if (items !== undefined) order.items = items;

    // Handle stock changes based on status transitions
    if (status !== undefined) {
      if (status === 'completed' && previousStatus !== 'completed') {
        // Order is being completed - reduce stock
        await reduceProductStock(order.items);
      } else if (status === 'cancelled' && previousStatus !== 'cancelled') {
        // Order is being cancelled - restore stock if it was previously paid/created
        if (previousStatus === 'created' || previousStatus === 'processing' || previousStatus === 'completed') {
          await restoreProductStock(order.items);
        }
      }
    }

    await order.save();

    // Send email notifications if order is being completed
    if (status === 'completed' && previousStatus !== 'completed') {
      try {
        console.log('📧 Sending order confirmation emails for completed order...');
        
        // Get populated order with customer details for email
        const populatedOrder = await Order.findById(order._id)
          .populate('items.productId')
          .populate('customerId')
          .populate('paymentId');
        
        // Send confirmation email to customer
        if (populatedOrder.customerId && populatedOrder.customerId.email) {
          await sendOrderConfirmationEmail(populatedOrder, populatedOrder.customerId);
          console.log(`📧 Order confirmation email sent to customer: ${populatedOrder.customerId.email}`);
        } else {
          console.log('⚠️ Customer email not found, skipping customer confirmation email');
        }

        // Send notification email to order manager
        await sendOrderManagerNotificationEmail(populatedOrder, populatedOrder.customerId);
        console.log('📧 Order notification email sent to manager');
        
      } catch (emailError) {
        console.error('❌ Failed to send order confirmation emails:', emailError);
        // Continue with response even if emails fail
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//.......................................................................................................................

// Download order as PDF and send email
const downloadOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate('items.productId')
      .populate('customerId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('📋 Order details for PDF generation:', {
      orderId: order._id,
      customerId: order.customerId,
      customerEmail: order.customerId?.email,
      customerName: order.customerId?.firstName + ' ' + order.customerId?.lastName,
      itemsCount: order.items?.length,
      amount: order.amount
    });

    // Create PDF document
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      // Send email with PDF attachment FIRST
      try {
        await sendOrderPDFEmail(order, pdfData);
        console.log(`📧 Order PDF sent to customer email for order ${orderId}`);
      } catch (emailError) {
        console.error(`❌ Failed to send order PDF email for order ${orderId}:`, emailError);
        // Continue with download even if email fails
      }

      // Then send PDF to browser
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="order-${orderId}.pdf"`);
      res.setHeader('Content-Length', pdfData.length);
      res.send(pdfData);
    });

    // PDF Content Generation with Proper Text Wrapping
    
    // Set page margins and width
    const pageWidth = 612;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    // Header
    doc.fontSize(20).text('CricketExpert - Order Details', margin, 50, { width: contentWidth, align: 'center' });
    doc.moveDown(1);

    // Order Information
    doc.fontSize(16).text('Order Information', margin, doc.y, { width: contentWidth, underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    
    // Order details with proper positioning
    const orderY = doc.y;
    doc.text(`Order ID: ${order._id}`, margin, orderY, { width: contentWidth });
    doc.text(`Date: ${new Date(order.date || order.createdAt).toLocaleDateString()}`, margin, doc.y, { width: contentWidth });
    doc.text(`Status: ${order.status}`, margin, doc.y, { width: contentWidth });
    
    // Total Amount with proper formatting
    const totalAmountText = `Total Amount: LKR ${(order.amount || 0).toFixed(2)}`;
    doc.text(totalAmountText, margin, doc.y, { width: contentWidth });
    doc.moveDown(1);

    // Customer Information
    if (order.customerId) {
      doc.fontSize(16).text('Customer Information', margin, doc.y, { width: contentWidth, underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      
      const customerName = `Name: ${order.customerId.firstName || ''} ${order.customerId.lastName || ''}`;
      doc.text(customerName, margin, doc.y, { width: contentWidth });
      
      const customerEmail = `Email: ${order.customerId.email || 'N/A'}`;
      doc.text(customerEmail, margin, doc.y, { width: contentWidth });
      
      const customerAddress = `Address: ${order.address || 'N/A'}`;
      doc.text(customerAddress, margin, doc.y, { width: contentWidth });
      doc.moveDown(1);
    }

    // Order Items
    doc.fontSize(16).text('Order Items', margin, doc.y, { width: contentWidth, underline: true });
    doc.moveDown(0.5);

    if (order.items && order.items.length > 0) {
      // Table header
      doc.fontSize(10);
      const tableY = doc.y;
      doc.text('Product Name', margin, tableY);
      doc.text('Quantity', margin + 200, tableY);
      doc.text('Price', margin + 300, tableY);
      doc.text('Total', margin + 400, tableY);
      
      // Draw line under header
      doc.moveTo(margin, tableY + 15).lineTo(margin + contentWidth, tableY + 15).stroke();
      doc.y = tableY + 20;

      let totalAmount = 0;
      order.items.forEach((item) => {
        const productName = item.productId?.name || 'Unknown Product';
        const quantity = item.quantity;
        const price = item.priceAtOrder || 0;
        const itemTotal = price * quantity;
        totalAmount += itemTotal;

        const currentY = doc.y;
        doc.text(productName, margin, currentY, { width: 180 });
        doc.text(quantity.toString(), margin + 200, currentY);
        doc.text(`LKR ${price.toFixed(2)}`, margin + 300, currentY);
        doc.text(`LKR ${itemTotal.toFixed(2)}`, margin + 400, currentY);
        doc.moveDown(0.5);
      });

      // Total line
      doc.moveTo(margin, doc.y).lineTo(margin + contentWidth, doc.y).stroke();
      doc.moveDown(0.5);
      
      // Grand Total with proper formatting
      const grandTotalText = `Grand Total: LKR ${totalAmount.toFixed(2)}`;
      doc.fontSize(12).text(grandTotalText, margin + 300, doc.y, { width: 200, align: 'right' });
    } else {
      doc.text('No items in this order.', margin, doc.y, { width: contentWidth });
    }

    doc.moveDown(2);
    
    // Footer with proper text wrapping
    const footerY = doc.y;
    doc.fontSize(10).text('Thank you for choosing CricketExpert!', margin, footerY, { width: contentWidth, align: 'center' });
    doc.text('For any queries, contact us at info@cricketxpert.com', margin, doc.y, { width: contentWidth, align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error generating order PDF:', error);
    res.status(500).json({ message: 'Failed to generate order PDF' });
  }
};

// Helper function to send order PDF via email
const sendOrderPDFEmail = async (order, pdfBuffer) => {
  try {
    console.log('📧 Starting to send order PDF email...');
    console.log('📧 Email config check:', {
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPass: !!process.env.EMAIL_PASS,
      customerEmail: order.customerId?.email
    });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log('📧 Email transporter verified successfully');

    const customerEmail = order.customerId?.email;
    if (!customerEmail) {
      console.error('❌ Customer email not found for order:', order._id);
      console.error('❌ Customer data:', order.customerId);
      throw new Error(`Customer email not found for order ${order._id}`);
    }

    console.log('📧 Sending email to customer:', customerEmail);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Your Order Details - ${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #42ADF5;">CricketExpert - Order Details</h2>
          <p>Dear ${order.customerId?.firstName || 'Customer'},</p>
          <p>Thank you for your order! Please find your order details attached as a PDF.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Date:</strong> ${new Date(order.date || order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Total Amount:</strong> LKR ${order.amount || 0}.00</p>
          </div>
          
          <p>If you have any questions about your order, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The CricketExpert Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `order-${order._id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    console.log('📧 Email sent to:', customerEmail);

  } catch (error) {
    console.error('❌ Error in sendOrderPDFEmail:', error);
    throw error;
  }
};

// Cancel order and notify order manager for refund
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate('customerId')
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed order' });
    }

    console.log('🚫 Order cancellation request:', {
      orderId: order._id,
      currentStatus: order.status,
      customerId: order.customerId,
      customerEmail: order.customerId?.email,
      amount: order.amount
    });

    // Update order status to cancelled
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    // Send notification email to order manager for refund processing
    try {
      await sendRefundNotificationEmail(order);
      console.log(`📧 Refund notification sent to order manager for order ${orderId}`);
    } catch (emailError) {
      console.error(`❌ Failed to send refund notification email for order ${orderId}:`, emailError);
      // Continue even if email fails
    }

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully. Order manager has been notified for refund processing.',
      order: order
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};

// Helper function to send refund notification to order manager
const sendRefundNotificationEmail = async (order) => {
  try {
    console.log('📧 Starting to send refund notification email...');
    console.log('📧 Email config check:', {
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPass: !!process.env.EMAIL_PASS,
      serviceManagerEmail: process.env.SERVICE_MANAGER_EMAIL
    });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log('📧 Email transporter verified successfully');

    const serviceManagerEmail = process.env.SERVICE_MANAGER_EMAIL;
    if (!serviceManagerEmail) {
      console.error('❌ Service manager email not configured');
      throw new Error('Service manager email not configured');
    }

    console.log('📧 Sending refund notification to service manager:', serviceManagerEmail);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: serviceManagerEmail,
      subject: `🚨 REFUND REQUIRED - Order Cancelled: ${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">🚨 Order Cancellation - Refund Required</h2>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #721c24;">Action Required: Process Refund</h3>
            <p style="color: #721c24; margin: 0;">A customer has cancelled their order and requires a refund.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Customer Name:</strong> ${order.customerId?.firstName || ''} ${order.customerId?.lastName || ''}</p>
            <p><strong>Customer Email:</strong> ${order.customerId?.email || 'N/A'}</p>
            <p><strong>Order Date:</strong> ${new Date(order.date || order.createdAt).toLocaleDateString()}</p>
            <p><strong>Cancelled Date:</strong> ${new Date(order.cancelledAt).toLocaleDateString()}</p>
            <p><strong>Refund Amount:</strong> LKR ${order.amount || 0}.00</p>
            <p><strong>Order Status:</strong> ${order.status}</p>
          </div>

          <div style="background-color: #e2e3e5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Items</h3>
            ${order.items && order.items.length > 0 ? 
              order.items.map(item => `
                <p style="margin: 5px 0;">
                  • ${item.productId?.name || 'Unknown Product'} 
                  (Qty: ${item.quantity}, Price: LKR ${item.priceAtOrder || 0})
                </p>
              `).join('') : 
              '<p>No items found</p>'
            }
          </div>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0c5460;">Next Steps</h3>
            <ol style="color: #0c5460;">
              <li>Verify the order cancellation details</li>
              <li>Process the refund of LKR ${order.amount || 0}.00</li>
              <li>Update the payment system</li>
              <li>Notify the customer about the refund processing</li>
            </ol>
          </div>
          
          <p style="color: #6c757d; font-size: 12px;">
            This is an automated notification from CricketExpert Order Management System.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Refund notification sent successfully:', info.messageId);
    console.log('📧 Email sent to service manager:', serviceManagerEmail);

  } catch (error) {
    console.error('❌ Error in sendRefundNotificationEmail:', error);
    throw error;
  }
};
// Calculate order total with delivery
const calculateOrderTotal = async (req, res) => {
  try {
    const { items } = req.body;
    const deliveryCharge = 450; // Fixed delivery charge as mentioned
    
    let subtotal = 0;
    
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          message: `Product not found: ${item.productId}` 
        });
      }
      subtotal += product.price * item.quantity;
    }
    
    const total = subtotal + deliveryCharge;
    
    res.json({
      subtotal,
      deliveryCharge,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get orders by status
const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await Order.find({ status })
      .populate('items.productId')
      .populate('paymentId')
      .sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

// Function to restore product stock when order is cancelled
const restoreProductStock = async (orderItems) => {
  try {
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        // Restore stock quantity
        const newStock = product.stock_quantity + item.quantity;
        product.stock_quantity = newStock;
        
        // Log stock restoration
        console.log(`📦 Stock restored for ${product.name}: ${product.stock_quantity - item.quantity} → ${newStock} (restored by ${item.quantity})`);
        
        await product.save();
      }
    }
  } catch (error) {
    console.error('Error restoring product stock:', error);
    throw error;
  }
};

export {
  createOrder,
  createCartOrder,
  getCartOrder,
  completeCartOrder,
  deleteCartOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  downloadOrder,
  cancelOrder,
  calculateOrderTotal,
  getOrdersByStatus
};
