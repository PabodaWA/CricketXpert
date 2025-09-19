// models/feedback.model.js
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  requestType: {
    type: String,
    enum: ['Order', 'RepairRequest', 'CoachingProgram', 'Ground', 'Other'],
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Order', 'Repair', 'Coaching Program', 'Ground', 'Other'],
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  response: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Feedback', feedbackSchema);

