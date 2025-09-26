import mongoose from 'mongoose';

const salaryConfigSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    unique: true,
    enum: ['coach', 'technician', 'coaching_manager', 'order_manager', 'ground_manager', 'service_manager']
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    type: Number,
    required: true,
    min: 0
  },
  deductions: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
salaryConfigSchema.index({ role: 1 });

const SalaryConfig = mongoose.model('SalaryConfig', salaryConfigSchema);
export default SalaryConfig;
