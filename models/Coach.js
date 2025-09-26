import mongoose from 'mongoose';

const coachSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 👈 Link to User table
  specializations: [{ type: String }], // e.g. ["Batting", "Bowling"]
  experience: { type: Number, default: 0 },
  profileImage: { type: String },
  isActive: { type: Boolean, default: true }, // 👈 ADDED MISSING FIELD
  
  // Professional Information
  hourlyRate: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  achievements: [{ type: String }],

  availability: [{
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }],

  progress: [{
    partName: String,
    completed: Boolean,
    completedAt: Date
  }],

  assignedSessions: { type: Number, default: 0 },
  assignedPrograms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CoachingProgram' }]
}, { timestamps: true });

export default mongoose.model('Coach', coachSchema);
