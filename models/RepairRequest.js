import mongoose from 'mongoose';

const repairRequestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  equipmentType: { type: String, required: false },
  damageType: { type: String, required: true },
  description: { type: String, required: false, default: '' },
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

export default mongoose.model('RepairRequest', repairRequestSchema);