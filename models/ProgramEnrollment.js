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
    
    // Check if eligible for certificate (75% completion + program completed)
    if (this.progress.progressPercentage >= 75 && this.status === 'completed') {
      this.certificateEligible = true;
    }
  }
  next();
});

// Method to check certificate eligibility with attendance
programenrollmentSchema.methods.checkCertificateEligibility = async function() {
  try {
    const Attendance = mongoose.model('Attendance');
    const Session = mongoose.model('Session');
    
    // Get all sessions for this program
    const sessions = await Session.find({ program: this.program });
    
    // Get attendance records for this user in this program
    const attendanceRecords = await Attendance.find({
      participant: this.user,
      session: { $in: sessions.map(s => s._id) },
      attended: true
    });
    
    // Calculate attendance percentage
    const totalSessions = this.program?.totalSessions || sessions.length;
    const attendedSessions = attendanceRecords.length;
    const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
    
    // Get progress percentage
    const progressPercentage = this.progress.progressPercentage || 0;
    
    // Check eligibility conditions (both attendance and progress >= 75%)
    const isEligible = attendancePercentage >= 75 && progressPercentage >= 75;
    
    return {
      isEligible,
      attendancePercentage: Math.round(attendancePercentage),
      progressPercentage: Math.round(progressPercentage),
      totalSessions,
      attendedSessions,
      requirements: {
        attendanceRequired: 75,
        progressRequired: 75,
        attendanceMet: attendancePercentage >= 75,
        progressMet: progressPercentage >= 75
      }
    };
  } catch (error) {
    throw new Error(`Error checking certificate eligibility: ${error.message}`);
  }
};

// Pagination plugin commented out - install mongoose-paginate-v2 to enable
// programenrollmentSchema.plugin(mongoosePaginate);

export default mongoose.model('ProgramEnrollment', programenrollmentSchema);
