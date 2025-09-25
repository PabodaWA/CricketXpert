import React, { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '../api/paymentApi';
import axios from 'axios';

const AllPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [searchInput, setSearchInput] = useState(''); // Input field value
  const [filters, setFilters] = useState({
    status: '',
    paymentType: '',
    startDate: '',
    endDate: '',
    searchQuery: '' // Server-side search query
  });

  const limit = 10;

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (searchValue) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setFilters(prev => ({ ...prev, searchQuery: searchValue }));
          setCurrentPage(1); // Reset to first page when searching
        }, 500); // 500ms delay
      };
    })(),
    []
  );

  // Fetch payments data
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Check if user is authenticated
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      console.log('User info:', userInfo);
      
      if (!userInfo.token) {
        setError('You are not logged in. Please log in to view payments.');
        setLoading(false);
        return;
      }
      
      // Check if user has permission to view payments (admin or order_manager)
      if (!userInfo.role || !['admin', 'order_manager'].includes(userInfo.role)) {
        setError('You do not have permission to view payments. Only administrators and order managers can access this page.');
        setLoading(false);
        return;
      }
      
      const params = {
        page: currentPage,
        limit: limit,
        ...filters
      };

      console.log('Fetching payments with params:', params);
      
      // Try using the API service first, then fallback to direct axios call
      let response;
      try {
        response = await paymentApi.getAllPayments(params);
        console.log('Payments response from API service:', response);
      } catch (apiError) {
        console.log('API service failed, trying direct axios call:', apiError);
        
        // Fallback: Direct axios call
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json'
          },
          params: params
        };
        
        const axiosResponse = await axios.get('http://localhost:5000/api/payment', config);
        response = axiosResponse.data;
        console.log('Payments response from direct axios:', response);
      }
      
      setPayments(response.payments || []);
      setTotalPages(response.totalPages || 1);
      setTotalPayments(response.total || 0);
    } catch (err) {
      console.error('Detailed error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, filters.status, filters.paymentType, filters.startDate, filters.endDate, filters.searchQuery]);

  // Handle search input changes with debouncing
  useEffect(() => {
    debouncedSearch(searchInput);
  }, [searchInput, debouncedSearch]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'searchQuery') {
      setCurrentPage(1); // Reset to first page when filters change (except search)
    }
  };

  // Handle search input changes
  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      paymentType: '',
      startDate: '',
      endDate: '',
      searchQuery: ''
    });
    setSearchInput(''); // Clear search input as well
    setCurrentPage(1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment type display name
  const getPaymentTypeDisplay = (type) => {
    switch (type) {
      case 'order_payment':
        return 'Order Payment';
      case 'booking_payment':
        return 'Booking Payment';
      case 'enrollment_payment':
        return 'Enrollment Payment';
      default:
        return type;
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">All Payments</h2>
        <p className="text-gray-600">Manage and view all payment transactions</p>
        <button
          onClick={fetchPayments}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh Data
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
            <select
              value={filters.paymentType}
              onChange={(e) => handleFilterChange('paymentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="order_payment">Order Payment</option>
              <option value="booking_payment">Booking Payment</option>
              <option value="enrollment_payment">Enrollment Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
            <input
              type="text"
              placeholder="Search by user name..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}


      {/* Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {payments.length} of {totalPayments} payments
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Related ID
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {payment._id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.userId ? (
                      <div>
                        <div className="font-medium">
                          {payment.userId.firstName} {payment.userId.lastName}
                        </div>
                        <div className="text-gray-500">{payment.userId.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getPaymentTypeDisplay(payment.paymentType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {(() => {
                      // Show appropriate related ID based on payment type
                      if (payment.paymentType === 'order_payment' && payment.orderId) {
                        return (
                          <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                            {payment.orderId._id ? payment.orderId._id.slice(-8) : payment.orderId.slice(-8)}
                          </span>
                        );
                      } else if (payment.paymentType === 'enrollment_payment' && payment.enrollmentId) {
                        return (
                          <span className="text-green-600 hover:text-green-800 cursor-pointer">
                            {payment.enrollmentId.slice(-8)}
                          </span>
                        );
                      } else if (payment.paymentType === 'booking_payment' && payment.bookingId) {
                        return (
                          <span className="text-purple-600 hover:text-purple-800 cursor-pointer">
                            {payment.bookingId.slice(-8)}
                          </span>
                        );
                      } else {
                        return <span className="text-gray-500">N/A</span>;
                      }
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPayments;
