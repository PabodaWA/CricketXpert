const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  type: { 
    type: String, 
    enum: ['coaching', 'ground'], 
    required: true 
  },

  // For coaching bookings
  enrollmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enrollment', 
    default: null 
  },

  // For ground bookings
  groundId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ground', 
    default: null 
  },

  sessionTime: { 
    type: Date, 
    required: true 
  },

  startTime: { type: String, default: null }, // for ground bookings
  endTime: { type: String, default: null },   // for ground bookings

  status: { 
    type: String, 
    enum: ['confirmed', 'pending', 'cancelled', 'rescheduled'], 
    default: 'pending' 
  },

  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment", // Reference to Payment table
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
