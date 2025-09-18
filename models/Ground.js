const mongoose = require('mongoose');

const groundSchema = new mongoose.Schema({
  pricePerSlot: { type: Number, required: true },
  description: { type: String },
  groundSlot: { 
    type: Number, 
    min: 1, 
    max: 12, 
    required: true 
  }, // number of slots available for the ground
  maxSlotPerDay: { type: Number, required: true }
}, { timestamps: true }); // adds createdAt & updatedAt automatically

module.exports = mongoose.model('Ground', groundSchema);
