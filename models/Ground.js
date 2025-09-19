import mongoose from 'mongoose';

const groundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  pricePerSlot: { type: Number, required: true },
  description: { type: String },
  totalSlots: { 
    type: Number, 
    min: 1, 
    max: 12, 
    required: true,
    default: 12
  }, // number of slots available for the ground
  facilities: [String], // e.g., ['parking', 'changing_room', 'equipment']
  equipment: [String], // e.g., ['nets', 'balls', 'bats']
  isActive: { type: Boolean, default: true }
}, { timestamps: true }); // adds createdAt & updatedAt automatically

export default mongoose.model('Ground', groundSchema);
