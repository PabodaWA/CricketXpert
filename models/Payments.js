const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // customer or staff
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null }, // optional
  paymentType: {
    type: String,
    enum: ['order_payment', 'booking_payment'],
    required: true
  },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'refunded'],
    default: 'pending'
  },
  paymentDate: { type: Date, required: true }
}, { timestamps: true }); // adds createdAt & updatedAt automatically

module.exports = mongoose.model('Payment', paymentSchema);