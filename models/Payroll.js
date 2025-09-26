import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeEmail: {
    type: String,
    required: true
  },
  employeeRole: {
    type: String,
    required: true,
    enum: ['coach', 'technician', 'admin', 'coaching_manager', 'order_manager', 'ground_manager', 'service_manager', 'delivery_staff']
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  netSalary: {
    type: Number,
    min: 0
  },
  isFixedSalary: {
    type: Boolean,
    default: true
  },
  salarySource: {
    type: String,
    enum: ['fixed', 'custom'],
    default: 'fixed'
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'check'],
    default: 'bank_transfer'
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ month: 1, year: 1 });
payrollSchema.index({ status: 1 });

// Pre-save middleware to calculate net salary
payrollSchema.pre('save', function(next) {
  this.netSalary = this.basicSalary + this.allowances - this.deductions;
  next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);
export default Payroll;
