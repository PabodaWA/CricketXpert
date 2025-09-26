// Fixed salary configuration for different roles (Sri Lankan Rupees - LKR)
// Admin can modify these values as needed
export const ROLE_SALARIES = {
  // Management roles (40,000 - 30,000 LKR range)
  coaching_manager: {
    basicSalary: 480000, // 40,000 LKR per month = 480,000 LKR per year
    allowances: 60000,   // 5,000 LKR per month = 60,000 LKR per year
    deductions: 0,       // Default deductions (can be modified)
    description: "Coaching Manager"
  },
  
  order_manager: {
    basicSalary: 420000, // 35,000 LKR per month = 420,000 LKR per year
    allowances: 48000,   // 4,000 LKR per month = 48,000 LKR per year
    deductions: 0,       // Default deductions (can be modified)
    description: "Order Manager"
  },
  
  ground_manager: {
    basicSalary: 360000, // 30,000 LKR per month = 360,000 LKR per year
    allowances: 36000,   // 3,000 LKR per month = 36,000 LKR per year
    deductions: 0,       // Default deductions (can be modified)
    description: "Ground Manager"
  },
  
  service_manager: {
    basicSalary: 450000, // 37,500 LKR per month = 450,000 LKR per year
    allowances: 54000,   // 4,500 LKR per month = 54,000 LKR per year
    deductions: 0,       // Default deductions (can be modified)
    description: "Service Manager"
  },
  
  // Other roles (30,000 - 20,000 LKR range)
  coach: {
    basicSalary: 300000, // 25,000 LKR per month = 300,000 LKR per year
    allowances: 36000,   // 3,000 LKR per month = 36,000 LKR per year
    deductions: 0,       // Default deductions (can be modified)
    description: "Cricket Coach"
  },
  
  technician: {
    basicSalary: 240000, // 20,000 LKR per month = 240,000 LKR per year
    allowances: 24000,   // 2,000 LKR per month = 24,000 LKR per year
    deductions: 0,       // Default deductions (can be modified)
    description: "Repair Technician"
  }
};

// Get salary for a specific role
export const getSalaryForRole = (role) => {
  return ROLE_SALARIES[role] || {
    basicSalary: 0,
    allowances: 0,
    description: "Unknown Role"
  };
};

// Get all roles that are eligible for salary (exclude admin)
export const getSalaryEligibleRoles = () => {
  return Object.keys(ROLE_SALARIES).filter(role => role !== 'admin');
};

// Calculate monthly salary from annual
export const getMonthlySalary = (annualSalary) => {
  return Math.round(annualSalary / 12);
};

// Get all salary information for a role
export const getRoleSalaryInfo = (role) => {
  const salary = getSalaryForRole(role);
  const monthlyBasic = getMonthlySalary(salary.basicSalary);
  const monthlyAllowances = getMonthlySalary(salary.allowances);
  const monthlyDeductions = getMonthlySalary(salary.deductions || 0);
  const monthlyTotal = monthlyBasic + monthlyAllowances - monthlyDeductions;
  
  return {
    ...salary,
    monthlyBasic,
    monthlyAllowances,
    monthlyDeductions,
    monthlyTotal,
    annualTotal: salary.basicSalary + salary.allowances - (salary.deductions || 0)
  };
};
