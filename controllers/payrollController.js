import Payroll from '../models/Payroll.js';
import User from '../models/User.js';
import SalaryConfig from '../models/SalaryConfig.js';

// Create new payroll entry
const createPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      basicSalary,
      allowances,
      deductions = 0,
      month,
      year,
      paymentMethod = 'bank_transfer',
      notes = ''
    } = req.body;

    // Validate required fields
    if (!employeeId || !basicSalary || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, basic salary, month, and year are required'
      });
    }

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employee is admin (owner) - they don't get salary
    if (employee.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin (owner) does not receive salary'
      });
    }

    // Check if payroll already exists for this employee, month, and year
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already exists for this employee for the specified month and year'
      });
    }

    // Create payroll entry
    const payroll = new Payroll({
      employeeId,
      employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.username,
      employeeEmail: employee.email,
      employeeRole: employee.role,
      basicSalary: parseInt(basicSalary),
      allowances: parseInt(allowances) || 0,
      deductions: parseInt(deductions) || 0,
      month: parseInt(month),
      year: parseInt(year),
      paymentMethod,
      notes,
      isFixedSalary: true,
      salarySource: 'fixed',
      createdBy: req.user.id
    });

    await payroll.save();

    res.status(201).json({
      success: true,
      message: 'Payroll created successfully',
      data: payroll
    });
  } catch (error) {
    console.error('Error creating payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all payroll entries
const getAllPayrolls = async (req, res) => {
  try {
    const { month, year, status, employeeId, role, search, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    if (role) filter.employeeRole = role;

    // Add search functionality
    if (search) {
      filter.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { employeeEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payrolls = await Payroll.find(filter)
      .populate('employeeId', 'firstName lastName username email role')
      .populate('createdBy', 'firstName lastName username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payroll.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: payrolls,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get payroll by ID
const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
      .populate('employeeId', 'firstName lastName username email role')
      .populate('createdBy', 'firstName lastName username email');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update payroll
const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.employeeId;
    delete updateData.employeeName;
    delete updateData.employeeEmail;
    delete updateData.employeeRole;
    delete updateData.createdBy;

    const payroll = await Payroll.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employeeId', 'firstName lastName username email role')
     .populate('createdBy', 'firstName lastName username email');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payroll updated successfully',
      data: payroll
    });
  } catch (error) {
    console.error('Error updating payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete payroll
const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findByIdAndDelete(id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payroll deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get payroll summary for a specific month/year
const getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const payrolls = await Payroll.find({ month: parseInt(month), year: parseInt(year) });

    const summary = {
      totalEmployees: payrolls.length,
      totalBasicSalary: payrolls.reduce((sum, p) => sum + p.basicSalary, 0),
      totalAllowances: payrolls.reduce((sum, p) => sum + p.allowances, 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + p.deductions, 0),
      totalNetSalary: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
      statusBreakdown: {
        pending: payrolls.filter(p => p.status === 'pending').length,
        approved: payrolls.filter(p => p.status === 'approved').length,
        paid: payrolls.filter(p => p.status === 'paid').length
      }
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching payroll summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Mark payroll as paid
const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentDate } = req.body;

    const payroll = await Payroll.findByIdAndUpdate(
      id,
      {
        status: 'paid',
        paymentDate: paymentDate || new Date()
      },
      { new: true, runValidators: true }
    ).populate('employeeId', 'firstName lastName username email role')
     .populate('createdBy', 'firstName lastName username email');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payroll marked as paid successfully',
      data: payroll
    });
  } catch (error) {
    console.error('Error marking payroll as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get employees for payroll (users with roles that can receive salary)
const getEmployeesForPayroll = async (req, res) => {
  try {
    // Get roles that are eligible for salary (exclude admin and delivery_staff)
    const employees = await User.find({
      role: { $nin: ['admin', 'delivery_staff'] }
    }).select('_id firstName lastName username email role');

    // Add salary information for each employee from database
    const employeesWithSalary = await Promise.all(
      employees.map(async (employee) => {
        const salaryConfig = await SalaryConfig.findOne({ role: employee.role });
        const salaryInfo = salaryConfig ? {
          monthlyBasic: Math.round(salaryConfig.basicSalary / 12),
          monthlyAllowances: Math.round(salaryConfig.allowances / 12),
          monthlyDeductions: Math.round(salaryConfig.deductions / 12),
          monthlyTotal: Math.round((salaryConfig.basicSalary + salaryConfig.allowances - salaryConfig.deductions) / 12),
          description: salaryConfig.description
        } : null;

        return {
          ...employee.toObject(),
          salaryInfo
        };
      })
    );

    res.status(200).json({
      success: true,
      data: employeesWithSalary
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get salary configuration for all roles
const getSalaryConfig = async (req, res) => {
  try {
    const salaryConfigs = await SalaryConfig.find().sort({ role: 1 });
    
    const formattedConfig = salaryConfigs.map(config => ({
      role: config.role,
      monthlyBasic: Math.round(config.basicSalary / 12),
      monthlyAllowances: Math.round(config.allowances / 12),
      monthlyDeductions: Math.round(config.deductions / 12),
      monthlyTotal: Math.round((config.basicSalary + config.allowances - config.deductions) / 12),
      description: config.description
    }));

    res.status(200).json({
      success: true,
      data: formattedConfig
    });
  } catch (error) {
    console.error('Error fetching salary config:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Generate all payrolls for a specific month
const generateAllPayrolls = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Get all eligible employees (exclude admin and delivery_staff)
    const employees = await User.find({
      role: { $nin: ['admin', 'delivery_staff'] }
    });

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No eligible employees found'
      });
    }

    const createdPayrolls = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Check if payroll already exists for this employee, month, and year
        const existingPayroll = await Payroll.findOne({
          employeeId: employee._id,
          month: parseInt(month),
          year: parseInt(year)
        });

        if (existingPayroll) {
          errors.push(`Payroll already exists for ${employee.firstName} ${employee.lastName}`);
          continue;
        }

        // Get salary information for the role from database
        const salaryConfig = await SalaryConfig.findOne({ role: employee.role });
        if (!salaryConfig) {
          errors.push(`No salary configuration found for ${employee.firstName} ${employee.lastName} (${employee.role})`);
          continue;
        }
        
        const roleSalaryInfo = {
          monthlyBasic: Math.round(salaryConfig.basicSalary / 12),
          monthlyAllowances: Math.round(salaryConfig.allowances / 12),
          monthlyDeductions: Math.round(salaryConfig.deductions / 12)
        };

        // Create payroll entry
        const payroll = new Payroll({
          employeeId: employee._id,
          employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.username,
          employeeEmail: employee.email,
          employeeRole: employee.role,
          basicSalary: roleSalaryInfo.monthlyBasic,
          allowances: roleSalaryInfo.monthlyAllowances,
          deductions: roleSalaryInfo.monthlyDeductions,
          month: parseInt(month),
          year: parseInt(year),
          paymentMethod: 'bank_transfer',
          notes: 'Auto-generated payroll',
          isFixedSalary: true,
          salarySource: 'fixed',
          createdBy: req.user.id
        });

        await payroll.save();
        createdPayrolls.push(payroll);
      } catch (error) {
        errors.push(`Failed to create payroll for ${employee.firstName} ${employee.lastName}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Generated ${createdPayrolls.length} payroll entries for ${getMonthName(month)} ${year}`,
      data: {
        created: createdPayrolls.length,
        total: employees.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Error generating payrolls:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to get month name
const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

// Update salary configuration
const updateSalaryConfig = async (req, res) => {
  try {
    const { role, basicSalary, allowances, deductions } = req.body;

    if (!role || basicSalary === undefined || allowances === undefined || deductions === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Role, basic salary, allowances, and deductions are required'
      });
    }

    // Convert monthly values to annual for storage with strict validation
    const monthlyBasic = isNaN(parseFloat(basicSalary)) ? 0 : parseFloat(basicSalary);
    const monthlyAllowances = isNaN(parseFloat(allowances)) ? 0 : parseFloat(allowances);
    const monthlyDeductions = isNaN(parseFloat(deductions)) ? 0 : parseFloat(deductions);
    
    // Ensure values are positive numbers
    const validBasicSalary = Math.max(0, monthlyBasic);
    const validAllowances = Math.max(0, monthlyAllowances);
    const validDeductions = Math.max(0, monthlyDeductions);
    
    const annualBasicSalary = Math.round(validBasicSalary * 12);
    const annualAllowances = Math.round(validAllowances * 12);
    const annualDeductions = Math.round(validDeductions * 12);

    // Update or create salary configuration in database
    const updatedConfig = await SalaryConfig.findOneAndUpdate(
      { role },
      {
        basicSalary: annualBasicSalary,
        allowances: annualAllowances,
        deductions: annualDeductions
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Salary configuration updated successfully',
      data: {
        role: updatedConfig.role,
        monthlyBasic: Math.round(updatedConfig.basicSalary / 12),
        monthlyAllowances: Math.round(updatedConfig.allowances / 12),
        monthlyDeductions: Math.round(updatedConfig.deductions / 12),
        monthlyTotal: Math.round((updatedConfig.basicSalary + updatedConfig.allowances - updatedConfig.deductions) / 12)
      }
    });
  } catch (error) {
    console.error('Error updating salary config:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {
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
};
