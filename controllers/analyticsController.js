import Payment from '../models/Payments.js';
import Order from '../models/Order.js';
import ProgramEnrollment from '../models/ProgramEnrollment.js';
import CoachingProgram from '../models/CoachingProgram.js';
import Product from '../models/Product.js';
import Session from '../models/Session.js';
import Ground from '../models/Ground.js';
import Payroll from '../models/Payroll.js';
import PDFDocument from 'pdfkit';

// @desc    Get comprehensive revenue analytics
// @route   GET /api/analytics/revenue
// @access  Private (Admin only)
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Set default date range if not provided (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;
    
    // Ensure end date includes the full day
    end.setHours(23, 59, 59, 999);
    
    console.log(`Fetching analytics from ${start.toISOString()} to ${end.toISOString()}`);

    // 1. Total Revenue from all successful payments
    const totalRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 }
        }
      }
    ]);

    // 2. E-commerce Revenue (order payments)
    const ecommerceRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentType: 'order_payment',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          ecommerceRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // 3. Coaching Revenue (enrollment payments)
    const coachingRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentType: 'enrollment_payment',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          coachingRevenue: { $sum: '$amount' },
          totalEnrollments: { $sum: 1 }
        }
      }
    ]);

    // 4. Ground Revenue (booking payments)
    const groundRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentType: 'booking_payment',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          groundRevenue: { $sum: '$amount' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    // 5. Top Products by Revenue
    const topProductsResult = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'Delivered'] },
          date: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product._id',
          name: { $first: '$product.name' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtOrder'] } },
          orders: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // 6. Top Programs by Revenue
    const topProgramsResult = await ProgramEnrollment.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          enrollmentDate: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'coachingprograms',
          localField: 'program',
          foreignField: '_id',
          as: 'program'
        }
      },
      { $unwind: '$program' },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      { $unwind: '$payment' },
      {
        $group: {
          _id: '$program._id',
          name: { $first: '$program.title' },
          revenue: { $sum: '$payment.amount' },
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // 7. Monthly Revenue Trend (last 6 months)
    const monthlyRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentDate: { 
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    // 8. Revenue by Source breakdown
    const revenueBySourceResult = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$paymentType',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 9. Calculate Average Order Value
    const avgOrderValueResult = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'Delivered'] },
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$amount' }
        }
      }
    ]);

    // 10. Calculate Revenue Growth (compare with previous period)
    const previousPeriodStart = new Date(start);
    const previousPeriodEnd = new Date(end);
    const periodLength = end.getTime() - start.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() - periodLength);

    const currentPeriodRevenue = totalRevenueResult[0]?.totalRevenue || 0;
    const previousPeriodRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentDate: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    const previousPeriodRevenue = previousPeriodRevenueResult[0]?.totalRevenue || 0;
    const revenueGrowth = previousPeriodRevenue > 0 
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    // Format monthly revenue data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = monthlyRevenueResult.map(item => ({
      month: monthNames[item._id.month - 1],
      revenue: item.revenue
    }));

    // Format revenue by source data
    const revenueBySource = revenueBySourceResult.map(item => {
      const sourceNames = {
        'order_payment': 'E-commerce',
        'enrollment_payment': 'Coaching',
        'booking_payment': 'Ground Bookings'
      };
      
      const totalRevenue = totalRevenueResult[0]?.totalRevenue || 1;
      const percentage = (item.revenue / totalRevenue) * 100;
      
      return {
        source: sourceNames[item._id] || item._id,
        revenue: item.revenue,
        percentage: Math.round(percentage)
      };
    });

    // Compile final analytics data
    const analyticsData = {
      totalRevenue: currentPeriodRevenue,
      ecommerceRevenue: ecommerceRevenueResult[0]?.ecommerceRevenue || 0,
      coachingRevenue: coachingRevenueResult[0]?.coachingRevenue || 0,
      groundRevenue: groundRevenueResult[0]?.groundRevenue || 0,
      totalOrders: ecommerceRevenueResult[0]?.totalOrders || 0,
      totalEnrollments: coachingRevenueResult[0]?.totalEnrollments || 0,
      totalBookings: groundRevenueResult[0]?.totalBookings || 0,
      averageOrderValue: avgOrderValueResult[0]?.avgOrderValue || 0,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10, // Round to 1 decimal place
      topProducts: topProductsResult,
      topPrograms: topProgramsResult,
      monthlyRevenue: monthlyRevenue,
      revenueBySource: revenueBySource
    };

    res.status(200).json({
      success: true,
      data: analyticsData,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue analytics',
      error: error.message
    });
  }
};

