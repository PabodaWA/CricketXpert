import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRepairRequests, updateRepairStatus, assignTechnician, sendEstimate } from '../api/repairRequestApi';
import { getAllTechnicians } from '../api/repairRequestApi';
import { updateTechnician } from '../api/technicianApi';
import Brand from '../brand';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Using shared Brand from ../brand

const ServiceManagerDashboard = () => {
  const navigate = useNavigate();
  const [repairRequests, setRepairRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showTechnicianDetailsModal, setShowTechnicianDetailsModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  const [approvalData, setApprovalData] = useState({
    cost: '',
    timeEstimate: ''
  });
  const [approvalErrors, setApprovalErrors] = useState({
    cost: '',
    timeEstimate: ''
  });
  const [rejectionData, setRejectionData] = useState({
    reason: ''
  });
  const [rejectionErrors, setRejectionErrors] = useState({
    reason: ''
  });
  const [assignmentData, setAssignmentData] = useState({
    technicianId: '',
    notes: ''
  });
  const [assignmentNotesError, setAssignmentNotesError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('all');
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [technicianSearchTerm, setTechnicianSearchTerm] = useState('');
  const [requestSearchFilter, setRequestSearchFilter] = useState('all');
  const [technicianSearchFilter, setTechnicianSearchFilter] = useState('all');
  const [technicianAvailabilityFilter, setTechnicianAvailabilityFilter] = useState('available');
  const [globalFilter, setGlobalFilter] = useState('all');
  const [deletingTechnician, setDeletingTechnician] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    console.log('ServiceManagerDashboard mounted, loading data...');
    loadData();
    
    // Expose loadData function globally for cross-dashboard updates
    window.serviceManagerDashboard = {
      loadData: loadData
    };
    
    // Cleanup on unmount
    return () => {
      delete window.serviceManagerDashboard;
    };
  }, []);

  // Auto-refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    const handleFocus = () => {
      loadData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Refresh data when component becomes visible (for navigation back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('ServiceManagerDashboard became visible, refreshing data...');
        loadData();
      }
    };

    const handleFocus = () => {
      console.log('ServiceManagerDashboard window focused, refreshing data...');
      loadData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Reload data when filters change
  useEffect(() => {
    if (repairRequests.length > 0) {
      console.log('Filters changed - filter:', filter, 'searchFilter:', searchFilter);
    }
  }, [filter, searchFilter]);

  const loadData = async () => {
    try {
      console.log('Loading data...');
      
      // Load repair requests
      const requestsRes = await getAllRepairRequests();
      console.log('Requests response:', requestsRes.data);
      console.log('Number of requests:', requestsRes.data.length);
      setRepairRequests(requestsRes.data);
      
      // Load technicians
      try {
        const techniciansRes = await getAllTechnicians();
        console.log('Technicians response:', techniciansRes.data);
        console.log('Technicians with skills:', techniciansRes.data.map(t => ({
          id: t._id,
          name: `${t.technicianId?.firstName} ${t.technicianId?.lastName}`,
          skills: t.skills,
          skillsCount: t.skills ? t.skills.length : 0
        })));
        // Show all technicians in the table
        setTechnicians(techniciansRes.data);
      } catch (techError) {
        console.error('Error loading technicians:', techError);
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Error loading repair requests:', error);
      setRepairRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus, costEstimate = '', timeEstimate = '', rejectionReason = '') => {
    try {
      // Convert status to proper case for backend enum
      let statusValue = newStatus;
      if (newStatus.toLowerCase() === 'approved') {
        statusValue = 'Approved';
      } else if (newStatus.toLowerCase() === 'rejected') {
        statusValue = 'Rejected';
      }
      
      const updateData = { status: statusValue };
      
      if (statusValue === 'Approved') {
        updateData.costEstimate = costEstimate;
        updateData.timeEstimate = timeEstimate;
      } else if (statusValue === 'Rejected') {
        updateData.rejectionReason = rejectionReason;
      }
      
      console.log('Sending update data:', updateData);
      console.log('Request ID:', requestId);
      
      const response = await updateRepairStatus(requestId, updateData);
      console.log('Update response:', response.data);
      
      await loadData(); // Reload data
      alert(`Request ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to update status: ${error.response?.data?.error || error.message}`);
    }
  };



  const validateApprovalData = () => {
    const errors = {};
    
    // Validate cost - only numbers allowed
    if (!approvalData.cost) {
      errors.cost = 'Cost estimate is required';
    } else if (!/^\d+$/.test(approvalData.cost)) {
      errors.cost = 'Cost must be a number only';
    } else if (parseInt(approvalData.cost) <= 0) {
      errors.cost = 'Cost must be greater than 0';
    }
    
    // Validate time estimate - only numbers 1-30 allowed
    if (!approvalData.timeEstimate) {
      errors.timeEstimate = 'Time estimate is required';
    } else if (!/^\d+$/.test(approvalData.timeEstimate)) {
      errors.timeEstimate = 'Time must be a number only';
    } else {
      const days = parseInt(approvalData.timeEstimate);
      if (days < 1 || days > 30) {
        errors.timeEstimate = 'Time must be between 1 and 30 days';
      }
    }
    
    setApprovalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate assignment notes for repeated characters
  const validateAssignmentNotes = (notes) => {
    if (!notes || notes.length < 4) return '';
    
    // Check for repeated letters (3 or more same letters in a row)
    const letterPattern = /(.)\1{2,}/;
    if (letterPattern.test(notes)) {
      return 'Assignment notes cannot contain 3 or more repeated letters in a row (e.g., "aaa", "bbb")';
    }
    
    // Check for repeated numbers (3 or more same numbers in a row)
    const numberPattern = /(\d)\1{2,}/;
    if (numberPattern.test(notes)) {
      return 'Assignment notes cannot contain 3 or more repeated numbers in a row (e.g., "111", "222")';
    }
    
    return '';
  };

  // Validation helper functions for rejection reason
  const hasRepeatedLetters = (text) => /(.)\1\1/.test(text);
  
  // Validate rejection reason
  const validateRejectionReason = (reason) => {
    const trimmedReason = (reason || '').trim();
    if (!trimmedReason) return 'Rejection reason is required';
    if (trimmedReason.length < 5) return 'Rejection reason must be at least 5 characters';
    if (trimmedReason.length > 500) return 'Rejection reason must be 500 characters or less';
    if (hasRepeatedLetters(trimmedReason)) return 'Rejection reason cannot contain repeated letters or numbers consistently';
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(trimmedReason)) return 'Rejection reason cannot contain special characters';
    return '';
  };

  const handleAssignTechnician = async () => {
    // Validate assignment notes before saving
    if (assignmentNotesError) {
      alert('Please fix the assignment notes errors before saving.');
      return;
    }

    try {
      if (!assignmentData.technicianId) {
        alert('Please select a technician');
        return;
      }

      console.log('Assigning technician:', assignmentData.technicianId, 'to request:', selectedRequest._id);
      const response = await assignTechnician(selectedRequest._id, assignmentData);
      console.log('Assignment response:', response.data);
      
      setShowAssignmentModal(false);
      setAssignmentData({ technicianId: '', notes: '' });
      setAssignmentNotesError('');
      await loadData();
      alert('Technician assigned successfully');
    } catch (error) {
      console.error('Error assigning technician:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to assign technician: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleTechnicianAvailabilityUpdate = async (technicianId, newAvailability) => {
    try {
      console.log('Updating technician availability:', technicianId, 'to:', newAvailability);
      const response = await updateTechnician(technicianId, { available: newAvailability });
      console.log('Availability update response:', response.data);
      
      await loadData(); // Reload data to reflect changes
      alert(`Technician availability updated to ${newAvailability ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      console.error('Error updating technician availability:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to update technician availability: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteTechnician = async (technicianId) => {
    if (!window.confirm('Are you sure you want to delete this technician? This action cannot be undone.')) {
      return;
    }
    
    setDeletingTechnician(technicianId);
    try {
      const response = await fetch(`http://localhost:5000/api/technicians/${technicianId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTechnicians(prev => prev.filter(tech => tech._id !== technicianId));
        
        // Update Technician Dashboard if it's open
        if (window.technicianDashboard && window.technicianDashboard.loadTechnicians) {
          window.technicianDashboard.loadTechnicians();
        }
        
        alert('Technician deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete technician: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting technician:', error);
      alert('Failed to delete technician. Please try again.');
    } finally {
      setDeletingTechnician(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Customer Approved': return 'bg-green-100 text-green-800';
      case 'Customer Rejected': return 'bg-orange-100 text-orange-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'In Repair': return 'bg-blue-100 text-blue-800';
      case 'Halfway Completed': return 'bg-yellow-100 text-yellow-800';
      case 'Ready for Pickup': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter requests
  const filteredRequests = repairRequests.filter(request => {
    // Apply status filter (case-sensitive to match backend enum)
    if (filter !== 'all' && request.status !== filter) {
      return false;
    }
    
    // Apply equipment filter
    if (searchFilter !== 'all' && request.equipmentType !== searchFilter) {
      return false;
    }
    
    // Apply damage type filter
    if (requestSearchTerm && requestSearchTerm !== '') {
      const damageType = (request.damageType || '').toLowerCase();
      if (damageType !== requestSearchTerm.toLowerCase()) {
        return false;
      }
    }
    
    return true;
  });

  // Filter technicians
  const filteredTechnicians = technicians.filter(technician => {
    // Apply availability filter
    if (technicianAvailabilityFilter !== 'all') {
      const isAvailable = technician.available === true;
      if (technicianAvailabilityFilter === 'available' && !isAvailable) {
        return false;
      }
      if (technicianAvailabilityFilter === 'unavailable' && isAvailable) {
        return false;
      }
    }
    
    return true;
  });



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Brand.light }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: Brand.secondary }}></div>
          <p className="mt-4" style={{ color: Brand.body }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Brand.light }}>
      <Header />
      {/* Main Content */}
      <main className="flex-1 p-8 relative">
        {/* Sidebar Toggle Button - Left Corner */}
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
                navigate('/');
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
               <h1 className="text-3xl font-bold" style={{ color: Brand.primary }}>Service Manager Dashboard</h1>
               <p className="mt-1" style={{ color: Brand.body }}>Manage repair requests and technician assignments</p>
             </div>
                                                       <div className="flex items-center space-x-4">
                 {/* Global Filter Dropdown */}
                 <div className="flex items-center space-x-2">
                   <select
                     value={globalFilter}
                     onChange={(e) => setGlobalFilter(e.target.value)}
                     className="px-3 py-2 border rounded-lg text-sm"
                     style={{ borderColor: Brand.secondary, color: Brand.body }}
                   >
                     <option value="all">Show All</option>
                     <option value="repair_requests">Repair Requests Only</option>
                     <option value="technicians">Technicians Only</option>
                   </select>
                 </div>
                 
               </div>
           </div>
         </div>

                 {/* Stats */}
         <div className="grid grid-cols-1 md:grid-cols-10 gap-4 mb-6">
           {[
             { label: 'Total Requests', value: repairRequests.length, color: Brand.primary, show: globalFilter === 'all' || globalFilter === 'repair_requests' },
             { label: 'Pending', value: repairRequests.filter(r => r.status === 'Pending').length, color: Brand.accent, show: globalFilter === 'all' || globalFilter === 'repair_requests' },
             { label: 'Waiting for Customer', value: repairRequests.filter(r => r.status === 'Approved').length, color: Brand.secondary, show: globalFilter === 'all' || globalFilter === 'repair_requests' },
             { label: 'Customer Approved', value: repairRequests.filter(r => r.status === 'Customer Approved').length, color: '#10B981', show: globalFilter === 'all' || globalFilter === 'repair_requests' },
             { label: 'Customer Rejected', value: repairRequests.filter(r => r.status === 'Customer Rejected').length, color: '#EF4444', show: globalFilter === 'all' || globalFilter === 'repair_requests' },
             { label: 'Rejected', value: repairRequests.filter(r => r.status === 'Rejected').length, color: '#DC2626', show: globalFilter === 'all' || globalFilter === 'repair_requests' },
             { label: 'In Repair', value: repairRequests.filter(r => r.status === 'In Repair').length, color: '#3B82F6', show: globalFilter === 'all' || globalFilter === 'repair_requests' },
             { label: 'Halfway Completed', value: repairRequests.filter(r => r.status === 'Halfway Completed').length, color: '#F59E0B', show: globalFilter === 'all' || globalFilter === 'repair_requests' },
             { label: 'Total Technicians', value: technicians.length, color: '#7C3AED', show: globalFilter === 'all' || globalFilter === 'technicians' },
             { label: 'Available Technicians', value: technicians.filter(t => t.available === true).length, color: '#059669', show: globalFilter === 'all' || globalFilter === 'technicians' }
           ].filter(stat => stat.show).map((stat, index) => (
             <div key={index} className="bg-white rounded-xl shadow-md p-6">
               <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
               <div className="text-sm" style={{ color: Brand.body }}>{stat.label}</div>
             </div>
           ))}
         </div>

                                   {/* Filters */}
          {(globalFilter === 'all' || globalFilter === 'repair_requests') && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Status Filter */}
             <div>
               <h3 className="text-sm font-semibold mb-3" style={{ color: Brand.primary }}>Status Filter</h3>
               <select 
                 value={filter} 
                 onChange={(e) => setFilter(e.target.value)}
                 className="w-full px-3 py-2 border rounded-lg text-sm"
                 style={{ borderColor: Brand.secondary, color: Brand.body }}
               >
                 <option value="all">All Statuses</option>
                 <option value="Pending">Pending</option>
                 <option value="Approved">Approved (Waiting for Customer)</option>
                 <option value="Customer Approved">Customer Approved</option>
                 <option value="Customer Rejected">Customer Rejected</option>
                 <option value="In Repair">In Repair</option>
                 <option value="Halfway Completed">Halfway Completed</option>
                 <option value="Ready for Pickup">Ready for Pickup</option>
                 <option value="Rejected">Rejected</option>
               </select>
             </div>

             {/* Equipment Type Filter */}
             <div>
               <h3 className="text-sm font-semibold mb-3" style={{ color: Brand.primary }}>Equipment Type</h3>
               <select 
                 value={searchFilter} 
                 onChange={(e) => setSearchFilter(e.target.value)}
                 className="w-full px-3 py-2 border rounded-lg text-sm"
                 style={{ borderColor: Brand.secondary, color: Brand.body }}
               >
                 <option value="all">All Equipment Types</option>
                 <option value="cricket_bat">Cricket Bat</option>
                 <option value="cricket_ball">Cricket Ball</option>
                 <option value="cricket_gloves">Cricket Gloves</option>
                 <option value="cricket_pads">Cricket Pads</option>
                 <option value="cricket_helmet">Cricket Helmet</option>
               </select>
             </div>

                                                                                                               {/* Damage Type Filter */}
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: Brand.primary }}>Damage Type</h3>
                  <select 
                    value={requestSearchTerm} 
                    onChange={(e) => setRequestSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: Brand.secondary, color: Brand.body }}
                  >
                    <option value="">All Damage Types</option>
                    <option value="Bat Handle Damage">Bat Handle Damage</option>
                    <option value="Bat Surface Crack">Bat Surface Crack</option>
                    <option value="Ball Stitch Damage">Ball Stitch Damage</option>
                    <option value="Gloves Tear">Gloves Tear</option>
                    <option value="Pads Crack">Pads Crack</option>
                    <option value="Helmet Damage">Helmet Damage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
           </div>

                                               {/* Clear Filters Button */}
             <div className="mt-4 pt-4 border-t" style={{ borderColor: Brand.light }}>
                               <button
                                     onClick={() => {
                     setFilter('all');
                     setSearchFilter('all');
                     setRequestSearchTerm('');
                     setTechnicianSearchTerm('');
                     setRequestSearchFilter('all');
                     setTechnicianSearchFilter('all');
                                           setTechnicianAvailabilityFilter('available');
                     setGlobalFilter('all');
                     loadData();
                   }}
                 className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                 style={{ backgroundColor: Brand.accent }}
               >
                 Clear All Filters
               </button>
             </div>
           </div>
         )}

                 {/* Requests Table */}
         {(globalFilter === 'all' || globalFilter === 'repair_requests') && (
           <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
           <div className="px-6 py-4 border-b" style={{ borderColor: Brand.light }}>
             <div className="flex justify-between items-center mb-4">
                               <div>
                  <h2 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                    Repair Requests ({filteredRequests.length})
                  </h2>
                  <p className="text-sm" style={{ color: Brand.body }}>
                    Debug: Total requests loaded: {repairRequests.length} | 
                    Status filter: {filter} | 
                    Equipment filter: {searchFilter} | 
                    Damage filter: {requestSearchTerm || 'All'}
                  </p>
                </div>
                
               
             </div>
           </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm" style={{ backgroundColor: Brand.light }}>
                                     <th className="px-6 py-3" style={{ color: Brand.body }}>Customer</th>
                   <th className="px-6 py-3" style={{ color: Brand.body }}>Equipment</th>
                   <th className="px-6 py-3" style={{ color: Brand.body }}>Damage</th>
                   <th className="px-6 py-3" style={{ color: Brand.body }}>Progress</th>
                   <th className="px-6 py-3 w-48" style={{ color: Brand.body }}>Status</th>
                   <th className="px-6 py-3" style={{ color: Brand.body }}>Date</th>
                   <th className="px-6 py-3" style={{ color: Brand.body }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="border-t" style={{ borderColor: Brand.light }}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium" style={{ color: Brand.body }}>{request.customerId?.username || 'Unknown'}</div>
                        <div className="text-sm" style={{ color: Brand.secondary }}>{request.customerId?.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: Brand.body }}>
                      {(() => {
                        // Smart equipment detection based on damage type
                        if (request.equipmentType && request.equipmentType !== '') {
                          return request.equipmentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        }
                        if (request.damageType) {
                          const damage = request.damageType.toLowerCase();
                          if (damage.includes('bat')) return 'Cricket Bat';
                          if (damage.includes('ball')) return 'Cricket Ball';
                          if (damage.includes('gloves')) return 'Cricket Gloves';
                          if (damage.includes('pads')) return 'Cricket Pads';
                          if (damage.includes('helmet')) return 'Cricket Helmet';
                        }
                        return 'Cricket Equipment';
                      })()}
                    </td>
                    <td className="px-6 py-4" style={{ color: Brand.body }}>
                      {request.damageType}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium" style={{ color: Brand.body }}>
                            {request.repairProgress || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${request.repairProgress || 0}%`,
                              backgroundColor: request.repairProgress >= 75 ? '#10B981' : 
                                              request.repairProgress >= 50 ? '#3B82F6' : 
                                              request.repairProgress >= 25 ? '#F59E0B' : '#EF4444'
                            }}
                          ></div>
                        </div>
                        {request.currentStage && (
                          <div className="text-xs" style={{ color: Brand.secondary }}>
                            {request.currentStage}
                          </div>
                        )}
                      </div>
                    </td>
                                         <td className="px-6 py-4 w-48">
                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                         {request.status ? request.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}
                       </span>
                     </td>
                    <td className="px-6 py-4" style={{ color: Brand.body }}>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {/* Assign button - only for Customer Approved requests */}
                        {request.status === 'Customer Approved' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowAssignmentModal(true);
                            }}
                            className="px-3 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: Brand.accent }}
                          >
                            Assign Technician
                          </button>
                        )}
                        
                        {/* Approve button - only for Pending requests */}
                        {request.status === 'Pending' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApprovalModal(true);
                            }}
                            className="px-3 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: '#10B981' }}
                          >
                            Approve
                          </button>
                        )}
                        
                        {/* Reject button - only for Pending requests */}
                        {request.status === 'Pending' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectionModal(true);
                            }}
                            className="px-3 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: '#EF4444' }}
                          >
                            Reject
                          </button>
                        )}
                        
                        {/* Status indicators for other states */}
                        {request.status === 'Approved' && (
                          <span className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-800">
                            Waiting for Customer
                          </span>
                        )}
                        
                        {request.status === 'Customer Approved' && (
                          <span className="px-3 py-1 rounded text-sm bg-green-100 text-green-800">
                            Ready to Assign
                          </span>
                        )}
                        
                        {request.status === 'Customer Rejected' && (
                          <span className="px-3 py-1 rounded text-sm bg-orange-100 text-orange-800">
                            Customer Rejected
                          </span>
                        )}
                        
                        {request.status === 'Rejected' && (
                          <span className="px-3 py-1 rounded text-sm bg-red-100 text-red-800">
                            Rejected
                          </span>
                        )}
                        
                        {/* In Repair status - show assigned technician */}
                        {request.status === 'In Repair' && request.assignedTechnician && (
                          <div className="text-sm">
                            <span className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-800 mb-1 block">
                              In Repair
                            </span>
                            <span className="text-xs text-gray-600">
                              Technician Assigned
                            </span>
                          </div>
                        )}
                        
                        {/* In Repair status - no technician assigned (fallback) */}
                        {request.status === 'In Repair' && !request.assignedTechnician && (
                          <span className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-800">
                            In Repair
                          </span>
                        )}
                        
                        {/* Halfway Completed status - show assigned technician */}
                        {request.status === 'Halfway Completed' && request.assignedTechnician && (
                          <div className="text-sm">
                            <span className="px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800 mb-1 block">
                              Halfway Completed
                            </span>
                            <span className="text-xs text-gray-600">
                              Technician Assigned
                            </span>
                          </div>
                        )}
                        
                        {/* Halfway Completed status - no technician assigned (fallback) */}
                        {request.status === 'Halfway Completed' && !request.assignedTechnician && (
                          <span className="px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                            Halfway Completed
                          </span>
                        )}
                        
                                                 {/* Ready for Pickup status - show assigned technician */}
                         {request.status === 'Ready for Pickup' && request.assignedTechnician && (
                           <div className="text-sm">
                             <span className="px-3 py-1 rounded text-sm bg-green-100 text-green-800 mb-1 block">
                               Ready for Pickup
                             </span>
                             <span className="text-xs text-gray-600">
                               Technician Assigned
                             </span>
                           </div>
                         )}
                         
                         {/* Ready for Pickup status - no technician assigned (fallback) */}
                         {request.status === 'Ready for Pickup' && !request.assignedTechnician && (
                           <span className="px-3 py-1 rounded text-sm bg-green-100 text-green-800">
                             Ready for Pickup
                           </span>
                         )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

                                   {/* Technicians Table */}
          {(globalFilter === 'all' || globalFilter === 'technicians') && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: Brand.light }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                    Technicians ({filteredTechnicians.length})
                  </h2>
                  <p className="text-sm" style={{ color: Brand.body }}>
                    Manage technician assignments and availability
                  </p>
                </div>
                                 <div className="flex items-center space-x-3">
                   <div className="flex items-center space-x-2">
                     <select
                       value={technicianAvailabilityFilter}
                       onChange={(e) => setTechnicianAvailabilityFilter(e.target.value)}
                       className="px-3 py-2 border rounded-lg text-sm"
                       style={{ borderColor: Brand.secondary, color: Brand.body }}
                     >
                                               <option value="available">Available Only</option>
                        <option value="all">All Technicians</option>
                        <option value="unavailable">Unavailable Only</option>
                     </select>
                   </div>
                                     <button
                    onClick={() => navigate('/new-technician')}
                    className="px-4 py-2 rounded-lg text-white font-semibold"
                    style={{ backgroundColor: Brand.accent }}
                  >
                    Add New Technician
                  </button>
                </div>
                            </div>
           </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm" style={{ backgroundColor: Brand.light }}>
                  <th className="px-6 py-3" style={{ color: Brand.body }}>Technician</th>
                  <th className="px-6 py-3" style={{ color: Brand.body }}>Contact</th>
                  <th className="px-6 py-3" style={{ color: Brand.body }}>Skills</th>
                  <th className="px-6 py-3" style={{ color: Brand.body }}>Status</th>
                  <th className="px-6 py-3" style={{ color: Brand.body }}>Actions</th>
                </tr>
              </thead>
                             <tbody>
                 {filteredTechnicians.map((technician) => (
                  <tr key={technician._id} className="border-t" style={{ borderColor: Brand.light }}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium" style={{ color: Brand.body }}>
                          {technician.technicianId?.firstName} {technician.technicianId?.lastName}
                        </div>
                        <div className="text-sm" style={{ color: Brand.secondary }}>
                          @{technician.technicianId?.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm" style={{ color: Brand.body }}>
                          {technician.technicianId?.email}
                        </div>
                        <div className="text-sm" style={{ color: Brand.secondary }}>
                          {technician.technicianId?.contactNumber || 'No phone'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {technician.skills && technician.skills.length > 0 ? (
                          technician.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 rounded-full text-xs font-medium border"
                              style={{ 
                                backgroundColor: Brand.secondary + '20', 
                                color: Brand.primary,
                                borderColor: Brand.secondary
                              }}
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">No skills listed</span>
                        )}
                      </div>
                      {/* Debug info - remove this later */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-400 mt-1">
                          Skills count: {technician.skills ? technician.skills.length : 0}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        technician.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {technician.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                                                 <button
                           onClick={() => {
                             setSelectedTechnician(technician);
                             setShowTechnicianDetailsModal(true);
                           }}
                           className="px-3 py-1 rounded text-white text-sm"
                           style={{ backgroundColor: Brand.secondary }}
                         >
                           View Details
                         </button>
                         <button
                           onClick={() => handleDeleteTechnician(technician._id)}
                           disabled={deletingTechnician === technician._id}
                           className={`px-3 py-1 rounded text-white text-sm transition-colors ${
                             deletingTechnician === technician._id ? 'opacity-50 cursor-not-allowed' : ''
                           }`}
                                                       style={{ backgroundColor: Brand.accent }}
                         >
                           {deletingTechnician === technician._id ? 'Deleting...' : 'Delete'}
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
                                 {filteredTechnicians.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="text-gray-500">
                        <div className="text-lg mb-2">No technicians found</div>
                        <div className="text-sm">Add your first technician to get started</div>
                      </div>
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: Brand.secondary }}></div>
                        <div className="text-sm">Loading technicians...</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>



      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4" style={{ color: Brand.primary }}>Assign Technician</h3>
            
            {/* Request Details */}
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: Brand.light }}>
              <h4 className="font-semibold mb-2" style={{ color: Brand.primary }}>Request Details</h4>
              <p className="text-sm" style={{ color: Brand.body }}>
                <strong>Equipment:</strong> {(() => {
                  // Smart equipment detection based on damage type
                  if (selectedRequest?.equipmentType && selectedRequest.equipmentType !== '') {
                    return selectedRequest.equipmentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                  }
                  if (selectedRequest?.damageType) {
                    const damage = selectedRequest.damageType.toLowerCase();
                    if (damage.includes('bat')) return 'Cricket Bat';
                    if (damage.includes('ball')) return 'Cricket Ball';
                    if (damage.includes('gloves')) return 'Cricket Gloves';
                    if (damage.includes('pads')) return 'Cricket Pads';
                    if (damage.includes('helmet')) return 'Cricket Helmet';
                  }
                  return 'Cricket Equipment';
                })()}
              </p>
              <p className="text-sm" style={{ color: Brand.body }}>
                <strong>Damage:</strong> {selectedRequest?.damageType}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Select Technician</label>
                <select
                  value={assignmentData.technicianId}
                  onChange={(e) => setAssignmentData({...assignmentData, technicianId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                                     <option value="">Choose a qualified technician</option>
                   {filteredTechnicians.filter(tech => tech.available === true).map(tech => {
                    const hasRelevantSkill = tech.skills?.some(skill => 
                      skill.toLowerCase().includes(selectedRequest?.equipmentType ? selectedRequest.equipmentType.replace('_', ' ').toLowerCase() : '') ||
                      skill.toLowerCase().includes('general') ||
                      skill.toLowerCase().includes('all')
                    );
                    
                    return (
                      <option 
                        key={tech._id} 
                        value={tech._id}
                        className={hasRelevantSkill ? 'font-medium' : 'text-gray-500'}
                      >
                        {tech.technicianId?.username || tech.name} 
                        {tech.skills?.length > 0 && ` - ${tech.skills.join(', ')}`}
                        {!hasRelevantSkill && ' (Not specialized)'}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs mt-1" style={{ color: Brand.secondary }}>
                  Only available technicians are shown. Skills matching the equipment type are highlighted.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Assignment Notes</label>
                <textarea
                  value={assignmentData.notes}
                  onChange={(e) => {
                    const newNotes = e.target.value;
                    setAssignmentData({...assignmentData, notes: newNotes});
                    const error = validateAssignmentNotes(newNotes);
                    setAssignmentNotesError(error);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    assignmentNotesError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows="3"
                  placeholder="Special instructions or priority notes for the technician..."
                />
                {assignmentNotesError && (
                  <p className="text-red-500 text-sm mt-1">{assignmentNotesError}</p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setAssignmentData({ technicianId: '', notes: '' });
                  setAssignmentNotesError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                style={{ color: Brand.body }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTechnician}
                className="flex-1 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: Brand.accent }}
              >
                Assign Technician
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4" style={{ color: Brand.primary }}>Approve Request & Send Estimate</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Estimated Cost (Rs)</label>
                <input
                  type="text"
                  value={approvalData.cost}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
                    setApprovalData({...approvalData, cost: value});
                    if (approvalErrors.cost) {
                      setApprovalErrors({...approvalErrors, cost: ''});
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    approvalErrors.cost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter estimated cost (numbers only)"
                  required
                />
                {approvalErrors.cost && (
                  <p className="text-red-500 text-sm mt-1">{approvalErrors.cost}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Time Estimate (Days)</label>
                <input
                  type="text"
                  value={approvalData.timeEstimate}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
                    setApprovalData({...approvalData, timeEstimate: value});
                    if (approvalErrors.timeEstimate) {
                      setApprovalErrors({...approvalErrors, timeEstimate: ''});
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    approvalErrors.timeEstimate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter days (1-30)"
                  required
                />
                {approvalErrors.timeEstimate && (
                  <p className="text-red-500 text-sm mt-1">{approvalErrors.timeEstimate}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">Enter number of days between 1 and 30</p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalData({ cost: '', timeEstimate: '' });
                  setApprovalErrors({ cost: '', timeEstimate: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                style={{ color: Brand.body }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (validateApprovalData()) {
                    await handleStatusUpdate(
                      selectedRequest._id, 
                      'approved', 
                      approvalData.cost, 
                      approvalData.timeEstimate
                    );
                    setShowApprovalModal(false);
                    setApprovalData({ cost: '', timeEstimate: '' });
                    setApprovalErrors({ cost: '', timeEstimate: '' });
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: '#10B981' }}
              >
                Approve & Send Estimate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4" style={{ color: Brand.primary }}>Reject Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Rejection Reason</label>
                <textarea
                  value={rejectionData.reason}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRejectionData({...rejectionData, reason: value});
                    // Clear error when user starts typing
                    if (rejectionErrors.reason) {
                      setRejectionErrors({...rejectionErrors, reason: ''});
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg ${rejectionErrors.reason ? 'border-red-500' : 'border-gray-300'}`}
                  rows="3"
                  placeholder="Please provide a reason for rejection (5-500 characters, no special characters or repeated letters/numbers)..."
                  required
                />
                {rejectionErrors.reason && <p className="text-red-500 text-sm mt-1">{rejectionErrors.reason}</p>}
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionData({ reason: '' });
                  setRejectionErrors({ reason: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                style={{ color: Brand.body }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Validate rejection reason before submitting
                  const reasonError = validateRejectionReason(rejectionData.reason);
                  if (reasonError) {
                    setRejectionErrors({ reason: reasonError });
                    return;
                  }
                  
                  await handleStatusUpdate(
                    selectedRequest._id, 
                    'rejected', 
                    '', 
                    '', 
                    rejectionData.reason
                  );
                  setShowRejectionModal(false);
                  setRejectionData({ reason: '' });
                  setRejectionErrors({ reason: '' });
                }}
                className="flex-1 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: '#EF4444' }}
              >
                Reject Request
              </button>
            </div>
          </div>
                 </div>
       )}

       {/* Technician Details Modal */}
       {showTechnicianDetailsModal && selectedTechnician && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                 Technician Details
               </h3>
               <button
                 onClick={() => {
                   setShowTechnicianDetailsModal(false);
                   setSelectedTechnician(null);
                 }}
                 className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
               >
                 ×
               </button>
             </div>

             <div className="space-y-6">
               {/* Personal Information */}
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-lg font-semibold mb-3" style={{ color: Brand.primary }}>
                   Personal Information
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>
                       Full Name
                     </label>
                     <p className="text-sm" style={{ color: Brand.body }}>
                       {selectedTechnician.technicianId?.firstName} {selectedTechnician.technicianId?.lastName}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>
                       Username
                     </label>
                     <p className="text-sm" style={{ color: Brand.body }}>
                       @{selectedTechnician.technicianId?.username}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>
                       Email
                     </label>
                     <p className="text-sm" style={{ color: Brand.body }}>
                       {selectedTechnician.technicianId?.email}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>
                       Phone Number
                     </label>
                     <p className="text-sm" style={{ color: Brand.body }}>
                       {selectedTechnician.technicianId?.contactNumber || 'Not provided'}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Skills */}
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-lg font-semibold mb-3" style={{ color: Brand.primary }}>
                   Skills & Expertise
                 </h4>
                 <div>
                   {selectedTechnician.skills && selectedTechnician.skills.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                       {selectedTechnician.skills.map((skill, index) => (
                         <span
                           key={index}
                           className="px-3 py-2 rounded-full text-sm font-medium border"
                           style={{ 
                             backgroundColor: Brand.secondary + '20', 
                             color: Brand.primary,
                             borderColor: Brand.secondary
                           }}
                         >
                           {skill}
                         </span>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500 italic">No skills listed</p>
                   )}
                 </div>
               </div>

               {/* Status & Availability */}
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-lg font-semibold mb-3" style={{ color: Brand.primary }}>
                   Status & Availability
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>
                       Current Status
                     </label>
                     <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                       selectedTechnician.available 
                         ? 'bg-green-100 text-green-800' 
                         : 'bg-red-100 text-red-800'
                     }`}>
                       {selectedTechnician.available ? 'Available' : 'Unavailable'}
                     </span>
                   </div>
                   <div>
                     <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>
                       Technician ID
                     </label>
                     <p className="text-sm font-mono text-gray-600">
                       {selectedTechnician._id}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Additional Information */}
               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-lg font-semibold mb-3" style={{ color: Brand.primary }}>
                   Additional Information
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>
                       User Role
                     </label>
                     <p className="text-sm" style={{ color: Brand.body }}>
                       {selectedTechnician.technicianId?.role || 'Technician'}
                     </p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium mb-1" style={{ color: Brand.body }}>
                       Account Status
                     </label>
                     <p className="text-sm" style={{ color: Brand.body }}>
                       {selectedTechnician.technicianId?.status || 'Active'}
                     </p>
                   </div>
                 </div>
               </div>
             </div>

             <div className="flex justify-end mt-6 pt-4 border-t" style={{ borderColor: Brand.light }}>
               <button
                 onClick={() => {
                   setShowTechnicianDetailsModal(false);
                   setSelectedTechnician(null);
                 }}
                 className="px-6 py-2 rounded-lg text-white font-medium"
                 style={{ backgroundColor: Brand.accent }}
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
         </main>
       <Footer />
       </div>
     );
   };

export default ServiceManagerDashboard;
