import mongoose from 'mongoose';

const sessionGroundSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  ground: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ground',
    required: true
  },
  groundSlot: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  bookingDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true // Format: "HH:MM"
  },
  endTime: {
    type: String,
    required: true // Format: "HH:MM"
  },
  duration: {
    type: Number,
    required: true // in minutes
  },
  status: {
    type: String,
    enum: ['booked', 'confirmed', 'cancelled', 'completed'],
    default: 'booked'
  },
  bookingType: {
    type: String,
    enum: ['session', 'practice', 'match', 'training'],
    default: 'session'
  },
  price: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payments'
  },
  specialRequirements: [String], // e.g., ['equipment', 'lighting', 'security']
  notes: String,
  cancellationReason: String,
  cancelledAt: Date,
  confirmedAt: Date,
  completedAt: Date,
  // Weather and conditions tracking
  weatherConditions: {
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    conditions: String // 'sunny', 'cloudy', 'rainy', 'stormy'
  },
  // Equipment provided/required
  equipmentProvided: [String],
  equipmentRequired: [String],
  // Ground condition after use
  groundCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  maintenanceNotes: String,
  // Recurring booking information
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly']
    },
    daysOfWeek: [String], // ['monday', 'tuesday', etc.]
    endDate: Date,
    occurrences: Number // Total number of occurrences
  },
  parentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SessionGround' // For recurring bookings
  },
  // Booking validation
  bookingDeadline: {
    type: Date,
    required: true
  },
  autoConfirm: {
    type: Boolean,
    default: false
  },
  // Manager approval
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalNotes: String
}, { timestamps: true });

// Compound indexes for performance and uniqueness
sessionGroundSchema.index({ ground: 1, groundSlot: 1, bookingDate: 1, startTime: 1, endTime: 1 }, { unique: true });
sessionGroundSchema.index({ session: 1 }, { unique: true });
sessionGroundSchema.index({ bookingDate: 1, status: 1 });
sessionGroundSchema.index({ ground: 1, bookingDate: 1 });
sessionGroundSchema.index({ paymentStatus: 1, status: 1 });

// Virtual to check if booking is active
sessionGroundSchema.virtual('isActive').get(function() {
  return ['booked', 'confirmed'].includes(this.status);
});

// Virtual to check if booking can be cancelled
sessionGroundSchema.virtual('canCancel').get(function() {
  const now = new Date();
  const bookingDateTime = new Date(this.bookingDate);
  const [hours, minutes] = this.startTime.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes, 0, 0);
  
  // Can cancel up to 2 hours before booking
  const cancellationDeadline = new Date(bookingDateTime.getTime() - (2 * 60 * 60 * 1000));
  return now < cancellationDeadline && this.isActive;
});

// Virtual to check if booking is upcoming
sessionGroundSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const bookingDateTime = new Date(this.bookingDate);
  const [hours, minutes] = this.startTime.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes, 0, 0);
  
  return bookingDateTime > now && this.isActive;
});

// Virtual to check if booking is past
sessionGroundSchema.virtual('isPast').get(function() {
  const now = new Date();
  const bookingDateTime = new Date(this.bookingDate);
  const [hours, minutes] = this.endTime.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes, 0, 0);
  
  return bookingDateTime < now;
});

