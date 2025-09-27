import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, X, Trash2 } from 'lucide-react';

const CustomerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    try {
      // Load notification from localStorage
      const storedNotification = localStorage.getItem('latestNotification');
      if (storedNotification) {
        const parsedNotification = JSON.parse(storedNotification);
        setNotifications([parsedNotification]);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const clearAllNotifications = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      localStorage.removeItem('latestNotification');
      setNotifications([]);
    }
  };

  const clearNotification = (index) => {
    if (window.confirm('Are you sure you want to clear this notification?')) {
      localStorage.removeItem('latestNotification');
      setNotifications([]);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_success':
      case 'enrollment_success':
      case 'enrollment_activated':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Bell className="w-6 h-6 text-blue-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order_success':
      case 'enrollment_success':
      case 'enrollment_activated':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (error) {
      return 'Unknown time';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F1F2F7] min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#42ADF5] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F1F2F7] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-[#072679]">Notifications</h2>
              <p className="text-gray-600 mt-1">Stay updated with your order and account notifications</p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </button>
            )}
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
              <p className="text-gray-500 mb-6">
                You'll see order confirmations, updates, and important messages here.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>What you'll see here:</strong><br/>
                  • Order confirmation messages<br/>
                  • Enrollment status updates<br/>
                  • Important account notifications
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-6 ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatTimestamp(notification.timestamp)}
                          </div>
                        </div>
                        <button
                          onClick={() => clearNotification(index)}
                          className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Need Help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Order Issues</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Having trouble with your order? Check your order status or contact support.
                </p>
                <a
                  href="/customer/my-orders"
                  className="text-[#42ADF5] hover:text-[#2C8ED1] text-sm font-medium"
                >
                  View My Orders →
                </a>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Account Support</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Need help with your account or have questions? We're here to help.
                </p>
                <a
                  href="/contact"
                  className="text-[#42ADF5] hover:text-[#2C8ED1] text-sm font-medium"
                >
                  Contact Support →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerNotifications;
