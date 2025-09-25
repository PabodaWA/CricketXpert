import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerRequests, downloadRepairReport, updateRepairRequest, deleteRepairRequest, customerDecision } from '../api/repairRequestApi';
import { getCurrentUser } from '../utils/getCurrentUser';
import Brand from '../brand';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Using shared Brand from ../brand

const DAMAGE_TYPES = [
  'Bat Handle Damage',
  'Bat Surface Crack',
  'Ball Stitch Damage',
  'Gloves Tear',
  'Pads Crack',
  'Helmet Damage',
  'Other'
];

const EQUIPMENT_TYPES = [
  { value: 'cricket_bat', label: 'Cricket Bat' },
  { value: 'cricket_ball', label: 'Cricket Ball' },
  { value: 'cricket_gloves', label: 'Cricket Gloves' },
  { value: 'cricket_pads', label: 'Cricket Pads' },
  { value: 'cricket_helmet', label: 'Cricket Helmet' }
];

const CustomerDashboard = ({ customerId }) => {
  const navigate = useNavigate();
  const [repairRequests, setRepairRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ equipmentType: '', damageType: '', description: '' });
  const [descriptionError, setDescriptionError] = useState('');
  const [query, setQuery] = useState('');
  const [allRequests, setAllRequests] = useState([]);
  const [technicianDetails, setTechnicianDetails] = useState({});
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [equipmentFilter, setEquipmentFilter] = useState('All Equipment Types');
  const [damageTypeFilter, setDamageTypeFilter] = useState('All Damage Types');
  
  // Get the actual logged-in user's ID instead of using URL parameter
  const [actualCustomerId, setActualCustomerId] = useState(null);


  useEffect(() => {
    // Get the logged-in user's ID
    const currentUser = getCurrentUser();
    if (currentUser && currentUser._id) {
      setActualCustomerId(currentUser._id);
    } else {
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    if (actualCustomerId) {
      loadCustomerRequests();
      
      // Expose loadCustomerRequests function globally for cross-dashboard updates
      window.customerDashboard = {
        loadCustomerRequests: loadCustomerRequests
      };
      
      // Cleanup on unmount
      return () => {
        delete window.customerDashboard;
      };
    }
  }, [actualCustomerId]);

  // Auto-refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && actualCustomerId) {
        loadCustomerRequests();
      }
    };

    const handleFocus = () => {
      if (actualCustomerId) {
        loadCustomerRequests();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [actualCustomerId]);

  const loadCustomerRequests = async () => {
      try {
        // Use the actual logged-in user's ID instead of URL parameter
        const userId = actualCustomerId || customerId;
        
        // Debug: Log the customer ID being used
        console.log('🔍 LOADING REQUESTS FOR CUSTOMER ID:', userId);
        console.log('🔍 CUSTOMER ID TYPE:', typeof userId);
        console.log('🔍 URL PARAMETER CUSTOMER ID:', customerId);
        console.log('🔍 ACTUAL LOGGED-IN USER ID:', actualCustomerId);
        
        const res = await getCustomerRequests(userId);
      const list = Array.isArray(res?.data) ? res.data : [];
      
      // Temporary debug to see what we're receiving
      console.log('🔍 FRONTEND RECEIVED:', list.map(req => ({
        id: req._id,
        customerId: req.customerId,
        description: req.description,
        damageType: req.damageType
      })));
      console.log('🔍 FIRST REQUEST DESCRIPTION:', list[0]?.description);
      console.log('🔍 FIRST REQUEST DESCRIPTION TYPE:', typeof list[0]?.description);
      console.log('🔍 FIRST REQUEST DESCRIPTION LENGTH:', list[0]?.description?.length);
      
      setAllRequests(list);
      setRepairRequests(list);
      
      // Fetch technician details for assigned technicians
      const technicianIds = list
        .filter(request => request.assignedTechnician?.technicianId)
        .map(request => request.assignedTechnician.technicianId);
      
      if (technicianIds.length > 0) {
        try {
          const uniqueIds = [...new Set(technicianIds)];
          const technicianPromises = uniqueIds.map(async (id) => {
            try {
              const response = await axios.get(`http://localhost:5000/api/users/${id}`);
              return { id, data: response.data };
            } catch (error) {
              console.error(`Error fetching technician ${id}:`, error);
              return { id, data: null };
            }
          });
          
          const technicianResults = await Promise.all(technicianPromises);
          const technicianMap = {};
          technicianResults.forEach(({ id, data }) => {
            if (data) {
              technicianMap[id] = data;
            }
          });
          setTechnicianDetails(technicianMap);
        } catch (error) {
          console.error('Error fetching technician details:', error);
        }
      }
    } catch (error) {
      console.error('Error loading customer requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (request) => {
    setSelectedRequest(request);
    setEditData({ 
      equipmentType: request.equipmentType || '', 
      damageType: request.damageType || '', 
      description: request.description || request.damageDescription || '' 
    });
    setDescriptionError('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    // Validate description before saving
    if (descriptionError) {
      alert('Please fix the description errors before saving.');
      return;
    }
    
    try {
      await updateRepairRequest(selectedRequest._id, {
        equipmentType: editData.equipmentType,
        damageType: editData.damageType,
        description: editData.description
      });
      setShowEditModal(false);
      setDescriptionError('');
      await loadCustomerRequests();
      alert('Request updated');
    } catch (e) {
      alert('Failed to update request');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Delete this repair request?')) return;
    try {
      await deleteRepairRequest(id);
      await loadCustomerRequests();
      alert('Request deleted');
    } catch (e) {
      alert('Failed to delete request');
    }
  };

  const handleDownload = async (requestId) => {
    try {
      const res = await downloadRepairReport(requestId);
      const url = window.URL.createObjectURL(new Blob([res] && res.data ? [res.data] : []));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `repair_report_${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      } catch (e) {
      alert('Failed to download report');
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Customer Approved': return 'bg-green-100 text-green-800';
      case 'Customer Rejected': return 'bg-orange-100 text-orange-800';
      case 'In Repair': return 'bg-blue-100 text-blue-800';
      case 'Halfway Completed': return 'bg-yellow-100 text-yellow-800';
      case 'Ready for Pickup': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#10B981';
    if (progress >= 50) return '#F59E0B';
    return '#EF4444';
  };

  // Validate description for repeated characters
  const validateDescription = (description) => {
    if (!description || description.length < 4) return '';
    
    // Check for repeated letters (3 or more same letters in a row)
    const letterPattern = /(.)\1{2,}/;
    if (letterPattern.test(description)) {
      return 'Description cannot contain 3 or more repeated letters in a row (e.g., "aaa", "bbb")';
    }
    
    // Check for repeated numbers (3 or more same numbers in a row)
    const numberPattern = /(\d)\1{2,}/;
    if (numberPattern.test(description)) {
      return 'Description cannot contain 3 or more repeated numbers in a row (e.g., "111", "222")';
    }
    
    return '';
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
    <>
      <div className="min-h-screen" style={{ backgroundColor: Brand.light }}>
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: Brand.primary }}>Customer Dashboard</h1>
              <p className="mt-1" style={{ color: Brand.body }}>
                Track your repair requests and stay updated on progress
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/repair')} className="px-4 py-2 rounded-lg text-white font-semibold" style={{ backgroundColor: Brand.secondary }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = Brand.primaryHover; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = Brand.secondary; }}>New Repair</button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Total Requests', value: repairRequests.length, color: Brand.primary },
            { label: 'Pending', value: repairRequests.filter(r => r.status === 'Pending').length, color: Brand.accent },
            { label: 'In Progress', value: repairRequests.filter(r => r.status === 'In Repair').length, color: Brand.secondary },
            { label: 'Halfway Completed', value: repairRequests.filter(r => r.status === 'Halfway Completed').length, color: '#F59E0B' },
            { label: 'Rejected', value: repairRequests.filter(r => r.status === 'Rejected' || r.status === 'Customer Rejected').length, color: '#EF4444' },
            { label: 'Ready for Pickup', value: repairRequests.filter(r => r.status === 'Ready for Pickup').length, color: '#10B981' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-sm" style={{ color: Brand.body }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: Brand.primary }}>Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: Brand.secondary, color: Brand.body }}
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Customer Approved">Customer Approved</option>
                <option value="Customer Rejected">Customer Rejected</option>
                <option value="In Repair">In Repair</option>
                <option value="Halfway Completed">Halfway Completed</option>
                <option value="Rejected">Rejected</option>
                <option value="Ready for Pickup">Ready for Pickup</option>
              </select>
            </div>

            {/* Equipment Type Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: Brand.primary }}>Equipment Type</label>
              <select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: Brand.secondary, color: Brand.body }}
              >
                <option value="All Equipment Types">All Equipment Types</option>
                <option value="cricket_bat">Cricket Bat</option>
                <option value="cricket_ball">Cricket Ball</option>
                <option value="cricket_gloves">Cricket Gloves</option>
                <option value="cricket_pads">Cricket Pads</option>
                <option value="cricket_helmet">Cricket Helmet</option>
              </select>
            </div>

            {/* Damage Type Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: Brand.primary }}>Damage Type</label>
              <select
                value={damageTypeFilter}
                onChange={(e) => setDamageTypeFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: Brand.secondary, color: Brand.body }}
              >
                <option value="All Damage Types">All Damage Types</option>
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

          {/* Clear All Filters Button */}
          <div className="flex justify-start">
            <button
              onClick={() => {
                setStatusFilter('All Statuses');
                setEquipmentFilter('All Equipment Types');
                setDamageTypeFilter('All Damage Types');
                setQuery('');
              }}
              className="px-6 py-2 rounded-lg text-white font-semibold"
              style={{ backgroundColor: Brand.accent }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = Brand.primaryHover; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = Brand.accent; }}
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Repair Requests */}
        <div className="space-y-6">
          {allRequests.filter(r => {
            // Status filter
            if (statusFilter !== 'All Statuses' && r.status !== statusFilter) {
              return false;
            }
            
            // Equipment type filter
            if (equipmentFilter !== 'All Equipment Types' && r.equipmentType !== equipmentFilter) {
              return false;
            }
            
            // Damage type filter
            if (damageTypeFilter !== 'All Damage Types' && r.damageType !== damageTypeFilter) {
              return false;
            }
            
            // Text search (if query exists)
            if (query) {
              const q = query.toLowerCase();
              const technicianName = r.assignedTechnician?.technicianId?.username || 
                                    r.assignedTechnician?.technicianId?.firstName + ' ' + r.assignedTechnician?.technicianId?.lastName ||
                                    r.assignedTechnician?.technicianId?.email || '';
              const fields = [r.equipmentType, r.damageType, r.status, r.description || r.damageDescription, technicianName].map(x => String(x || '').toLowerCase());
              return fields.some(f => f.includes(q));
            }
            
            return true;
          }).map((request) => (
            <div key={request._id} className="bg-white rounded-xl shadow-md p-6">
              {/* Request Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                    {request.equipmentType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - {request.damageType}
                  </h3>
                  <p className="text-sm" style={{ color: Brand.body }}>
                    Submitted: {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm mt-1" style={{ color: Brand.secondary }}>
                    <strong>Current Status:</strong> {request.status}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                  {request.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold mb-3" style={{ color: Brand.primary }}>Request Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium" style={{ color: Brand.body }}>Equipment:</span> {(() => {
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
                    })()}</p>
                    <p><span className="font-medium" style={{ color: Brand.body }}>Damage Type:</span> {request.damageType || 'Not specified'}</p>
                    <p><span className="font-medium" style={{ color: Brand.body }}>Description:</span> {(() => {
                      // Always prioritize customer's actual description first
                      if (request.description && request.description.trim() !== '') {
                        return request.description;
                      }
                      // Check legacy field
                      if (request.damageDescription && request.damageDescription.trim() !== '') {
                        return request.damageDescription;
                      }
                      // Check if description exists but is empty string
                      if (request.description === '') {
                        return 'No description provided';
                      }
                      // Check if description is undefined or null
                      if (request.description === undefined || request.description === null) {
                        return 'No description provided';
                      }
                      // Only use generated description as absolute last resort
                      if (request.damageType) {
                        return `Repair request for ${request.damageType}`;
                      }
                      return 'No description provided';
                    })()}</p>
                    {request.assignedTechnician && (
                      <p><span className="font-medium" style={{ color: Brand.body }}>Technician:</span> {
                        (() => {
                          const technicianId = request.assignedTechnician.technicianId;
                          if (technicianId && technicianDetails[technicianId]) {
                            const tech = technicianDetails[technicianId];
                            return tech.username || `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email || 'Technician Assigned';
                          }
                          // Fallback to direct properties
                          if (request.assignedTechnician.technicianId?.username) {
                            return request.assignedTechnician.technicianId.username;
                          }
                          if (request.assignedTechnician.username) {
                            return request.assignedTechnician.username;
                          }
                          return 'Technician Assigned';
                        })()
                      }</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3" style={{ color: Brand.primary }}>Cost & Timeline</h4>
                  <div className="space-y-2 text-sm">
                    {request.costEstimate || request.cost ? (
                      <p><span className="font-medium" style={{ color: Brand.body }}>Estimated Cost:</span> Rs {request.costEstimate ?? request.cost}</p>
                    ) : (
                      <p><span className="font-medium" style={{ color: Brand.body }}>Estimated Cost:</span> <span style={{ color: Brand.accent }}>Pending</span></p>
                    )}
                    {request.timeEstimate ? (
                      <p><span className="font-medium" style={{ color: Brand.body }}>Time Estimate:</span> {request.timeEstimate}</p>
                    ) : (
                      <p><span className="font-medium" style={{ color: Brand.body }}>Time Estimate:</span> <span style={{ color: Brand.accent }}>Pending</span></p>
                    )}
                    {request.estimatedCompletion && (
                      <p><span className="font-medium" style={{ color: Brand.body }}>Expected Completion:</span> {new Date(request.estimatedCompletion).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {request.status === 'in_progress' && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium" style={{ color: Brand.body }}>Repair Progress</span>
                    <span className="font-bold" style={{ color: getProgressColor(request.progress) }}>
                      {request.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${request.progress}%`,
                        backgroundColor: getProgressColor(request.progress)
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Milestones */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3" style={{ color: Brand.primary }}>Repair Timeline</h4>
                <div className="space-y-3">
                  {(request.milestones || []).map((milestone, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {milestone.completed ? (
                          <span className="text-white text-xs">✓</span>
                        ) : (
                          <span className="text-gray-500 text-xs">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${milestone.completed ? 'font-medium' : ''}`} style={{ color: milestone.completed ? Brand.primary : Brand.body }}>
                          {milestone.stage}
                        </p>
                        {milestone.date && (
                          <p className="text-xs" style={{ color: Brand.secondary }}>
                            {new Date(milestone.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
        </div>

              {/* Cost & Time Estimate Notification */}
              {request.status === 'Approved' && (request.costEstimate || request.timeEstimate) && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
                  <h4 className="font-semibold mb-2" style={{ color: '#92400E' }}>📋 Service Estimate Received</h4>
                  <div className="space-y-2 text-sm" style={{ color: '#92400E' }}>
                    {request.costEstimate && (
                      <p><strong>Estimated Cost:</strong> Rs {request.costEstimate}</p>
                    )}
                    {request.timeEstimate && (
                      <p><strong>Time Estimate:</strong> {request.timeEstimate}</p>
                    )}
                    <p className="mt-2 font-medium">Please review and approve or reject this estimate to proceed with your repair.</p>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {request.status === 'Rejected' && request.rejectionReason && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444' }}>
                  <h4 className="font-semibold mb-2" style={{ color: '#991B1B' }}>❌ Request Rejected</h4>
                  <p className="text-sm" style={{ color: '#991B1B' }}>
                    <strong>Reason:</strong> {request.rejectionReason}
                  </p>
                </div>
              )}

              {/* Notes */}
              {request.notes && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: Brand.light }}>
                  <h4 className="font-semibold mb-2" style={{ color: Brand.primary }}>Latest Update</h4>
                  <p className="text-sm" style={{ color: Brand.body }}>{request.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {/* Customer Approval/Rejection for Approved Requests */}
                {request.status === 'Approved' && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Approving estimate for request:', request._id);
                          const response = await customerDecision(request._id, 'approve');
                          console.log('Approval response:', response.data);
                          await loadCustomerRequests();
                          alert('Estimate approved successfully!');
                        } catch (error) {
                          console.error('Error approving estimate:', error);
                          console.error('Error response:', error.response?.data);
                          alert(`Failed to approve estimate: ${error.response?.data?.error || error.message}`);
                        }
                      }}
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      Approve Estimate
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Rejecting estimate for request:', request._id);
                          const response = await customerDecision(request._id, 'reject');
                          console.log('Rejection response:', response.data);
                          await loadCustomerRequests();
                          alert('Estimate rejected successfully!');
                        } catch (error) {
                          console.error('Error rejecting estimate:', error);
                          console.error('Error response:', error.response?.data);
                          alert(`Failed to reject estimate: ${error.response?.data?.error || error.message}`);
                        }
                      }}
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: '#EF4444' }}
                    >
                      Reject Estimate
                    </button>
                  </>
                )}

                {/* Customer Rejected Status - Show different actions */}
                {request.status === 'Customer Rejected' && (
                  <div className="w-full p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
                    <p className="text-sm" style={{ color: '#92400E' }}>
                      <strong>Status:</strong> You have rejected the estimate. The service manager will review and may revise the estimate or cancel the request.
                    </p>
                  </div>
                )}

                {/* Customer Approved Status - Show progress */}
                {request.status === 'Customer Approved' && (
                  <div className="w-full p-3 rounded-lg" style={{ backgroundColor: '#D1FAE5', border: '1px solid #10B981' }}>
                    <p className="text-sm" style={{ color: '#065F46' }}>
                      <strong>Status:</strong> Estimate approved! Your repair request is now being processed.
                    </p>
                  </div>
                )}

                {/* Halfway Completed Status - Show progress */}
                {request.status === 'Halfway Completed' && (
                  <div className="w-full p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
                    <p className="text-sm" style={{ color: '#92400E' }}>
                      <strong>Status:</strong> Great progress! Your repair is halfway completed. The technician is working on your equipment.
                    </p>
                    {request.repairProgress && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress: {request.repairProgress}%</span>
                          <span>{request.currentStage || 'Halfway Completed'}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${request.repairProgress}%`,
                              backgroundColor: '#F59E0B'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                

                          <button
                  onClick={() => handleDownload(request._id)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: Brand.secondary }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = Brand.primaryHover; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = Brand.secondary; }}
                          >
                  Download Report
                          </button>
                <button
                  onClick={() => handleOpenEdit(request)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: Brand.primary }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRequest(request._id)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: Brand.accent }}
                >
                  Delete
                </button>
                        </div>
                    </div>
                  ))}
                </div>

        {repairRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: Brand.primary }}>No Repair Requests</h3>
            <p className="mb-4" style={{ color: Brand.body }}>You haven't submitted any repair requests yet.</p>
                <button
              onClick={() => navigate('/repair')}
              className="px-6 py-3 rounded-lg text-white font-semibold"
              style={{ backgroundColor: Brand.secondary }}
            >
              Submit Your First Request
                </button>
              </div>
            )}
      </div>

      {/* Edit Request Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4" style={{ color: Brand.primary }}>Edit Repair Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Equipment Type</label>
                <select
                  value={editData.equipmentType}
                  onChange={(e) => setEditData({ ...editData, equipmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select equipment type</option>
                  {EQUIPMENT_TYPES.map((equipment) => (
                    <option key={equipment.value} value={equipment.value}>{equipment.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Damage Type</label>
                <select
                  value={editData.damageType}
                  onChange={(e) => setEditData({ ...editData, damageType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select damage type</option>
                  {DAMAGE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
                             <div>
                 <label className="block text-sm font-medium mb-2" style={{ color: Brand.body }}>Description</label>
                 <textarea
                   value={editData.description}
                   onChange={(e) => {
                     const newDescription = e.target.value;
                     setEditData({ ...editData, description: newDescription });
                     const error = validateDescription(newDescription);
                     setDescriptionError(error);
                   }}
                   className={`w-full px-3 py-2 border rounded-lg ${
                     descriptionError ? 'border-red-500' : 'border-gray-300'
                   }`}
                   rows="4"
                   placeholder="Describe the damage"
                 />
                 {descriptionError && (
                   <p className="text-red-500 text-sm mt-1">{descriptionError}</p>
                 )}
               </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                style={{ color: Brand.body }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: Brand.secondary }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
        )}

      </div>
      <Footer />
    </>
  );
};

export default CustomerDashboard;
