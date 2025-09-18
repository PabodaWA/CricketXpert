const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  CoachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 👈 Link to User table

  specialization: { type: String }, // e.g. "Batting", "Bowling"
  experienceYears: { type: Number },

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

  assignedSessions: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Coach', coachSchema);