// Static method to check slot availability
sessionGroundSchema.statics.isSlotAvailable = async function(groundId, slot, date, startTime, endTime, excludeBookingId = null) {
  const query = {
    ground: groundId,
    groundSlot: slot,
    bookingDate: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    },
    status: { $nin: ['cancelled'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await this.find(query);
  return conflictingBookings.length === 0;
};

// Static method to get ground availability for a date
sessionGroundSchema.statics.getGroundAvailability = async function(groundId, date, duration = 60) {
  const searchDate = new Date(date);
  
  // Get all bookings for the date
  const bookings = await this.find({
    ground: groundId,
    bookingDate: {
      $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      $lt: new Date(searchDate.setHours(23, 59, 59, 999))
    },
    status: { $nin: ['cancelled'] }
  }).select('groundSlot startTime endTime status');

  // Get ground details
  const Ground = mongoose.model('Ground');
  const ground = await Ground.findById(groundId);
  if (!ground) return null;

  const totalSlots = ground.totalSlots || 12;
  const availability = [];

  for (let slot = 1; slot <= totalSlots; slot++) {
    const slotBookings = bookings.filter(booking => booking.groundSlot === slot);
    
    // Generate time slots (8 AM to 8 PM, 1-hour slots)
    const timeSlots = [];
    for (let hour = 8; hour < 20; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if this time slot conflicts with any booking
      const isBooked = slotBookings.some(booking => {
        return (startTime < booking.endTime && endTime > booking.startTime);
      });

      timeSlots.push({
        startTime,
        endTime,
        available: !isBooked,
        duration: 60
      });
    }

    availability.push({
      slot,
      timeSlots
    });
  }

  return {
    ground: ground.name,
    date: date,
    totalSlots,
    availability
  };
};

// Static method to create recurring bookings
sessionGroundSchema.statics.createRecurringBookings = async function(bookingData, pattern) {
  const bookings = [];
  const startDate = new Date(bookingData.bookingDate);
  let currentDate = new Date(startDate);
  let occurrence = 0;

  while (occurrence < pattern.occurrences) {
    const booking = new this({
      ...bookingData,
      bookingDate: new Date(currentDate),
      isRecurring: true,
      recurringPattern: pattern
    });

    bookings.push(booking);
    occurrence++;

    // Calculate next occurrence
    switch (pattern.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'bi-weekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }

    // Check if we've reached the end date
    if (pattern.endDate && currentDate > new Date(pattern.endDate)) {
      break;
    }
  }

  return await this.insertMany(bookings);
};

// Static method to get available slots from Practice ground A for coaching programs
sessionGroundSchema.statics.getPracticeGroundASlots = async function(date, duration = 60) {
  const Ground = mongoose.model('Ground');
  
  // Find the Practice ground A
  const practiceGround = await Ground.findOne({ name: 'Practice ground A' });
  if (!practiceGround) {
    throw new Error('Practice ground A not found');
  }

  const searchDate = new Date(date);
  
  // Get all bookings for Practice ground A on the specified date
  const bookings = await this.find({
    ground: practiceGround._id,
    bookingDate: {
      $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      $lt: new Date(searchDate.setHours(23, 59, 59, 999))
    },
    status: { $nin: ['cancelled'] }
  }).select('groundSlot startTime endTime status bookingType');

  const totalSlots = practiceGround.totalSlots || 12;
  const availability = [];

  for (let slot = 1; slot <= totalSlots; slot++) {
    const slotBookings = bookings.filter(booking => booking.groundSlot === slot);
    
    // Generate time slots (8 AM to 8 PM, customizable duration)
    const timeSlots = [];
    for (let hour = 8; hour < 20; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + (duration / 60)).toString().padStart(2, '0')}:00`;
      
      // Check if this time slot conflicts with any booking
      const isBooked = slotBookings.some(booking => {
        return (startTime < booking.endTime && endTime > booking.startTime);
      });

      // Check if slot is suitable for coaching programs (avoid conflicting with other coaching sessions)
      const isCoachingConflict = slotBookings.some(booking => {
        return booking.bookingType === 'session' && 
               (startTime < booking.endTime && endTime > booking.startTime);
      });

      timeSlots.push({
        startTime,
        endTime,
        available: !isBooked && !isCoachingConflict,
        duration: duration,
        slotNumber: slot,
        isCoachingFriendly: !isCoachingConflict
      });
    }

    availability.push({
      slot,
      timeSlots,
      isAvailable: timeSlots.some(ts => ts.available)
    });
  }

  return {
    ground: {
      _id: practiceGround._id,
      name: practiceGround.name,
      location: practiceGround.location,
      pricePerSlot: practiceGround.pricePerSlot,
      facilities: practiceGround.facilities,
      totalSlots: practiceGround.totalSlots
    },
    date: date,
    totalSlots,
    availability,
    coachingProgramSlots: availability.filter(slot => slot.isAvailable)
  };
};

// Static method to book a slot on Practice ground A for coaching programs
sessionGroundSchema.statics.bookPracticeGroundASlot = async function(bookingData) {
  const Ground = mongoose.model('Ground');
  
  // Find the Practice ground A
  const practiceGround = await Ground.findOne({ name: 'Practice ground A' });
  if (!practiceGround) {
    throw new Error('Practice ground A not found');
  }

  // Check if slot is available
  const isAvailable = await this.isSlotAvailable(
    practiceGround._id,
    bookingData.groundSlot,
    bookingData.bookingDate,
    bookingData.startTime,
    bookingData.endTime
  );

  if (!isAvailable) {
    throw new Error('Slot is not available for the requested time');
  }

  // Create the booking with coaching program specific data
  const booking = new this({
    ...bookingData,
    ground: practiceGround._id,
    bookingType: 'training', // Set as training for coaching programs
    price: practiceGround.pricePerSlot,
    requiresApproval: true, // Coaching programs might need approval
    specialRequirements: ['coaching_equipment', 'coaching_area']
  });

  return await booking.save();
};

// Static method to get coaching program availability for a date range
sessionGroundSchema.statics.getCoachingProgramAvailability = async function(startDate, endDate, duration = 60) {
  const Ground = mongoose.model('Ground');
  
  // Find the Practice ground A
  const practiceGround = await Ground.findOne({ name: 'Practice ground A' });
  if (!practiceGround) {
    throw new Error('Practice ground A not found');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const availability = [];

  // Get all bookings for the date range
  const bookings = await this.find({
    ground: practiceGround._id,
    bookingDate: {
      $gte: start,
      $lte: end
    },
    status: { $nin: ['cancelled'] }
  }).select('bookingDate groundSlot startTime endTime status bookingType');

  // Group bookings by date
  const bookingsByDate = {};
  bookings.forEach(booking => {
    const dateKey = booking.bookingDate.toISOString().split('T')[0];
    if (!bookingsByDate[dateKey]) {
      bookingsByDate[dateKey] = [];
    }
    bookingsByDate[dateKey].push(booking);
  });

  // Generate availability for each date
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateKey = date.toISOString().split('T')[0];
    const dayBookings = bookingsByDate[dateKey] || [];
    
    const dayAvailability = await this.getPracticeGroundASlots(date, duration);
    availability.push(dayAvailability);
  }

  return {
    ground: {
      _id: practiceGround._id,
      name: practiceGround.name,
      location: practiceGround.location,
      pricePerSlot: practiceGround.pricePerSlot
    },
    dateRange: { startDate, endDate },
    availability
  };
};

// Pre-save middleware to set booking deadline
sessionGroundSchema.pre('save', function(next) {
  if (!this.bookingDeadline) {
    // Set booking deadline to 2 hours before booking start
    const bookingDateTime = new Date(this.bookingDate);
    const [hours, minutes] = this.startTime.split(':').map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    this.bookingDeadline = new Date(bookingDateTime.getTime() - (2 * 60 * 60 * 1000));
  }
  next();
});

// Method to cancel booking
sessionGroundSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

// Method to confirm booking
sessionGroundSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  return this.save();
};

// Method to complete booking
sessionGroundSchema.methods.complete = function(groundCondition, maintenanceNotes) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.groundCondition = groundCondition;
  this.maintenanceNotes = maintenanceNotes;
  return this.save();
};

export default mongoose.model('SessionGround', sessionGroundSchema);

