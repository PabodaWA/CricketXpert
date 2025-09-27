import mongoose from 'mongoose';

const programenrollmentSchema = new mongoose.Schema({
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
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'suspended'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  progress: {
    completedSessions: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      required: true
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedMaterials: [{
      materialId: String,
      completedAt: Date
    }],
    skillAssessments: [{
      skill: String,
      initialRating: {
        type: Number,
        min: 1,
        max: 10
      },
      currentRating: {
        type: Number,
        min: 1,
        max: 10
      },
      lastUpdated: Date
    }]
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  feedback: [{
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  coachFeedback: [{
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },
    performanceRating: {
      type: Number,
      min: 1,
      max: 5
    },
    strengths: [String],
    areasForImprovement: [String],
    comments: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  certificateEligible: {
    type: Boolean,
    default: false
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  // Enrollment form data
  enrollmentFormData: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    emergencyContact: {
      type: String,
      required: true
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    },
    goals: {
      type: String,
      required: true
    }
  },
  notes: String
}, { timestamps: true });

// Compound index for user and program (unique enrollment)
programenrollmentSchema.index({ user: 1, program: 1 }, { unique: true });

// Other indexes for performance
programenrollmentSchema.index({ status: 1 });
programenrollmentSchema.index({ enrollmentDate: -1 });

// Virtual to calculate completion percentage
programenrollmentSchema.virtual('completionPercentage').get(function() {
  if (this.progress.totalSessions === 0) return 0;
  return Math.round((this.progress.completedSessions / this.progress.totalSessions) * 100);
});

// Pre-save middleware to update progress percentage
programenrollmentSchema.pre('save', function(next) {
  if (this.isModified('progress.completedSessions') || this.isModified('progress.totalSessions')) {
    this.progress.progressPercentage = this.completionPercentage;
    
    // Check if eligible for certificate (80% completion + program completed)
    if (this.progress.progressPercentage >= 80 && this.status === 'completed') {
      this.certificateEligible = true;
    }
  }
  next();
});

// Pagination plugin commented out - install mongoose-paginate-v2 to enable
// programenrollmentSchema.plugin(mongoosePaginate);

export default mongoose.model('ProgramEnrollment', programenrollmentSchema);