// @desc    Get revenue summary for dashboard
// @route   GET /api/analytics/revenue/summary
// @access  Private (Admin only)
export const getRevenueSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Today's revenue
    const todayRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentDate: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lte: new Date(today.setHours(23, 59, 59, 999))
          }
        }
      },
      { $group: { _id: null, revenue: { $sum: '$amount' } } }
    ]);

    // This month's revenue
    const monthRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentDate: { $gte: startOfMonth, $lte: today }
        }
      },
      { $group: { _id: null, revenue: { $sum: '$amount' } } }
    ]);

    // This year's revenue
    const yearRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentDate: { $gte: startOfYear, $lte: today }
        }
      },
      { $group: { _id: null, revenue: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: todayRevenue[0]?.revenue || 0,
        thisMonth: monthRevenue[0]?.revenue || 0,
        thisYear: yearRevenue[0]?.revenue || 0
      }
    });

  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue summary',
      error: error.message
    });
  }
};

// @desc    Get profit analysis (Revenue - Expenses)
// @route   GET /api/analytics/profit
// @access  Private (Admin only)
export const getProfitAnalysis = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get total revenue
    const revenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);

    // Get total payroll expenses
    const payrollResult = await Payroll.aggregate([
      {
        $match: {
          status: 'paid',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: null, totalPayroll: { $sum: '$netSalary' } } }
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalPayroll = payrollResult[0]?.totalPayroll || 0;
    const grossProfit = totalRevenue - totalPayroll;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses: totalPayroll,
        grossProfit,
        profitMargin: Math.round(profitMargin * 10) / 10,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Error fetching profit analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profit analysis',
      error: error.message
    });
  }
};

// @desc    Get payroll expenses for profit calculation
// @route   GET /api/analytics/payroll-expenses
// @access  Private (Admin only)
export const getPayrollExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Set date range
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    // Get total payroll expenses for the period
    const payrollResult = await Payroll.aggregate([
      {
        $match: {
          status: 'paid',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalPayrollExpenses: { $sum: '$netSalary' },
          totalEmployees: { $sum: 1 }
        }
      }
    ]);

    const payrollExpenses = payrollResult[0]?.totalPayrollExpenses || 0;
    const totalEmployees = payrollResult[0]?.totalEmployees || 0;

    res.status(200).json({
      success: true,
      data: {
        payrollExpenses,
        totalEmployees,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payroll expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll expenses',
      error: error.message
    });
  }
};

