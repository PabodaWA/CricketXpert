import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRepairRequests } from '../api/repairRequestApi';
import Brand from '../brand';

const RepairRevenue = () => {
  const navigate = useNavigate();
  const [repairRequests, setRepairRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);

  useEffect(() => {
    loadRepairData();
  }, []);

  useEffect(() => {
    filterRequestsByMonth();
  }, [repairRequests, selectedMonth]);

  const loadRepairData = async () => {
    try {
      setLoading(true);
      const response = await getAllRepairRequests();
      setRepairRequests(response.data);
    } catch (error) {
      console.error('Error loading repair requests:', error);
      setRepairRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequestsByMonth = () => {
    if (!selectedMonth) {
      setFilteredRequests(repairRequests);
    } else {
      const filtered = repairRequests.filter(request => {
        const requestDate = new Date(request.createdAt);
        const requestMonth = String(requestDate.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-11, pad with 0
        const requestYear = requestDate.getFullYear().toString();
        const [selectedYear, selectedMonthNum] = selectedMonth.split('-');
        
        return requestYear === selectedYear && 
               requestMonth === selectedMonthNum;
      });
      setFilteredRequests(filtered);
    }
  };

  useEffect(() => {
    // Calculate total revenue and count - only for completed repairs (including Ready for Pickup)
    const completedEstimatesWithCost = filteredRequests.filter(request => 
      request.costEstimate && request.costEstimate > 0 && 
      (request.status === 'Completed' || request.status === 'Ready for Pickup')
    );
    
    const total = completedEstimatesWithCost.reduce((sum, request) => sum + request.costEstimate, 0);
    setTotalRevenue(total);
    setTotalRequests(completedEstimatesWithCost.length);
  }, [filteredRequests]);

  const generatePDF = () => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    
    const currentDate = new Date();
    const monthYear = selectedMonth ? 
      new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
      'All Time';
    
    const estimatesWithCost = filteredRequests.filter(request => 
      request.costEstimate && request.costEstimate > 0 && 
      (request.status === 'Completed' || request.status === 'Ready for Pickup')
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Repair Revenue Report - ${monthYear}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #072679; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .summary h2 { color: #072679; margin-top: 0; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .summary-item { text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #10B981; }
          .summary-label { color: #666; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; color: #072679; }
          .repair-id { font-family: monospace; font-weight: bold; }
          .cost { text-align: right; font-weight: bold; color: #10B981; }
          .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-approved { background: #dbeafe; color: #1e40af; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CricketXpert Repair Revenue Report</h1>
          <p>Report Period: ${monthYear}</p>
          <p>Generated on: ${currentDate.toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <h2>Summary</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${totalRequests}</div>
              <div class="summary-label">Completed Repairs</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">Rs. ${totalRevenue.toLocaleString()}</div>
              <div class="summary-label">Total Revenue</div>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Repair ID</th>
              <th>Customer</th>
              <th>Equipment</th>
              <th>Damage Type</th>
              <th>Cost Estimate</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${estimatesWithCost.map(request => `
              <tr>
                <td class="repair-id">REP-${request._id.slice(-8).toUpperCase()}</td>
                <td>${request.customerId?.username || 'Unknown'}</td>
                <td>${request.equipmentType ? request.equipmentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Cricket Equipment'}</td>
                <td>${request.damageType}</td>
                <td class="cost">Rs. ${request.costEstimate.toLocaleString()}</td>
                <td><span class="status status-${request.status.toLowerCase().replace(' ', '-')}">${request.status}</span></td>
                <td>${new Date(request.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>This report was generated automatically by CricketXpert Repair Management System</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Ready for Pickup':
        return 'bg-green-100 text-green-800';
      case 'Customer Approved':
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Repair':
      case 'Halfway Completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Brand.light }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: Brand.secondary }}></div>
          <p className="mt-4" style={{ color: Brand.body }}>Loading repair revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Brand.light }}>
      {/* Main Content */}
      <main className="flex-1 p-8 relative">
        {/* Sidebar Toggle Button */}
        <div className="absolute top-0 left-0 z-50">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ backgroundColor: Brand.primary, color: 'white' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Sidebar Overlay */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold" style={{ color: Brand.primary }}>Repair Management</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <nav className="space-y-2 flex-1">
              <button
                onClick={() => {
                  navigate('/dashboard');
                  setShowSidebar(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:text-white transition-colors flex items-center space-x-3"
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#42ADF5'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6H8V5z" />
                </svg>
                <span>Overview of Repair</span>
              </button>
              <button
                onClick={() => {
                  navigate('/repair-revenue');
                  setShowSidebar(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:text-white transition-colors flex items-center space-x-3"
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#42ADF5'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Repair Revenue</span>
              </button>
              <button
                onClick={() => {
                  navigate('/new-technician');
                  setShowSidebar(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:text-white transition-colors flex items-center space-x-3"
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#42ADF5'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20a6 6 0 0 1 12 0v1H3v-1z" />
                </svg>
                <span>New Technician</span>
              </button>
            </nav>
            
            {/* Logout Button at Bottom */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  localStorage.removeItem('cx_current_user');
                  localStorage.removeItem('userInfo');
                  navigate('/login');
                  setShowSidebar(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:text-white transition-colors flex items-center space-x-3"
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fecaca'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <svg className="w-6 h-6" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                </svg>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 mt-20">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: Brand.primary }}>Repair Revenue Report</h1>
                <p className="mt-1" style={{ color: Brand.body }}>View and export completed repair estimates with revenue calculations</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Month Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium" style={{ color: Brand.body }}>Filter by Month:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: Brand.secondary, color: Brand.body }}
                  >
                    <option value="">All Time</option>
                    {(() => {
                      const months = [];
                      const currentDate = new Date();
                      for (let i = 0; i < 12; i++) {
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        months.push({ value, label });
                      }
                      return months;
                    })().map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Export PDF Button */}
                <button
                  onClick={generatePDF}
                  className="px-4 py-2 rounded-lg text-white font-semibold flex items-center space-x-2"
                  style={{ backgroundColor: Brand.accent }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: Brand.body }}>Completed Repairs</p>
                  <p className="text-3xl font-bold" style={{ color: Brand.primary }}>{totalRequests}</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: Brand.primary + '20' }}>
                  <svg className="w-6 h-6" style={{ color: Brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: Brand.body }}>Total Revenue</p>
                  <p className="text-3xl font-bold" style={{ color: '#10B981' }}>Rs. {totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: '#10B981' + '20' }}>
                  <svg className="w-6 h-6" style={{ color: '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: Brand.body }}>Average Revenue</p>
                  <p className="text-3xl font-bold" style={{ color: Brand.secondary }}>
                    Rs. {totalRequests > 0 ? Math.round(totalRevenue / totalRequests).toLocaleString() : '0'}
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: Brand.secondary + '20' }}>
                  <svg className="w-6 h-6" style={{ color: Brand.secondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Repair Estimates Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: Brand.light }}>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                    Completed Repair Estimates ({filteredRequests.filter(r => r.costEstimate && r.costEstimate > 0 && (r.status === 'Completed' || r.status === 'Ready for Pickup')).length})
                  </h2>
                  <p className="text-sm" style={{ color: Brand.body }}>
                    {selectedMonth ? 
                      `Showing completed repairs for ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` :
                      'Showing all completed repairs'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm" style={{ backgroundColor: Brand.light }}>
                    <th className="px-6 py-3" style={{ color: Brand.body }}>Repair ID</th>
                    <th className="px-6 py-3" style={{ color: Brand.body }}>Customer</th>
                    <th className="px-6 py-3" style={{ color: Brand.body }}>Equipment</th>
                    <th className="px-6 py-3" style={{ color: Brand.body }}>Damage Type</th>
                    <th className="px-6 py-3" style={{ color: Brand.body }}>Cost Estimate</th>
                    <th className="px-6 py-3" style={{ color: Brand.body }}>Status</th>
                    <th className="px-6 py-3" style={{ color: Brand.body }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests
                    .filter(request => request.costEstimate && request.costEstimate > 0 && (request.status === 'Completed' || request.status === 'Ready for Pickup'))
                    .map((request) => (
                    <tr key={request._id} className="border-t" style={{ borderColor: Brand.light }}>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold" style={{ color: Brand.primary }}>
                          REP-{request._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium" style={{ color: Brand.body }}>
                            {request.customerId?.username || 'Unknown'}
                          </div>
                          <div className="text-sm" style={{ color: Brand.secondary }}>
                            {request.customerId?.email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ color: Brand.body }}>
                        {request.equipmentType ? 
                          request.equipmentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                          'Cricket Equipment'
                        }
                      </td>
                      <td className="px-6 py-4" style={{ color: Brand.body }}>
                        {request.damageType}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-lg" style={{ color: '#10B981' }}>
                          Rs. {request.costEstimate.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ color: Brand.body }}>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRequests.filter(r => r.costEstimate && r.costEstimate > 0 && (r.status === 'Completed' || r.status === 'Ready for Pickup')).length === 0 && (
                <div className="px-6 py-8 text-center">
                  <div className="text-gray-500">
                    <div className="text-lg mb-2">No completed repair estimates found</div>
                    <div className="text-sm">
                      {selectedMonth ? 
                        'No completed repairs available for the selected month' :
                        'No completed repair estimates with cost information available'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RepairRevenue;
