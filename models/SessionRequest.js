import mongoose from 'mongoose';

const sessionRequestSchema = new mongoose.Schema({
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgramEnrollment',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  requestedDate: {
    type: Date,
    required: true
  },
  requestedTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 60 // in minutes
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  coachResponse: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responseDate: {
      type: Date
    },
    responseNotes: {
      type: String,
      default: ''
    },
    suggestedDate: {
      type: Date
    },
    suggestedTime: {
      type: String
    }
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
sessionRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
sessionRequestSchema.index({ enrollment: 1, status: 1 });
sessionRequestSchema.index({ coach: 1, status: 1 });
sessionRequestSchema.index({ user: 1, status: 1 });

const SessionRequest = mongoose.model('SessionRequest', sessionRequestSchema);

export default SessionRequest;
