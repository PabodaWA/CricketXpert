import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAllTechnicians, getAllRepairRequests, updateTaskProgress, getTechnicianTasks, getTechnicianEstimateData, getTechnicianNotifications } from '../api/repairRequestApi';
import { updateTechnician } from '../api/technicianApi';
import { getCurrentUser } from '../utils/getCurrentUser';
import Brand from '../brand';
import TechnicianNotifications from '../components/TechnicianNotifications';

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const [currentTechnician, setCurrentTechnician] = useState(null);
  const [repairRequests, setRepairRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [globalFilter, setGlobalFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingTechnician, setDeletingTechnician] = useState(null);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    skills: [],
    available: true
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [progressData, setProgressData] = useState({
    repairProgress: 0,
    notes: ''
  });
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [progressNotesError, setProgressNotesError] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [estimateData, setEstimateData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const SKILL_OPTIONS = [
    'Cricket Bat Repair',
    'Cricket Ball Repair',
    'Gloves Repair',
    'Pads Repair',
    'Helmet Repair',
    'General Equipment',
    'All Equipment Types'
  ];

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    loadCurrentTechnician();
    
    // Cleanup on unmount
    return () => {
      if (window.technicianDashboard) {
        delete window.technicianDashboard;
      }
    };
  }, []);

  // Load repairs after technician is loaded
  useEffect(() => {
    if (currentTechnician) {
      loadTechnicianRepairs();
      loadEstimateData();
      loadNotifications();
    }
  }, [currentTechnician]);

  const loadCurrentTechnician = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Get all technicians and find the current user's technician profile
      const response = await getAllTechnicians();
      const technician = response.data.find(t => 
        t.technicianId?._id === currentUser._id || 
        t.technicianId?.username === currentUser.username
      );
      
      if (technician) {
        setCurrentTechnician(technician);
      } else {
        console.error('Technician profile not found for current user');
        alert('Technician profile not found. Please contact administrator.');
        setTimeout(() => {
          try {
            // Clear any auth/session info so guards don't bounce us back
            localStorage.removeItem('cx_current_user');
            localStorage.removeItem('userInfo');
            navigate('/login', { replace: true });
          } catch (e) {
            localStorage.removeItem('cx_current_user');
            localStorage.removeItem('userInfo');
            window.location.replace('/login');
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error loading current technician:', error);
      alert('Error loading technician profile. Please try again.');
      setTimeout(() => {
        try {
          localStorage.removeItem('cx_current_user');
          localStorage.removeItem('userInfo');
          navigate('/login', { replace: true });
        } catch (e) {
          localStorage.removeItem('cx_current_user');
          localStorage.removeItem('userInfo');
          window.location.replace('/login');
        }
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicianRepairs = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      // First, we need to get the technician profile to get the technician ID
      // The assignedTechnician field in RepairRequest references the Technician collection, not User
      if (!currentTechnician) {
        console.log('Current technician not loaded yet, skipping repair requests load');
        return;
      }

      // Use the technician's _id (from Technician collection) to get repairs
      const response = await axios.get(`http://localhost:5000/api/repairs/dashboard/technician/${currentTechnician._id}`);
      console.log('Technician repair requests data:', response.data);
      setRepairRequests(response.data || []);
    } catch (error) {
      console.error('Error loading technician repair requests:', error);
      setRepairRequests([]);
    }
  };

  const loadEstimateData = async () => {
    try {
      setLoadingEstimates(true);
      const response = await getTechnicianEstimateData(currentTechnician._id);
      setEstimateData(response.data);
    } catch (error) {
      console.error('Error loading estimate data:', error);
      setEstimateData(null);
    } finally {
      setLoadingEstimates(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await getTechnicianNotifications(currentTechnician._id);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const handleAvailabilityToggle = async (technicianId, currentAvailability) => {
    try {
      const newAvailability = !currentAvailability;
      await updateTechnician(technicianId, { available: newAvailability });
      await loadCurrentTechnician(); // Reload to get updated data
      
      // Update Service Manager Dashboard if it's open
      if (window.serviceManagerDashboard && window.serviceManagerDashboard.loadData) {
        window.serviceManagerDashboard.loadData();
      }
      
      alert(`Availability updated to ${newAvailability ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability');
    }
  };

  // Remove delete functionality for technician dashboard - technicians shouldn't delete themselves

  const handleEditTechnician = (technician) => {
    setEditingTechnician(technician);
    setEditFormData({
      skills: technician.skills || [],
      available: technician.available
    });
    setShowEditModal(true);
  };

  const handleSkillChange = (skill) => {
    setEditFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSaveEdit = async () => {
    try {
      await updateTechnician(editingTechnician._id, editFormData);
      await loadCurrentTechnician();
      
      // Update Service Manager Dashboard if it's open
      if (window.serviceManagerDashboard && window.serviceManagerDashboard.loadData) {
        window.serviceManagerDashboard.loadData();
      }
      
      setShowEditModal(false);
      setEditingTechnician(null);
      alert('Technician updated successfully!');
    } catch (error) {
      console.error('Error updating technician:', error);
      alert('Failed to update technician');
    }
  };

  // Since we only show current technician, no need for filtering

  // Since we're only loading current technician's repairs, no need for complex filtering
  const filteredAssignedRepairRequests = repairRequests.filter(request => {
    // Filter by status if needed
    if (statusFilter !== 'all') {
      return request.status === statusFilter;
    }
    return true;
  });

  // No need for technician filtering since we only show current technician's repairs

  // Debug: Log repair requests when they change
  useEffect(() => {
    console.log('Repair requests updated:', repairRequests);
    repairRequests.forEach(request => {
      console.log(`Request ${request._id}: Status=${request.status}, Progress=${request.repairProgress}%`);
    });
  }, [repairRequests]);

  // Handle clicks outside the notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications) {
        const dropdown = document.querySelector('.notifications-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
          setShowNotifications(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Handle progress update
  // Validate progress notes for repeated characters
  const validateProgressNotes = (notes) => {
    if (!notes || notes.length < 4) return '';
    
    // Check for repeated letters (3 or more same letters in a row)
    const letterPattern = /(.)\1{2,}/;
    if (letterPattern.test(notes)) {
      return 'Progress notes cannot contain 3 or more repeated letters in a row (e.g., "aaa", "bbb")';
    }
    
    // Check for repeated numbers (3 or more same numbers in a row)
    const numberPattern = /(\d)\1{2,}/;
    if (numberPattern.test(notes)) {
      return 'Progress notes cannot contain 3 or more repeated numbers in a row (e.g., "111", "222")';
    }
    
    return '';
  };

  const handleProgressUpdate = (request) => {
    setSelectedRequest(request);
    setProgressData({
      repairProgress: request.repairProgress || 0,
      notes: ''
    });
    setProgressNotesError('');
    setShowProgressModal(true);
  };

  const handleSaveProgress = async () => {
    if (!selectedRequest) return;
    
    // Validate progress notes before saving
    if (progressNotesError) {
      alert('Please fix the progress notes errors before saving.');
      return;
    }
    
    setUpdatingProgress(true);
    try {
      const response = await updateTaskProgress(selectedRequest._id, progressData);
      console.log('Progress update response:', response.data);
      
      // Update the local state immediately with the response data
      setRepairRequests(prevRequests => {
        const updatedRequests = prevRequests.map(request => 
          request._id === selectedRequest._id 
            ? { 
                ...request, 
                ...response.data.request,
                status: response.data.request.status,
                repairProgress: response.data.request.repairProgress,
                currentStage: response.data.request.currentStage
              }
            : request
        );
        console.log('Updated repair requests:', updatedRequests);
        console.log('Response data:', response.data.request);
        console.log('Status from response:', response.data.request.status);
        return updatedRequests;
      });
      
      // Also reload from server to ensure consistency
      await loadTechnicianRepairs();
      await loadEstimateData();
      await loadNotifications();
      
      // Update Service Manager Dashboard if it's open
      if (window.serviceManagerDashboard && window.serviceManagerDashboard.loadData) {
        window.serviceManagerDashboard.loadData();
      }
      
      // Update Customer Dashboard if it's open
      if (window.customerDashboard && window.customerDashboard.loadCustomerRequests) {
        window.customerDashboard.loadCustomerRequests();
      }
      
      setShowProgressModal(false);
      setSelectedRequest(null);
      
      // Show success message with milestone info if applicable
      if (response.data.isMilestone) {
        alert(`Progress updated successfully! 🎉\n\nMilestone reached: ${response.data.milestoneMessage}\n\nCustomer has been notified.`);
      } else {
        alert('Progress updated successfully! Customer has been notified.');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to update progress. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 25) return '#EF4444'; // Red
    if (progress < 50) return '#F59E0B'; // Yellow
    if (progress < 75) return '#3B82F6'; // Blue
    return '#10B981'; // Green
  };

  const getProgressStage = (progress) => {
    if (progress === 0) return 'Not Started';
    if (progress < 25) return 'Repair Started';
    if (progress < 50) return 'In Progress';
    if (progress < 75) return 'Halfway Completed';
    if (progress < 100) return 'Almost Complete';
    return 'Ready for Pickup';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Repair': return 'bg-blue-100 text-blue-800';
      case 'Halfway Completed': return 'bg-yellow-100 text-yellow-800';
      case 'Ready for Pickup': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Customer Approved': return 'bg-green-100 text-green-800';
      case 'Customer Rejected': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              onClick={() => setGlobalFilter('technicians')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-3 ${
                globalFilter === 'technicians' 
                  ? 'text-white' 
                  : 'text-gray-700 hover:text-white'
              }`}
              onMouseOver={(e) => { 
                if (globalFilter !== 'technicians') {
                  e.currentTarget.style.backgroundColor = '#42ADF5'; 
                }
              }}
              onMouseOut={(e) => { 
                if (globalFilter !== 'technicians') {
                  e.currentTarget.style.backgroundColor = 'transparent'; 
                }
              }}
              style={{
                backgroundColor: globalFilter === 'technicians' ? '#42ADF5' : 'transparent'
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Technician Details</span>
            </button>
            <button
              onClick={() => setGlobalFilter('repair_requests')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-3 ${
                globalFilter === 'repair_requests' 
                  ? 'text-white' 
                  : 'text-gray-700 hover:text-white'
              }`}
              onMouseOver={(e) => { 
                if (globalFilter !== 'repair_requests') {
                  e.currentTarget.style.backgroundColor = '#42ADF5'; 
                }
              }}
              onMouseOut={(e) => { 
                if (globalFilter !== 'repair_requests') {
                  e.currentTarget.style.backgroundColor = 'transparent'; 
                }
              }}
              style={{
                backgroundColor: globalFilter === 'repair_requests' ? '#42ADF5' : 'transparent'
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Assign Repair Request</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative notifications-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-between group ${
                  showNotifications 
                    ? 'text-white shadow-md' 
                    : 'text-gray-700 hover:text-white hover:shadow-sm'
                }`}
                onMouseOver={(e) => { 
                  if (!showNotifications) {
                    e.currentTarget.style.backgroundColor = '#42ADF5'; 
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => { 
                  if (!showNotifications) {
                    e.currentTarget.style.backgroundColor = 'transparent'; 
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
                style={{
                  backgroundColor: showNotifications ? '#42ADF5' : 'transparent'
                }}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h16a1 1 0 00.707-1.707L20 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 104 0" />
                  </svg>
                  <span className="font-medium">Notifications</span>
                </div>
                {notifications.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2.5 py-1 min-w-[20px] text-center font-semibold shadow-sm border border-red-400">
                      {notifications.length}
                    </span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${showNotifications ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </button>
              
              {/* Dropdown Content */}
              {showNotifications && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto backdrop-blur-sm">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                        <div className="w-6 h-6 mr-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h16a1 1 0 00.707-1.707L20 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 104 0" />
                          </svg>
                        </div>
                        Notifications
                      </h3>
                      <span className="text-xs text-slate-600 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 rounded-full font-medium border border-blue-200">
                        {notifications.length}
                      </span>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <div 
                          key={index} 
                          className="p-4 border-b border-slate-100 last:border-b-0 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group cursor-pointer"
                          onClick={() => {
                            // Mark individual notification as read by removing it from the array
                            const updatedNotifications = notifications.filter((_, i) => i !== index);
                            setNotifications(updatedNotifications);
                            
                            // If no notifications left, close the dropdown
                            if (updatedNotifications.length === 0) {
                              setShowNotifications(false);
                            }
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Notification Icon with Type-based Colors */}
                            <div className="flex-shrink-0 mt-1">
                              {(() => {
                                const type = notification.type || 'info';
                                const iconConfig = {
                                  repair: { 
                                    bg: 'from-orange-400 to-red-500', 
                                    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                                    label: 'Repair'
                                  },
                                  urgent: { 
                                    bg: 'from-red-500 to-pink-600', 
                                    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
                                    label: 'Urgent'
                                  },
                                  completed: { 
                                    bg: 'from-green-400 to-emerald-500', 
                                    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                                    label: 'Completed'
                                  },
                                  info: { 
                                    bg: 'from-blue-400 to-indigo-500', 
                                    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                                    label: 'Info'
                                  },
                                  warning: { 
                                    bg: 'from-yellow-400 to-orange-500', 
                                    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
                                    label: 'Warning'
                                  }
                                };
                                const config = iconConfig[type] || iconConfig.info;
                                
                                return (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${config.bg} shadow-sm`}>
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                                    </svg>
                                  </div>
                                );
                              })()}
                            </div>
                            
                            {/* Notification Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                                    {notification.title || 'New Notification'}
                                  </h4>
                                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                    {notification.message || 'You have a new notification'}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Time */}
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-slate-500 flex items-center bg-slate-100 px-2 py-1 rounded-md">
                                  <svg className="w-3 h-3 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'Just now'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h16a1 1 0 00.707-1.707L20 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 104 0" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-slate-700 mb-1">No notifications</h3>
                        <p className="text-xs text-slate-500">You're all caught up!</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-b-xl">
                      <button 
                        className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:bg-blue-100 py-2 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={async () => {
                          setMarkingAllRead(true);
                          // Simulate a brief delay for better UX
                          await new Promise(resolve => setTimeout(resolve, 300));
                          // Mark all notifications as read by clearing the notifications array
                          setNotifications([]);
                          setShowNotifications(false);
                          setMarkingAllRead(false);
                        }}
                        disabled={markingAllRead}
                      >
                        {markingAllRead ? (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Marking...</span>
                          </div>
                        ) : (
                          'Mark all as read'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
              <h1 className="text-3xl font-bold" style={{ color: Brand.primary }}>Technician Dashboard</h1>
              <p className="mt-1" style={{ color: Brand.body }}>Manage your repair tasks and track progress</p>
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
                  <option value="technicians">Technicians Only</option>
                  <option value="repair_requests">Assigned Repair Requests Only</option>
                </select>
              </div>
              <div className="text-sm" style={{ color: Brand.body }}>
                Welcome back, {currentTechnician?.technicianId?.firstName || 'Technician'}!
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Technicians', value: currentTechnician ? 1 : 0, color: Brand.primary, show: globalFilter === 'all' || globalFilter === 'technicians' },
            { label: 'Available Technicians', value: currentTechnician && currentTechnician.available ? 1 : 0, color: '#10B981', show: globalFilter === 'all' || globalFilter === 'technicians' },
            { label: 'Unavailable Technicians', value: currentTechnician && !currentTechnician.available ? 1 : 0, color: '#EF4444', show: globalFilter === 'all' || globalFilter === 'technicians' },
            { label: 'Active Repairs', value: filteredAssignedRepairRequests.length, color: '#3B82F6', show: globalFilter === 'all' || globalFilter === 'repair_requests' }
          ].filter(stat => stat.show).map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-sm" style={{ color: Brand.body }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Current Technician Profile */}
        {currentTechnician && (globalFilter === 'all' || globalFilter === 'technicians') && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b" style={{ borderColor: Brand.light }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                    My Profile
                  </h2>
                  <p className="text-sm" style={{ color: Brand.body }}>
                    Manage your technician profile and availability
                  </p>
                </div>
                <button
                  onClick={() => handleEditTechnician(currentTechnician)}
                  className="px-4 py-2 rounded-lg text-white text-sm"
                  style={{ backgroundColor: Brand.secondary }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: Brand.primary }}>Personal Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium" style={{ color: Brand.body }}>Name: </span>
                      <span style={{ color: Brand.secondary }}>
                        {currentTechnician.technicianId?.firstName} {currentTechnician.technicianId?.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: Brand.body }}>Username: </span>
                      <span style={{ color: Brand.secondary }}>@{currentTechnician.technicianId?.username}</span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: Brand.body }}>Email: </span>
                      <span style={{ color: Brand.secondary }}>{currentTechnician.technicianId?.email}</span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: Brand.body }}>Phone: </span>
                      <span style={{ color: Brand.secondary }}>
                        {currentTechnician.technicianId?.contactNumber || 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: Brand.primary }}>Professional Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium" style={{ color: Brand.body }}>Status: </span>
                      <button
                        onClick={() => handleAvailabilityToggle(currentTechnician._id, currentTechnician.available)}
                        className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          currentTechnician.available 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {currentTechnician.available ? 'Available' : 'Unavailable'}
                      </button>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: Brand.body }}>Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {currentTechnician.skills && currentTechnician.skills.length > 0 ? (
                          currentTechnician.skills.map((skill, index) => (
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Repair Requests */}
        {(globalFilter === 'all' || globalFilter === 'repair_requests') && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                My Repair Requests ({filteredAssignedRepairRequests.length})
              </h2>
              <p className="text-sm" style={{ color: Brand.body }}>
                Repair requests assigned to you
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Status Filter Buttons */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: Brand.body }}>Status:</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    statusFilter === 'all'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={{
                    backgroundColor: statusFilter === 'all' ? Brand.primary : 'transparent',
                    border: statusFilter === 'all' ? 'none' : `1px solid ${Brand.secondary}`
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('In Repair')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    statusFilter === 'In Repair'
                      ? 'text-white'
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                  style={{
                    backgroundColor: statusFilter === 'In Repair' ? '#3B82F6' : 'transparent',
                    border: statusFilter === 'In Repair' ? 'none' : '1px solid #3B82F6'
                  }}
                >
                  In Repair
                </button>
                <button
                  onClick={() => setStatusFilter('Halfway Completed')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    statusFilter === 'Halfway Completed'
                      ? 'text-white'
                      : 'text-yellow-600 hover:text-yellow-800'
                  }`}
                  style={{
                    backgroundColor: statusFilter === 'Halfway Completed' ? '#F59E0B' : 'transparent',
                    border: statusFilter === 'Halfway Completed' ? 'none' : '1px solid #F59E0B'
                  }}
                >
                  Halfway Completed
                </button>
                <button
                  onClick={() => setStatusFilter('Ready for Pickup')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    statusFilter === 'Ready for Pickup'
                      ? 'text-white'
                      : 'text-green-600 hover:text-green-800'
                  }`}
                  style={{
                    backgroundColor: statusFilter === 'Ready for Pickup' ? '#10B981' : 'transparent',
                    border: statusFilter === 'Ready for Pickup' ? 'none' : '1px solid #10B981'
                  }}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: Brand.secondary }}></div>
                <p className="text-sm" style={{ color: Brand.body }}>Loading repair requests...</p>
              </div>
          ) : filteredAssignedRepairRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: Brand.primary }}>No Repairs Found</h3>
              <p style={{ color: Brand.body }}>
                {statusFilter !== 'all' 
                  ? `No ${statusFilter.toLowerCase()} repair requests found.`
                  : 'No repair requests are currently assigned to you.'
                }
              </p>
            </div>
            ) : (
                             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredAssignedRepairRequests.map((request) => (
                  <div key={request._id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1" style={{ color: Brand.primary }}>
                            {request.customerId?.username || 'Unknown Customer'}
                          </h3>
                          <p className="text-sm" style={{ color: Brand.secondary }}>
                            {request.customerId?.email || 'No email'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {request.status}
                          {updatingProgress && selectedRequest?._id === request._id && (
                            <span className="ml-1">🔄</span>
                          )}
                        </span>
                      </div>
                      
                      {/* Equipment & Damage */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: Brand.secondary + '20' }}>
                            <span className="text-lg">🏏</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: Brand.body }}>
                              {request.equipmentType?.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </p>
                            <p className="text-xs" style={{ color: Brand.secondary }}>
                              {request.damageType}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="p-6">
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium" style={{ color: Brand.body }}>
                            Progress
                          </span>
                          <span className="text-lg font-bold" style={{ color: getProgressColor(request.repairProgress || 0) }}>
                            {request.repairProgress || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${request.repairProgress || 0}%`,
                              backgroundColor: getProgressColor(request.repairProgress || 0),
                              boxShadow: `0 0 10px ${getProgressColor(request.repairProgress || 0)}40`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs mt-1 font-medium" style={{ color: getProgressColor(request.repairProgress || 0) }}>
                          {getProgressStage(request.repairProgress || 0)}
                        </p>
                      </div>

                      {/* Customer Information */}
                      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: Brand.light }}>
                        <p className="text-xs font-medium mb-1" style={{ color: Brand.secondary }}>
                          Customer Information
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: Brand.primary }}>
                            {(request.customerId?.username || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: Brand.body }}>
                              {request.customerId?.username || 'Unknown Customer'}
                            </p>
                            <p className="text-xs" style={{ color: Brand.secondary }}>
                              {request.customerId?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleProgressUpdate(request)}
                        className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                        style={{ 
                          backgroundColor: Brand.accent,
                          boxShadow: `0 4px 14px ${Brand.accent}40`
                        }}
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <span>📊</span>
                          <span>Update Progress</span>
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingTechnician && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                  Edit Technician
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTechnician(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Skills</label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {SKILL_OPTIONS.map((skill) => (
                      <label key={skill} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editFormData.skills.includes(skill)}
                          onChange={() => handleSkillChange(skill)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm" style={{ color: Brand.body }}>{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.available}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, available: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium" style={{ color: Brand.body }}>Available for assignments</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTechnician(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  style={{ color: Brand.body }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: Brand.accent }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Update Modal */}
        {showProgressModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                  Update Repair Progress
                </h3>
                <button
                  onClick={() => {
                    setShowProgressModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>
                    Repair Progress ({progressData.repairProgress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressData.repairProgress}
                    onChange={(e) => setProgressData(prev => ({ ...prev, repairProgress: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: Brand.accent }}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: Brand.secondary }}>
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                  <div className="mt-2 text-sm" style={{ color: getProgressColor(progressData.repairProgress) }}>
                    <strong>Stage:</strong> {getProgressStage(progressData.repairProgress)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={progressData.notes}
                    onChange={(e) => {
                      const newNotes = e.target.value;
                      setProgressData(prev => ({ ...prev, notes: newNotes }));
                      const error = validateProgressNotes(newNotes);
                      setProgressNotesError(error);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      progressNotesError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Add any notes about the repair progress..."
                    rows="3"
                  />
                  {progressNotesError && (
                    <p className="text-red-500 text-sm mt-1">{progressNotesError}</p>
                  )}
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm" style={{ color: Brand.primary }}>
                    <strong>Automatic Notifications:</strong>
                  </div>
                  <div className="text-xs mt-1" style={{ color: Brand.body }}>
                    • Customer will receive email notification
                    • Service Manager Dashboard will update automatically
                    • Customer Dashboard will refresh with new progress
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowProgressModal(false);
                    setSelectedRequest(null);
                    setProgressNotesError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  style={{ color: Brand.body }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProgress}
                  disabled={updatingProgress}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                    updatingProgress ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ backgroundColor: Brand.accent }}
                >
                  {updatingProgress ? 'Updating...' : 'Update Progress'}
                </button>
              </div>
            </div>
          </div>
        )}
           </div>
         </main>
       </div>
     );
   };

export default TechnicianDashboard;
