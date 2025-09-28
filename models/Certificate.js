import mongoose from 'mongoose';
import crypto from 'crypto';

const certificateSchema = new mongoose.Schema({
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
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoachingProgram',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: false // Temporarily make optional for debugging
  },
  certificateNumber: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  issueDate: {
    type: Date,
    default: Date.now
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: Date, // For certificates with expiration
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  completionDetails: {
    startDate: Date,
    endDate: Date,
    totalSessions: Number,
    attendedSessions: Number,
    attendancePercentage: Number,
    finalGrade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'Pass', 'Distinction']
    },
    skillAssessments: [{
      skill: String,
      initialRating: Number,
      finalRating: Number,
      improvement: Number
    }]
  },
  achievements: [{
    title: String,
    description: String,
    badge: String // URL to badge image
  }],
  digitalSignature: {
    coachSignature: String, // Base64 encoded or URL
    organizationSignature: String,
    verificationHash: String // For digital verification
  },
  template: {
    templateId: String,
    backgroundColor: String,
    textColor: String,
    logoUrl: String,
    layout: {
      type: String,
      enum: ['standard', 'modern', 'classic', 'minimal'],
      default: 'standard'
    }
  },
  metadata: {
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    generationDate: {
      type: Date,
      default: Date.now
    },
    lastModified: Date,
    version: {
      type: Number,
      default: 1
    }
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  fileUrl: String, // URL to the generated PDF certificate
  verificationUrl: String, // Public URL for certificate verification
  isPubliclyVerifiable: {
    type: Boolean,
    default: true
  },
  tags: [String],
  notes: String
}, { timestamps: true });

// Indexes for performance and uniqueness
certificateSchema.index({ certificateNumber: 1 }, { unique: true });
certificateSchema.index({ user: 1, program: 1 }, { unique: true });
certificateSchema.index({ status: 1, issueDate: -1 });
certificateSchema.index({ verificationHash: 1 });

// Virtual for full certificate title
certificateSchema.virtual('fullTitle').get(function() {
  return `Certificate of Completion - ${this.title}`;
});

// Virtual for verification code (short version of certificate number)
certificateSchema.virtual('verificationCode').get(function() {
  return this.certificateNumber.slice(-8).toUpperCase();
});

// Virtual to check if certificate is valid
certificateSchema.virtual('isValid').get(function() {
  if (this.status !== 'active') return false;
  if (this.validUntil && new Date() > this.validUntil) return false;
  return true;
});

// Pre-save middleware to generate certificate number
certificateSchema.pre('save', function(next) {
  if (!this.certificateNumber) {
    // Generate certificate number: CERT-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    this.certificateNumber = `CERT-${year}-${random}`;
  }
  
  // Initialize digitalSignature if not exists
  if (!this.digitalSignature) {
    this.digitalSignature = {};
  }
  
  // Generate verification hash
  if (!this.digitalSignature.verificationHash) {
    const dataToHash = `${this.certificateNumber}-${this.user}-${this.program}-${this.issueDate}`;
    this.digitalSignature.verificationHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
  }
  
  // Set verification URL
  if (!this.verificationUrl && this.isPubliclyVerifiable) {
    this.verificationUrl = `/api/certificates/verify/${this.certificateNumber}`;
  }
  
  next();
});

// Static method to verify certificate
certificateSchema.statics.verifyCertificate = async function(certificateNumber) {
  const certificate = await this.findOne({ 
    certificateNumber: certificateNumber,
    status: 'active'
  }).populate('user program coach');
  
  if (!certificate) {
    return { valid: false, message: 'Certificate not found or invalid' };
  }
  
  if (!certificate.isValid) {
    return { valid: false, message: 'Certificate has expired or been revoked' };
  }
  
  return {
    valid: true,
    certificate: {
      number: certificate.certificateNumber,
      title: certificate.title,
      recipient: `${certificate.user.firstName} ${certificate.user.lastName}`,
      program: certificate.program.title,
      coach: certificate.coach.userId.firstName + ' ' + certificate.coach.userId.lastName,
      issueDate: certificate.issueDate,
      verificationCode: certificate.verificationCode
    }
  };
};

// Method to increment download count
certificateSchema.methods.incrementDownload = async function() {
  this.downloadCount += 1;
  await this.save();
  return this;
};

export default mongoose.model('Certificate', certificateSchema);
