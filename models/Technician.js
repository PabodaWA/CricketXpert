import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema({
  // Reference to the user table
  technicianId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // This links to the User collection
    required: true 
  },
  skills: [{ 
    type: String, 
    required: true 
  }],
  available: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

export default mongoose.model('Technician', technicianSchema);