import express from 'express';
const router = express.Router();

import {
  getRevenueAnalytics,
  getRevenueSummary,
  getProfitAnalysis,
  generateRevenueReport,
  getPayrollExpenses,
  getMonthlyProfit
} from '../controllers/analyticsController.js';

// Import middleware for authentication and authorization
import { protect, authorizeRoles } from '../utils/protect.js';

// All analytics routes require authentication and admin role
router.use(protect);
router.use(authorizeRoles('admin'));

// @route   GET /api/analytics/revenue
// @desc    Get comprehensive revenue analytics
// @access  Private (Admin only)
router.get('/revenue', getRevenueAnalytics);

// @route   GET /api/analytics/revenue/summary
// @desc    Get revenue summary for dashboard
// @access  Private (Admin only)
router.get('/revenue/summary', getRevenueSummary);

// @route   GET /api/analytics/profit
// @desc    Get profit analysis (Revenue - Expenses)
// @access  Private (Admin only)
router.get('/profit', getProfitAnalysis);

// @route   GET /api/analytics/revenue-report
// @desc    Generate and download revenue report as PDF
// @access  Private (Admin only)
router.get('/revenue-report', generateRevenueReport);

// @route   GET /api/analytics/payroll-expenses
// @desc    Get payroll expenses for profit calculation
// @access  Private (Admin only)
router.get('/payroll-expenses', getPayrollExpenses);

// @route   GET /api/analytics/monthly-profit
// @desc    Get monthly profit data for trend chart
// @access  Private (Admin only)
router.get('/monthly-profit', getMonthlyProfit);

export default router;

