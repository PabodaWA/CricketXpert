const mongoose = require('mongoose');

const repairRequestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  damageType: { type: String, required: true },
  status: {
    type: String,
    enum: [
      'Pending', 'Approved', 'Rejected', 'Estimate Sent',
      'Customer Approved', 'Customer Rejected', 'In Repair',
      'Halfway Completed', 'Ready for Pickup', 'Completed', 'Cancelled'
    ],
    default: 'Pending'
  },
  rejectionReason: { type: String },
  costEstimate: { type: Number },
  timeEstimate: { type: String },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  repairProgress: { type: Number, min: 0, max: 100, default: 0 },
  currentStage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('RepairRequest', repairRequestSchema);