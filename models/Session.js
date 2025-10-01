import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoachingProgram',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProgramEnrollment',
      required: true
    },
    attended: {
      type: Boolean,
      default: false
    },
    attendanceMarkedAt: Date,
    performance: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      notes: String
    }
  }],
  title: {
    type: String,
    required: true
  },
  description: String,
  sessionNumber: {
    type: Number,
    required: true,
    min: 1
  },
  week: {
    type: Number,
    required: true,
    min: 1
  },
  scheduledDate: {
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
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  rescheduled: {
    type: Boolean,
    default: false
  },
  rescheduledAt: Date,
  rescheduledFrom: {
    date: Date,
    time: String,
    groundSlot: Number
  },
  objectives: [String],
  materials: [{
    title: String,
    type: {
      type: String,
      enum: ['video', 'document', 'image', 'link']
    },
    url: String,
    description: String
  }],
  actualStartTime: Date,
  actualEndTime: Date,
  weatherConditions: String,
  equipment: [String],
  notes: String,
  sessionSummary: {
    activitiesCovered: [String],
    keyLearnings: [String],
    homework: [String],
    nextSessionPrep: String
  },
  maxParticipants: {
    type: Number,
    default: 10,
    min: 1,
    max: 20
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly']
    },
    daysOfWeek: [String],
    endDate: Date
  },
  bookingDeadline: {
    type: Date,
    required: true
  },
  attendance: {
    type: String,
    enum: ['not marked', 'present', 'absent'],
    default: 'not marked'
  }
}, { timestamps: true });

// Compound indexes for performance and uniqueness
sessionSchema.index({ ground: 1, groundSlot: 1, scheduledDate: 1, startTime: 1, endTime: 1 }, { unique: true });
sessionSchema.index({ program: 1, sessionNumber: 1 });
sessionSchema.index({ coach: 1, scheduledDate: 1 });
sessionSchema.index({ scheduledDate: 1, status: 1 });

// Virtual to check if session is full
sessionSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.maxParticipants;
});

// Virtual to get available spots
sessionSchema.virtual('availableSpots').get(function() {
  return this.maxParticipants - this.participants.length;
});

// Virtual to check if session can be booked
sessionSchema.virtual('canBook').get(function() {
  const now = new Date();
  return now < this.bookingDeadline && !this.isFull && this.status === 'scheduled';
});

// Method to check if session is in the past
sessionSchema.methods.isPastSession = function() {
  const sessionDate = new Date(this.scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return sessionDate < today;
};

// Method to check if session is upcoming
sessionSchema.methods.isUpcomingSession = function() {
  const sessionDate = new Date(this.scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return sessionDate >= today;
};

// Method to check if attendance has been marked for a specific participant
sessionSchema.methods.hasAttendanceMarked = function(userId) {
  const participant = this.participants.find(p => p.user && p.user.toString() === userId.toString());
  if (!participant) return false;
  
  // For upcoming sessions, attendance should not be considered marked
  if (this.isUpcomingSession()) {
    return false;
  }
  
  // For past sessions, check if attendance has been marked (either through attendanceMarkedAt or attended field)
  return participant.attendanceMarkedAt || participant.attended !== undefined;
};

// Method to get attendance status for a specific participant
sessionSchema.methods.getAttendanceStatus = function(userId) {
  const participant = this.participants.find(p => p.user && p.user.toString() === userId.toString());
  if (!participant) return 'not_found';
  
  // If session is upcoming, always return 'not_marked'
  if (this.isUpcomingSession()) {
    return 'not_marked';
  }
  
  // If session is past but no attendance marked
  if (this.isPastSession() && !this.hasAttendanceMarked(userId)) {
    return 'not_marked';
  }
  
  // If session is past and attendance is marked
  if (this.isPastSession() && this.hasAttendanceMarked(userId)) {
    return participant.attended ? 'present' : 'absent';
  }
  
  return 'not_marked';
};

// Method to check ground slot availability
sessionSchema.statics.isSlotAvailable = async function(groundId, slot, date, startTime, endTime, excludeSessionId = null) {
  const query = {
    ground: groundId,
    groundSlot: slot,
    scheduledDate: {
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

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const conflictingSessions = await this.find(query);
  return conflictingSessions.length === 0;
};

// Pre-save middleware to set booking deadline
sessionSchema.pre('save', function(next) {
  if (!this.bookingDeadline) {
    // Set booking deadline to 2 hours before session start
    const sessionDateTime = new Date(this.scheduledDate);
    const [hours, minutes] = this.startTime.split(':').map(Number);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    this.bookingDeadline = new Date(sessionDateTime.getTime() - (2 * 60 * 60 * 1000)); // 2 hours before
  }
  next();
});

// Pagination plugin commented out - install mongoose-paginate-v2 to enable
// sessionSchema.plugin(mongoosePaginate);

export default mongoose.model('Session', sessionSchema);
