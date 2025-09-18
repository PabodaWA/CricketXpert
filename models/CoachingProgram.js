const mongoose = require('mongoose');

const coachingProgramSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fee: { type: Number },
  duration: { type: Number },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certificateTemplate: { type: String },
  materials: [
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'video', 'document'
    url: { type: String, required: true }
  }
]

}, { timestamps: true });

module.exports = mongoose.model('CoachingProgram', coachingProgramSchema);