// @desc    Get monthly profit data for trend chart
// @route   GET /api/analytics/monthly-profit
// @access  Private (Admin only)
export const getMonthlyProfit = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Set date range (last 6 months)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();
    start.setMonth(start.getMonth() - 6);
    
    // Get monthly revenue data
    const monthlyRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          totalRevenue: { $sum: '$amount' },
          ecommerceRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentType', 'order_payment'] }, '$amount', 0]
            }
          },
          coachingRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentType', 'enrollment_payment'] }, '$amount', 0]
            }
          },
          groundRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentType', 'booking_payment'] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get monthly payroll data
    const monthlyPayrollResult = await Payroll.aggregate([
      {
        $match: {
          status: 'paid',
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          totalPayroll: { $sum: '$netSalary' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get repair revenue for each month - we'll calculate this differently
    // Since we don't have direct access to repair requests here, we'll use a simplified approach
    const repairRevenueByMonth = {}; // This would need to be populated from repair data
    
    // Calculate monthly profit
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyProfit = monthlyRevenueResult.map(revenueItem => {
      const monthKey = `${revenueItem._id.year}-${revenueItem._id.month}`;
      
      // Find corresponding payroll for this month
      const payrollItem = monthlyPayrollResult.find(p => 
        `${p._id.year}-${p._id.month}` === monthKey
      );
      
      // For now, we'll set repair revenue to 0 for each month
      // This should be replaced with actual repair data calculation
      const repairRevenue = repairRevenueByMonth[monthKey] || 0;
      
      // Calculate profit: 10% e-commerce + 100% others - payroll
      const ecommerceProfit = revenueItem.ecommerceRevenue * 0.1;
      const otherProfit = revenueItem.coachingRevenue + revenueItem.groundRevenue + repairRevenue;
      const grossProfit = ecommerceProfit + otherProfit;
      const payrollExpenses = payrollItem?.totalPayroll || 0;
      const netProfit = grossProfit - payrollExpenses;
      
      return {
        month: monthNames[revenueItem._id.month - 1],
        profit: Math.round(netProfit * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      data: monthlyProfit,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error fetching monthly profit:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly profit',
      error: error.message
    });
  }
};

// @desc    Generate and download revenue report as PDF
// @route   GET /api/analytics/revenue-report
// @access  Private (Admin only)
export const generateRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, reportType } = req.query;
    
    // Set date range
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    // Get analytics data (reuse existing logic)
    const analyticsData = await getAnalyticsDataForReport(start, end);
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="revenue-profit-report-${startDate}-to-${endDate}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add content to PDF
    await addPDFContent(doc, analyticsData, start, end, reportType);
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating revenue report',
      error: error.message
    });
  }
};

