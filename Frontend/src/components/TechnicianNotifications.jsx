import React, { useState, useEffect } from 'react';
import { getTechnicianNotifications } from '../api/repairRequestApi';
import Brand from '../brand';

const TechnicianNotifications = ({ technicianId, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (technicianId) {
      loadNotifications();
    }
  }, [technicianId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTechnicianNotifications(technicianId);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'text-green-600 bg-green-100';
      case 'Estimate Sent':
        return 'text-blue-600 bg-blue-100';
      case 'Customer Approved':
        return 'text-purple-600 bg-purple-100';
      case 'In Repair':
        return 'text-orange-600 bg-orange-100';
      case 'Halfway Completed':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (daysUntilDue) => {
    if (daysUntilDue <= 1) return 'text-red-600 bg-red-100 border-red-200';
    if (daysUntilDue <= 2) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-yellow-600 bg-yellow-100 border-yellow-200';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Brand.primary }}></div>
        </div>
        <p className="text-center text-gray-500 mt-2">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={loadNotifications}
            className="px-4 py-2 rounded-lg text-white text-sm"
            style={{ backgroundColor: Brand.primary }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: Brand.primary }}>
          Urgent Repairs
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">No urgent repairs at the moment</p>
          <p className="text-sm text-gray-400 mt-1">All repairs are on schedule</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(notification.daysUntilDue)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">
                      {notification.customerName}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                      {notification.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">
                    {notification.equipmentType} - {notification.damageType}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Due: {formatDate(notification.estimatedCompletion)}
                    </span>
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      notification.daysUntilDue <= 1 
                        ? 'text-red-600 bg-red-100' 
                        : notification.daysUntilDue <= 2 
                        ? 'text-orange-600 bg-orange-100'
                        : 'text-yellow-600 bg-yellow-100'
                    }`}>
                      {notification.daysUntilDue} day{notification.daysUntilDue !== 1 ? 's' : ''} left
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={loadNotifications}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: Brand.primary }}
        >
          Refresh Notifications
        </button>
      </div>
    </div>
  );
};

export default TechnicianNotifications;
