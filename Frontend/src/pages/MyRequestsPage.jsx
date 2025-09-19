import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerRequests } from '../api/repairRequestApi';
import Brand from '../brand';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MyRequestsPage = () => {
  const navigate = useNavigate();
  const [repairRequests, setRepairRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      setLoading(true);
      // Using customer ID 1 as default - you can make this dynamic based on logged-in user
      const response = await getCustomerRequests(1);
      const requests = Array.isArray(response?.data) ? response.data : [];
      setRepairRequests(requests);
    } catch (err) {
      setError('Failed to load repair requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Brand.light }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: Brand.secondary }}></div>
          <p className="mt-4" style={{ color: Brand.body }}>Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Brand.light }}>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: Brand.primary }}>My Repair Requests</h1>
              <p className="mt-1" style={{ color: Brand.body }}>
                Track and manage your repair requests
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/repair')} 
                className="px-4 py-2 rounded-lg text-white font-semibold" 
                style={{ backgroundColor: Brand.secondary }}
              >
                New Request
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="px-4 py-2 rounded-lg text-white font-semibold" 
                style={{ backgroundColor: Brand.accent }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Requests List */}
        {repairRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: Brand.primary }}>No Repair Requests Found</h2>
            <p className="mb-6" style={{ color: Brand.body }}>
              You haven't submitted any repair requests yet.
            </p>
            <button 
              onClick={() => navigate('/repair')} 
              className="px-6 py-3 rounded-lg text-white font-semibold" 
              style={{ backgroundColor: Brand.secondary }}
            >
              Submit Your First Request
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {repairRequests.map((request) => (
              <div key={request._id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: Brand.primary }}>
                      {request.equipmentType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - {request.damageType}
                    </h3>
                    <p className="text-sm" style={{ color: Brand.body }}>
                      Request ID: {request._id} • Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                    {request.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: Brand.primary }}>Request Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium" style={{ color: Brand.body }}>Equipment:</span> {request.equipmentType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p><span className="font-medium" style={{ color: Brand.body }}>Damage Type:</span> {request.damageType}</p>
                      <p><span className="font-medium" style={{ color: Brand.body }}>Description:</span> {request.description || request.damageDescription}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: Brand.primary }}>Status & Timeline</h4>
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
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyRequestsPage;
