import mongoose from 'mongoose';

const coachingProgramSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fee: { type: Number },
  duration: { type: Number },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  certificateTemplate: { type: String },
  materials: [
    {
      name: { type: String, required: true },
      type: { type: String, required: true }, // e.g., 'video', 'document'
      url: { type: String, required: true }
    }
  ],
  category: { type: String },
  specialization: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  totalSessions: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  maxParticipants: { type: Number, default: 20 },
  currentEnrollments: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('CoachingProgram', coachingProgramSchema);
