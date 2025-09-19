import mongoose from 'mongoose';

const playerFeedbackSchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoachingProgram',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  categories: [{
    type: String,
    enum: ['technique', 'attitude', 'punctuality', 'teamwork', 'improvement', 'other']
  }],
  isVisibleToPlayer: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'archived'],
    default: 'submitted'
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
playerFeedbackSchema.index({ coach: 1, player: 1 });
playerFeedbackSchema.index({ session: 1 });
playerFeedbackSchema.index({ program: 1 });
playerFeedbackSchema.index({ createdAt: -1 });

// Virtual to get coach's name
playerFeedbackSchema.virtual('coachName', {
  ref: 'Coach',
  localField: 'coach',
  foreignField: '_id',
  justOne: true,
  options: { populate: { path: 'userId', select: 'firstName lastName' } }
});

// Virtual to get player's name
playerFeedbackSchema.virtual('playerName', {
  ref: 'User',
  localField: 'player',
  foreignField: '_id',
  justOne: true,
  select: 'firstName lastName'
});

export default mongoose.model('PlayerFeedback', playerFeedbackSchema);
