const mongoose = require('mongoose');

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

module.exports = mongoose.model('Technician', technicianSchema);