// Helper function to get analytics data for report
const getAnalyticsDataForReport = async (start, end) => {
  // Reuse the same aggregation logic from getRevenueAnalytics
  const totalRevenueResult = await Payment.aggregate([
    {
      $match: {
        status: 'success',
        paymentDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalPayments: { $sum: 1 }
      }
    }
  ]);

  const ecommerceRevenueResult = await Payment.aggregate([
    {
      $match: {
        status: 'success',
        paymentType: 'order_payment',
        paymentDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        ecommerceRevenue: { $sum: '$amount' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  const coachingRevenueResult = await Payment.aggregate([
    {
      $match: {
        status: 'success',
        paymentType: 'enrollment_payment',
        paymentDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        coachingRevenue: { $sum: '$amount' },
        totalEnrollments: { $sum: 1 }
      }
    }
  ]);

  const groundRevenueResult = await Payment.aggregate([
    {
      $match: {
        status: 'success',
        paymentType: 'booking_payment',
        paymentDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        groundRevenue: { $sum: '$amount' },
        totalBookings: { $sum: 1 }
      }
    }
  ]);

  const topProductsResult = await Order.aggregate([
    {
      $match: {
        status: { $in: ['completed', 'Delivered'] },
        date: { $gte: start, $lte: end }
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product._id',
        name: { $first: '$product.name' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtOrder'] } },
        orders: { $sum: '$items.quantity' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);

  const topProgramsResult = await ProgramEnrollment.aggregate([
    {
      $match: {
        paymentStatus: 'completed',
        enrollmentDate: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: 'coachingprograms',
        localField: 'program',
        foreignField: '_id',
        as: 'program'
      }
    },
    { $unwind: '$program' },
    {
      $lookup: {
        from: 'payments',
        localField: 'paymentId',
        foreignField: '_id',
        as: 'payment'
      }
    },
    { $unwind: '$payment' },
    {
      $group: {
        _id: '$program._id',
        name: { $first: '$program.title' },
        revenue: { $sum: '$payment.amount' },
        enrollments: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);

  return {
    totalRevenue: totalRevenueResult[0]?.totalRevenue || 0,
    ecommerceRevenue: ecommerceRevenueResult[0]?.ecommerceRevenue || 0,
    coachingRevenue: coachingRevenueResult[0]?.coachingRevenue || 0,
    groundRevenue: groundRevenueResult[0]?.groundRevenue || 0,
    totalOrders: ecommerceRevenueResult[0]?.totalOrders || 0,
    totalEnrollments: coachingRevenueResult[0]?.totalEnrollments || 0,
    totalBookings: groundRevenueResult[0]?.totalBookings || 0,
    topProducts: topProductsResult,
    topPrograms: topProgramsResult
  };
};

// Helper function to add content to PDF
const addPDFContent = async (doc, data, start, end, reportType) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate profit data
  const ecommerceProfit = data.ecommerceRevenue * 0.1; // 10% profit from e-commerce
  const coachingProfit = data.coachingRevenue; // 100% profit from coaching
  const groundProfit = data.groundRevenue; // 100% profit from ground
  const repairProfit = data.repairRevenue || 0; // 100% profit from repair
  const grossProfit = ecommerceProfit + coachingProfit + groundProfit + repairProfit;

  // Get payroll expenses
  const payrollResult = await Payroll.aggregate([
    {
      $match: {
        status: 'paid',
        paymentDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalPayrollExpenses: { $sum: '$netSalary' }
      }
    }
  ]);

  const payrollExpenses = payrollResult[0]?.totalPayrollExpenses || 0;
  const totalExpenses = payrollExpenses; // Only payroll expenses
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = data.totalRevenue > 0 ? (netProfit / data.totalRevenue) * 100 : 0;

  // Header
  doc.fontSize(20).text('Revenue & Profit Analytics Report', { align: 'center' });
  doc.fontSize(12).text(`Report Period: ${formatDate(start)} - ${formatDate(end)}`, { align: 'center' });
  doc.moveDown(2);

  // Revenue Summary Section
  doc.fontSize(16).text('Revenue Summary', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(12);
  doc.text(`Total Revenue: ${formatCurrency(data.totalRevenue)}`);
  doc.text(`E-commerce Revenue: ${formatCurrency(data.ecommerceRevenue)} (${data.totalOrders} orders)`);
  doc.text(`Coaching Revenue: ${formatCurrency(data.coachingRevenue)} (${data.totalEnrollments} enrollments)`);
  doc.text(`Ground Revenue: ${formatCurrency(data.groundRevenue)} (${data.totalBookings} bookings)`);
  if (data.repairRevenue) {
    doc.text(`Repair Revenue: ${formatCurrency(data.repairRevenue)}`);
  }
  doc.moveDown(1);

  // Profit Analysis Section
  doc.fontSize(16).text('Profit Analysis', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(12);
  doc.text('Profit by Source:');
  doc.text(`  E-commerce Profit (10%): ${formatCurrency(ecommerceProfit)}`);
  doc.text(`  Coaching Profit (100%): ${formatCurrency(coachingProfit)}`);
  doc.text(`  Ground Profit (100%): ${formatCurrency(groundProfit)}`);
  if (data.repairRevenue) {
    doc.text(`  Repair Profit (100%): ${formatCurrency(repairProfit)}`);
  }
  doc.moveDown(0.5);
  
  doc.text(`Gross Profit: ${formatCurrency(grossProfit)}`);
  doc.text(`Payroll Expenses: ${formatCurrency(payrollExpenses)}`);
  doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`);
  doc.moveDown(0.5);
  
  doc.fontSize(14).text(`Net Profit: ${formatCurrency(netProfit)}`, { underline: true });
  doc.text(`Profit Margin: ${profitMargin.toFixed(2)}%`);
  doc.moveDown(1);

  // Top Products Section
  if (data.topProducts && data.topProducts.length > 0) {
    doc.fontSize(16).text('Top Products by Revenue', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12);
    data.topProducts.forEach((product, index) => {
      doc.text(`${index + 1}. ${product.name}`);
      doc.text(`   Revenue: ${formatCurrency(product.revenue)} | Orders: ${product.orders}`);
      doc.moveDown(0.3);
    });
    doc.moveDown(1);
  }

  // Top Programs Section
  if (data.topPrograms && data.topPrograms.length > 0) {
    doc.fontSize(16).text('Top Programs by Revenue', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12);
    data.topPrograms.forEach((program, index) => {
      doc.text(`${index + 1}. ${program.name}`);
      doc.text(`   Revenue: ${formatCurrency(program.revenue)} | Enrollments: ${program.enrollments}`);
      doc.moveDown(0.3);
    });
    doc.moveDown(1);
  }

  // Footer
  doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
};

