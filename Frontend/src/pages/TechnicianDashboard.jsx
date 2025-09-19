import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTechnicians, getAllRepairRequests, updateTaskProgress } from '../api/repairRequestApi';
import { updateTechnician } from '../api/technicianApi';
import Brand from '../brand';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
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
    loadTechnicians();
    loadRepairRequests();
    
    // Expose loadTechnicians function globally for cross-dashboard updates
    window.technicianDashboard = {
      loadTechnicians: loadTechnicians
    };
    
    // Cleanup on unmount
    return () => {
      delete window.technicianDashboard;
    };
  }, []);

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      const response = await getAllTechnicians();
      setTechnicians(response.data);
    } catch (error) {
      console.error('Error loading technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRepairRequests = async () => {
    try {
      const response = await getAllRepairRequests();
      console.log('Repair requests data:', response.data);
      console.log('Sample repair request with assigned technician:', response.data.find(r => r.assignedTechnician));
      setRepairRequests(response.data);
    } catch (error) {
      console.error('Error loading repair requests:', error);
    }
  };

  const handleAvailabilityToggle = async (technicianId, currentAvailability) => {
    try {
      const newAvailability = !currentAvailability;
      await updateTechnician(technicianId, { available: newAvailability });
      await loadTechnicians(); // Reload to get updated data
      
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
        await loadTechnicians();
        
        // Update Service Manager Dashboard if it's open
        if (window.serviceManagerDashboard && window.serviceManagerDashboard.loadData) {
          window.serviceManagerDashboard.loadData();
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
      await loadTechnicians();
      
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

  const filteredTechnicians = technicians.filter(technician => {
    if (availabilityFilter === 'available') {
      return technician.available === true;
    } else if (availabilityFilter === 'unavailable') {
      return technician.available === false;
    }
    return true; // 'all' filter
  });

  // Get all repair requests that are in repair status or completed
  const assignedRepairRequests = repairRequests.filter(request => 
    request.status === 'In Repair' || 
    request.status === 'Halfway Completed' || 
    request.status === 'Ready for Pickup'
  );

  // Filter assigned repair requests by technician and status
  const filteredAssignedRepairRequests = assignedRepairRequests.filter(request => {
    // First filter by technician
    let technicianMatch = true;
    if (technicianFilter !== 'all') {
      if (technicianFilter === 'unassigned') {
        technicianMatch = !request.assignedTechnician;
      } else if (request.assignedTechnician) {
        const technicianUsername = request.assignedTechnician?.technicianId?.username || request.assignedTechnician?.username || 'Technician';
        technicianMatch = technicianUsername.toLowerCase().includes(technicianFilter.toLowerCase());
      } else {
        technicianMatch = false;
      }
    }
    
    // Then filter by status
    let statusMatch = true;
    if (statusFilter !== 'all') {
      statusMatch = request.status === statusFilter;
    }
    
    return technicianMatch && statusMatch;
  });

  // Get unique technician usernames for the filter dropdown
  const getTechnicianUsernames = () => {
    const technicianUsernames = new Set();
    assignedRepairRequests.forEach(request => {
      if (request.assignedTechnician) {
        const technicianUsername = request.assignedTechnician?.technicianId?.username || request.assignedTechnician?.username || 'Technician';
        technicianUsernames.add(technicianUsername);
      }
    });
    return Array.from(technicianUsernames).sort();
  };

  // Debug: Log assigned repair requests when they change
  useEffect(() => {
    console.log('Assigned repair requests updated:', assignedRepairRequests);
    assignedRepairRequests.forEach(request => {
      console.log(`Request ${request._id}: Status=${request.status}, Progress=${request.repairProgress}%`);
    });
  }, [assignedRepairRequests]);

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
      await loadRepairRequests();
      
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
      <Header />
      {/* Main Content */}
      <main className="flex-1 p-8 relative">
        {/* Sidebar Toggle Button - Left Corner */}
        <div className="absolute top-0 left-0 z-40">
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
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-40 ${
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
              <h1 className="text-3xl font-bold" style={{ color: Brand.primary }}>Technician Dashboard</h1>
              <p className="mt-1" style={{ color: Brand.body }}>Manage technician profiles and availability</p>
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

            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Technicians', value: technicians.length, color: Brand.primary, show: globalFilter === 'all' || globalFilter === 'technicians' },
            { label: 'Available Technicians', value: technicians.filter(t => t.available === true).length, color: '#10B981', show: globalFilter === 'all' || globalFilter === 'technicians' },
            { label: 'Unavailable Technicians', value: technicians.filter(t => t.available === false).length, color: '#EF4444', show: globalFilter === 'all' || globalFilter === 'technicians' },
                         { label: 'Active Repairs', value: filteredAssignedRepairRequests.length, color: '#3B82F6', show: globalFilter === 'all' || globalFilter === 'repair_requests' }
          ].filter(stat => stat.show).map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-sm" style={{ color: Brand.body }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Technicians Table */}
        {(globalFilter === 'all' || globalFilter === 'technicians') && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b" style={{ borderColor: Brand.light }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                    Technicians ({filteredTechnicians.length})
                  </h2>
                  <p className="text-sm" style={{ color: Brand.body }}>
                    View and manage all technician profiles
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: Brand.secondary, color: Brand.body }}
                  >
                    <option value="all">All Technicians</option>
                    <option value="available">Available Only</option>
                    <option value="unavailable">Unavailable Only</option>
                  </select>
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
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleAvailabilityToggle(technician._id, technician.available)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            technician.available 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {technician.available ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTechnician(technician)}
                            className="px-3 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: Brand.secondary }}
                          >
                            Edit
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
                          <div className="text-sm">No technicians match the current filter</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assigned Repair Requests Cards */}
        {(globalFilter === 'all' || globalFilter === 'repair_requests') && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                         <div className="flex justify-between items-center mb-6">
               <div>
                 <h2 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                   Assigned Repair Requests ({filteredAssignedRepairRequests.length})
                 </h2>
                 <p className="text-sm" style={{ color: Brand.body }}>
                   All repair requests in progress or ready for pickup
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
                  
                  {/* Technician Filter Dropdown */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={technicianFilter}
                      onChange={(e) => setTechnicianFilter(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                      style={{ borderColor: Brand.secondary, color: Brand.body }}
                    >
                      <option value="all">All Technicians</option>
                      <option value="unassigned">Unassigned Requests</option>
                      {getTechnicianUsernames().map((username) => (
                        <option key={username} value={username}>
                          @{username}
                        </option>
                      ))}
                    </select>
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
                       {(() => {
                         if (technicianFilter !== 'all' && statusFilter !== 'all') {
                           return `No ${statusFilter.toLowerCase()} repair requests assigned to @${technicianFilter} found.`;
                         } else if (technicianFilter !== 'all') {
                           return technicianFilter === 'unassigned'
                             ? 'No unassigned repair requests found.'
                             : `No repair requests assigned to @${technicianFilter} found.`;
                         } else if (statusFilter !== 'all') {
                           return `No ${statusFilter.toLowerCase()} repair requests found.`;
                         } else {
                           return 'No repair requests are currently in progress or ready for pickup.';
                         }
                       })()}
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

                      {/* Assigned Technician */}
                      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: Brand.light }}>
                        <p className="text-xs font-medium mb-1" style={{ color: Brand.secondary }}>
                          Assigned Technician
                        </p>
                        {request.assignedTechnician ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: Brand.primary }}>
                              {(request.assignedTechnician?.technicianId?.firstName || request.assignedTechnician?.firstName || 'T').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: Brand.body }}>
                                {request.assignedTechnician?.technicianId?.firstName || request.assignedTechnician?.firstName} {request.assignedTechnician?.technicianId?.lastName || request.assignedTechnician?.lastName}
                              </p>
                              <p className="text-xs" style={{ color: Brand.secondary }}>
                                @{request.assignedTechnician?.technicianId?.username || request.assignedTechnician?.username || 'Technician'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#9CA3AF', color: 'white' }}>
                              ?
                            </div>
                            <span className="text-sm italic" style={{ color: Brand.secondary }}>
                              No technician assigned
                            </span>
                          </div>
                        )}
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
       <Footer />
       </div>
     );
   };

export default TechnicianDashboard;
