import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAllRepairRequests } from '../api/repairRequestApi';

// --- Icon Components ---
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CurrencyDollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const TrendingDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const WrenchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;

const RevenueAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    ecommerceRevenue: 0,
    coachingRevenue: 0,
    groundRevenue: 0,
    repairRevenue: 0,
    totalOrders: 0,
    totalEnrollments: 0,
    totalBookings: 0,
    totalRepairs: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    topProducts: [],
    topPrograms: [],
    monthlyRevenue: [],
    revenueBySource: [],
    // Profit data
    totalProfit: 0,
    profitMargin: 0,
    totalExpenses: 0,
    payrollExpenses: 0,
    profitGrowth: 0,
    profitBySource: [],
    monthlyProfit: []
  });
  const [isMockData, setIsMockData] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('dateRange'); // 'dateRange' or 'month'

  // Fetch repair revenue data
  const fetchRepairRevenue = async (startDate, endDate) => {
    try {
      const response = await getAllRepairRequests();
      const repairRequests = response.data || [];
      
      // Filter by date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the full end date
      
      // Filter completed repairs with cost estimates within date range
      const completedRepairs = repairRequests.filter(request => {
        const requestDate = new Date(request.createdAt);
        return request.costEstimate && 
               request.costEstimate > 0 && 
               (request.status === 'Completed' || request.status === 'Ready for Pickup') &&
               requestDate >= start && 
               requestDate <= end;
      });
      
      // Calculate total repair revenue
      const totalRepairRevenue = completedRepairs.reduce((sum, repair) => sum + repair.costEstimate, 0);
      
      return {
        repairRevenue: totalRepairRevenue,
        totalRepairs: completedRepairs.length
      };
    } catch (error) {
      console.error('Error fetching repair revenue:', error);
      return {
        repairRevenue: 0,
        totalRepairs: 0
      };
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setRefreshing(true);
      
      // Get auth token from localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      
      // Fetch repair revenue data
      const repairData = await fetchRepairRevenue(dateRange.startDate, dateRange.endDate);
      
      if (!token) {
        console.log('No auth token found, using mock data');
        setIsMockData(true);
        // Set mock data for development (showing LKR amounts)
        const mockRepairRevenue = 125000; // LKR 125K
        const mockTotalRevenue = 1250000 + mockRepairRevenue; // LKR 1.375M
        
        const mockRevenueData = {
          totalRevenue: mockTotalRevenue,
          ecommerceRevenue: 450000, // LKR 450K
          coachingRevenue: 650000, // LKR 650K
          groundRevenue: 150000, // LKR 150K
          repairRevenue: mockRepairRevenue,
          totalOrders: 234,
          totalEnrollments: 89,
          totalBookings: 156,
          totalRepairs: 25,
          averageOrderValue: 1923.10, // LKR ~1,923
          revenueGrowth: 12.5,
          topProducts: [
            { name: 'Cricket Bat', revenue: 85000, orders: 45 },
            { name: 'Cricket Ball', revenue: 62000, orders: 78 },
            { name: 'Cricket Kit', revenue: 120000, orders: 12 }
          ],
          topPrograms: [
            { name: 'Beginner Cricket Program', revenue: 250000, enrollments: 25 },
            { name: 'Advanced Batting Course', revenue: 180000, enrollments: 18 },
            { name: 'Bowling Masterclass', revenue: 120000, enrollments: 15 }
          ],
          monthlyRevenue: [
            { month: 'Jan', revenue: 85000 },
            { month: 'Feb', revenue: 92000 },
            { month: 'Mar', revenue: 110000 },
            { month: 'Apr', revenue: 125000 },
            { month: 'May', revenue: 138000 },
            { month: 'Jun', revenue: 152000 }
          ],
          revenueBySource: [
            { source: 'E-commerce', revenue: 450000, percentage: 33 },
            { source: 'Coaching', revenue: 650000, percentage: 47 },
            { source: 'Ground Bookings', revenue: 150000, percentage: 11 },
            { source: 'Repair Services', revenue: mockRepairRevenue, percentage: 9 }
          ]
        };
        
        // Calculate profit data
        const profitData = await calculateProfitData(mockRevenueData, dateRange.startDate, dateRange.endDate);
        
        setAnalyticsData({
          ...mockRevenueData,
          ...profitData
        });
        return;
      }
      
      const response = await axios.get('http://localhost:5000/api/analytics/revenue', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Merge repair data with API response
      const apiData = response.data.data;
      const updatedData = {
        ...apiData,
        repairRevenue: repairData.repairRevenue,
        totalRepairs: repairData.totalRepairs,
        totalRevenue: (apiData.totalRevenue || 0) + repairData.repairRevenue
      };
      
      // Update revenue by source to include repairs
      if (updatedData.revenueBySource) {
        const totalRev = updatedData.totalRevenue;
        updatedData.revenueBySource = updatedData.revenueBySource.map(source => ({
          ...source,
          percentage: Math.round((source.revenue / totalRev) * 100)
        }));
        updatedData.revenueBySource.push({
          source: 'Repair Services',
          revenue: repairData.repairRevenue,
          percentage: Math.round((repairData.repairRevenue / totalRev) * 100)
        });
      }
      
      // Calculate profit data for real API data
      const profitData = await calculateProfitData(updatedData, dateRange.startDate, dateRange.endDate);
      
      setAnalyticsData({
        ...updatedData,
        ...profitData
      });
      setIsMockData(false);
      console.log('Real analytics data loaded:', updatedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      console.log('Falling back to mock data');
      setIsMockData(true);
      // Set mock data for development (showing LKR amounts)
      const mockRepairRevenue = 125000; // LKR 125K
      const mockTotalRevenue = 1250000 + mockRepairRevenue; // LKR 1.375M
      
      const mockRevenueData = {
        totalRevenue: mockTotalRevenue,
        ecommerceRevenue: 450000, // LKR 450K
        coachingRevenue: 650000, // LKR 650K
        groundRevenue: 150000, // LKR 150K
        repairRevenue: mockRepairRevenue,
        totalOrders: 234,
        totalEnrollments: 89,
        totalBookings: 156,
        totalRepairs: 25,
        averageOrderValue: 1923.10, // LKR ~1,923
        revenueGrowth: 12.5,
        topProducts: [
          { name: 'Cricket Bat', revenue: 85000, orders: 45 },
          { name: 'Cricket Ball', revenue: 62000, orders: 78 },
          { name: 'Cricket Kit', revenue: 120000, orders: 12 }
        ],
        topPrograms: [
          { name: 'Beginner Cricket Program', revenue: 250000, enrollments: 25 },
          { name: 'Advanced Batting Course', revenue: 180000, enrollments: 18 },
          { name: 'Bowling Masterclass', revenue: 120000, enrollments: 15 }
        ],
        monthlyRevenue: [
          { month: 'Jan', revenue: 85000 },
          { month: 'Feb', revenue: 92000 },
          { month: 'Mar', revenue: 110000 },
          { month: 'Apr', revenue: 125000 },
          { month: 'May', revenue: 138000 },
          { month: 'Jun', revenue: 152000 }
        ],
        revenueBySource: [
          { source: 'E-commerce', revenue: 450000, percentage: 33 },
          { source: 'Coaching', revenue: 650000, percentage: 47 },
          { source: 'Ground Bookings', revenue: 150000, percentage: 11 },
          { source: 'Repair Services', revenue: mockRepairRevenue, percentage: 9 }
        ]
      };
      
      // Calculate profit data
      const profitData = await calculateProfitData(mockRevenueData, dateRange.startDate, dateRange.endDate);
      
      setAnalyticsData({
        ...mockRevenueData,
        ...profitData
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      fetchAnalyticsData();
    } catch (error) {
      console.error('Error in useEffect:', error);
      setIsMockData(true);
    }
  }, [dateRange]);

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'LKR 0.00';
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0.0%';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Fetch payroll expenses from API
  const fetchPayrollExpenses = async (startDate, endDate) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      
      if (!token) {
        return { payrollExpenses: 0 };
      }

      const response = await axios.get('http://localhost:5000/api/analytics/payroll-expenses', {
        params: {
          startDate: startDate,
          endDate: endDate
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.data || { payrollExpenses: 0 };
    } catch (error) {
      console.error('Error fetching payroll expenses:', error);
      return { payrollExpenses: 0 };
    }
  };

  // Calculate monthly profit data from real data
  const calculateMonthlyProfit = async (startDate, endDate) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      
      if (!token) {
        return [];
      }

      const response = await axios.get('http://localhost:5000/api/analytics/monthly-profit', {
        params: {
          startDate: startDate,
          endDate: endDate
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching monthly profit:', error);
      return [];
    }
  };

  // Calculate profit data
  const calculateProfitData = async (revenueData, startDate, endDate) => {
    // E-commerce profit: 10% of e-commerce revenue (90% is product cost)
    const ecommerceProfit = revenueData.ecommerceRevenue * 0.1;
    
    // Other revenue sources are 100% profit (coaching, ground, repair)
    const coachingProfit = revenueData.coachingRevenue;
    const groundProfit = revenueData.groundRevenue;
    const repairProfit = revenueData.repairRevenue;
    
    // Total gross profit before expenses
    const grossProfit = ecommerceProfit + coachingProfit + groundProfit + repairProfit;
    
    // Fetch real payroll expenses from API
    const payrollData = await fetchPayrollExpenses(startDate, endDate);
    const payrollExpenses = payrollData.payrollExpenses || 0;
    const operationalExpenses = 0; // No operational costs - only payroll
    const totalExpenses = payrollExpenses + operationalExpenses;
    
    // Net profit
    const totalProfit = grossProfit - totalExpenses;
    const profitMargin = revenueData.totalRevenue > 0 ? (totalProfit / revenueData.totalRevenue) * 100 : 0;
    
    // Profit by source
    const profitBySource = [
      { source: 'E-commerce', profit: ecommerceProfit, percentage: grossProfit > 0 ? (ecommerceProfit / grossProfit) * 100 : 0 },
      { source: 'Coaching', profit: coachingProfit, percentage: grossProfit > 0 ? (coachingProfit / grossProfit) * 100 : 0 },
      { source: 'Ground Bookings', profit: groundProfit, percentage: grossProfit > 0 ? (groundProfit / grossProfit) * 100 : 0 },
      { source: 'Repair Services', profit: repairProfit, percentage: grossProfit > 0 ? (repairProfit / grossProfit) * 100 : 0 }
    ];
    
    // Calculate real monthly profit data
    const monthlyProfit = await calculateMonthlyProfit(startDate, endDate);
    
    return {
      totalProfit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      totalExpenses,
      payrollExpenses,
      operationalExpenses,
      profitGrowth: 15.2, // Mock growth percentage
      profitBySource,
      monthlyProfit
    };
  };

  // Download revenue report
  const downloadRevenueReport = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      
      if (!token) {
        alert('Please login to download reports');
        return;
      }

      const params = {
        startDate: reportDateRange.startDate,
        endDate: reportDateRange.endDate,
        reportType: reportType
      };

      const response = await axios.get('http://localhost:5000/api/analytics/revenue-report', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `revenue-report-${reportDateRange.startDate}-to-${reportDateRange.endDate}.pdf`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowDownloadModal(false);
      alert('Revenue report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mock Data Notice */}
      {isMockData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Demo Data:</strong> Currently showing sample data. Connect to your database to see real revenue analytics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial insights and performance metrics</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2">
            <CalendarIcon />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="ml-2">Download Report</span>
          </button>
          <button
            onClick={fetchAnalyticsData}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <RefreshIcon />
            <span className="ml-2">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalRevenue)}</p>
              <div className="flex items-center mt-1">
                {analyticsData.revenueGrowth >= 0 ? (
                  <TrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ml-1 ${analyticsData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(analyticsData.revenueGrowth)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* E-commerce Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">E-commerce Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.ecommerceRevenue)}</p>
              <p className="text-sm text-gray-500 mt-1">{analyticsData.totalOrders} orders</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Coaching Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coaching Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.coachingRevenue)}</p>
              <p className="text-sm text-gray-500 mt-1">{analyticsData.totalEnrollments} enrollments</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        {/* Ground Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ground Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.groundRevenue)}</p>
              <p className="text-sm text-gray-500 mt-1">{analyticsData.totalBookings} bookings</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        {/* Repair Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Repair Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.repairRevenue)}</p>
              <p className="text-sm text-gray-500 mt-1">{analyticsData.totalRepairs} repairs</p>
            </div>
            <WrenchIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Profit Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Profit */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalProfit)}</p>
              <div className="flex items-center mt-1">
                {analyticsData.profitGrowth >= 0 ? (
                  <TrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ml-1 ${analyticsData.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(analyticsData.profitGrowth)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.profitMargin}%</p>
              <p className="text-sm text-gray-500 mt-1">of total revenue</p>
            </div>
            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalExpenses)}</p>
              <p className="text-sm text-gray-500 mt-1">Payroll + Operational</p>
            </div>
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Net Profit Growth */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit Growth</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.profitGrowth)}</p>
              <p className="text-sm text-gray-500 mt-1">monthly growth</p>
            </div>
            <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Source */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Source</h3>
        <div className="space-y-4">
          {(analyticsData.revenueBySource || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-purple-500' : 
                    index === 2 ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.source}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                  <p className="text-xs text-gray-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
        <div className="space-y-3">
          {(analyticsData.monthlyRevenue || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.month}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${analyticsData.monthlyRevenue && analyticsData.monthlyRevenue.length > 0 
                          ? (item.revenue / Math.max(...analyticsData.monthlyRevenue.map(m => m.revenue || 0))) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-4">
            {(analyticsData.topProducts || []).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                  <p className="text-sm text-gray-500">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Programs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Programs</h3>
          <div className="space-y-4">
            {(analyticsData.topPrograms || []).map((program, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{program.name}</p>
                  <p className="text-sm text-gray-500">{program.enrollments} enrollments</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(program.revenue)}</p>
                  <p className="text-sm text-gray-500">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profit Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit by Source */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit by Source</h3>
          <div className="space-y-4">
            {(analyticsData.profitBySource || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-purple-500' : 
                    index === 2 ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.source}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.profit)}</p>
                  <p className="text-xs text-gray-500">{Math.round(item.percentage)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Profit Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Profit Trend</h3>
          <div className="space-y-3">
            {(analyticsData.monthlyProfit || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.month}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((item.profit / Math.max(...(analyticsData.monthlyProfit || []).map(p => p.profit))) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                    {formatCurrency(item.profit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Payroll Expenses</p>
                  <p className="text-sm text-gray-500">Staff salaries & benefits</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(analyticsData.payrollExpenses)}</p>
                <p className="text-sm text-gray-500">{Math.round((analyticsData.payrollExpenses / analyticsData.totalExpenses) * 100)}%</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeDasharray={`${(analyticsData.payrollExpenses / analyticsData.totalExpenses) * 314} 314`}
                    strokeDashoffset="0"
                  />
                  {/* Operational expenses circle removed since it's 0 */}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(analyticsData.totalExpenses)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Total Expenses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Calculation Formula */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Profit Calculations & Breakdown</h3>
        </div>
        
        <div className="space-y-4">
          {/* Revenue Sources */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Revenue Sources</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>E-commerce Revenue</span>
                <span className="font-mono">{formatCurrency(analyticsData.ecommerceRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Coaching Revenue</span>
                <span className="font-mono">{formatCurrency(analyticsData.coachingRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ground Revenue</span>
                <span className="font-mono">{formatCurrency(analyticsData.groundRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Repair Revenue</span>
                <span className="font-mono">{formatCurrency(analyticsData.repairRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Profit Calculation Steps */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Profit Calculation Steps</h4>
            <div className="space-y-3 text-sm font-mono">
              <div className="flex items-center justify-between">
                <span>E-commerce Profit = E-commerce Revenue × 10%</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(analyticsData.ecommerceRevenue * 0.1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Coaching Profit = Coaching Revenue × 100%</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(analyticsData.coachingRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ground Profit = Ground Revenue × 100%</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(analyticsData.groundRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Repair Profit = Repair Revenue × 100%</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(analyticsData.repairRevenue)}
                </span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex items-center justify-between font-semibold">
                <span>Gross Profit = E-commerce + Coaching + Ground + Repair</span>
                <span className="text-green-600">
                  {formatCurrency((analyticsData.ecommerceRevenue * 0.1) + analyticsData.coachingRevenue + analyticsData.groundRevenue + analyticsData.repairRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Expense Calculation */}
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Expense Calculation</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center justify-between">
                <span>Payroll Expenses</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(analyticsData.payrollExpenses)}
                </span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex items-center justify-between font-semibold">
                <span>Total Expenses = Payroll</span>
                <span className="text-red-600">
                  {formatCurrency(analyticsData.totalExpenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Final Profit Calculation */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Final Profit Calculation</h4>
            <div className="text-sm font-mono">
              <div className="flex items-center justify-between mb-2">
                <span>Net Profit = Gross Profit - Total Expenses</span>
                <span className="font-bold text-green-600 text-lg">
                  {formatCurrency(analyticsData.totalProfit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Profit Margin = (Net Profit ÷ Total Revenue) × 100</span>
                <span className="font-bold text-green-600">
                  {analyticsData.profitMargin}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.averageOrderValue)}</p>
            <p className="text-sm text-gray-600">Average Order Value</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{analyticsData.totalOrders}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{analyticsData.totalEnrollments}</p>
            <p className="text-sm text-gray-600">Total Enrollments</p>
          </div>
        </div>
      </div>

      {/* Download Report Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Revenue Report</h3>
            
            <div className="space-y-4">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="dateRange"
                      checked={reportType === 'dateRange'}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Date Range</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="month"
                      checked={reportType === 'month'}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Specific Month</span>
                  </label>
                </div>
              </div>

              {/* Date Range Selection */}
              {reportType === 'dateRange' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date Range</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={reportDateRange.startDate}
                      onChange={(e) => setReportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={reportDateRange.endDate}
                      onChange={(e) => setReportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Month Selection */}
              {reportType === 'month' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                  <input
                    type="month"
                    value={reportDateRange.startDate.substring(0, 7)}
                    onChange={(e) => {
                      const monthValue = e.target.value;
                      const startDate = `${monthValue}-01`;
                      const endDate = new Date(new Date(monthValue + '-01').getFullYear(), new Date(monthValue + '-01').getMonth() + 1, 0).toISOString().split('T')[0];
                      setReportDateRange({ startDate, endDate });
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={downloadRevenueReport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RevenueAnalytics;
