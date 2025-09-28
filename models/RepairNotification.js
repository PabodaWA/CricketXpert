import mongoose from 'mongoose';

const repairNotificationSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  repairRequestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RepairRequest', 
    required: true 
  },
  type: {
    type: String,
    enum: ['repair_submitted', 'repair_approved', 'repair_rejected', 'repair_in_progress', 'repair_completed'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    equipmentType: String,
    damageType: String,
    status: String,
    repairProgress: Number
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
repairNotificationSchema.index({ customerId: 1, createdAt: -1 });
repairNotificationSchema.index({ customerId: 1, isRead: 1 });

export default mongoose.model('RepairNotification', repairNotificationSchema);
