import mongoose from 'mongoose';

// Schema for items in the order
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: { type: Number, required: true, min: 1 },
  priceAtOrder: { type: Number, required: true, min: 0 }
});

// Main Order schema
const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [orderItemSchema],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['cart_pending', 'created', 'processing', 'completed', 'delivered', 'cancelled', 'delayed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'cart_pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  deliveryDate: {
    type: Date,
    required: false
  },
  remainingDays: {
    type: Number,
    required: false,
    default: 0
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: false
  }
});

export default mongoose.model('Order', orderSchema);
