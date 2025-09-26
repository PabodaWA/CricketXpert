import express from 'express';
const router = express.Router();
import {
  createPayroll,
  getAllPayrolls,
  getPayrollById,
  updatePayroll,
  deletePayroll,
  getPayrollSummary,
  markAsPaid,
  getEmployeesForPayroll,
  getSalaryConfig,
  updateSalaryConfig,
  generateAllPayrolls
} from '../controllers/payrollController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

// All routes require authentication
router.use(protect);

// Get employees for payroll dropdown
router.get('/employees', authorizeRoles('admin'), getEmployeesForPayroll);

// Get salary configuration
router.get('/salary-config', authorizeRoles('admin'), getSalaryConfig);

// Update salary configuration
router.put('/salary-config', authorizeRoles('admin'), updateSalaryConfig);

// Get payroll summary
router.get('/summary', authorizeRoles('admin'), getPayrollSummary);

// Get all payroll entries
router.get('/', authorizeRoles('admin'), getAllPayrolls);

// Get payroll by ID
router.get('/:id', authorizeRoles('admin'), getPayrollById);

// Create new payroll entry
router.post('/', authorizeRoles('admin'), createPayroll);

// Generate all payrolls for a month
router.post('/generate-all', authorizeRoles('admin'), generateAllPayrolls);

// Update payroll
router.put('/:id', authorizeRoles('admin'), updatePayroll);

// Mark payroll as paid
router.patch('/:id/paid', authorizeRoles('admin'), markAsPaid);

// Delete payroll
router.delete('/:id', authorizeRoles('admin'), deletePayroll);

export default router;
