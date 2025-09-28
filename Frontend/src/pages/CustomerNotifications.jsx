import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, X, Trash2, Wrench, AlertCircle } from 'lucide-react';

const CustomerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [repairNotifications, setRepairNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'orders', 'repairs', 'enrollments'
  const [notificationsViewed, setNotificationsViewed] = useState(false);

  useEffect(() => {
    // Check if notifications were already viewed
    const viewed = localStorage.getItem('notificationsViewed');
    setNotificationsViewed(viewed === 'true');
    
    loadNotifications();
    loadRepairNotifications();
    
    // Mark notifications as viewed when component mounts
    setNotificationsViewed(true);
    localStorage.setItem('notificationsViewed', 'true');
    
    // Listen for repair request submission events
    const handleRepairRequestSubmitted = () => {
      console.log('🔔 CustomerNotifications: Repair request submitted, refreshing...');
      loadRepairNotifications();
    };
    
    // Listen for page focus to refresh notifications
    const handlePageFocus = () => {
      console.log('🔔 CustomerNotifications: Page focused, refreshing notifications...');
      loadNotifications();
      loadRepairNotifications();
    };
    
    window.addEventListener('repairRequestSubmitted', handleRepairRequestSubmitted);
    window.addEventListener('focus', handlePageFocus);
    
    return () => {
      window.removeEventListener('repairRequestSubmitted', handleRepairRequestSubmitted);
      window.removeEventListener('focus', handlePageFocus);
    };
  }, []);

  const loadNotifications = () => {
    try {
      // Load notification from localStorage
      const storedNotification = localStorage.getItem('latestNotification');
      if (storedNotification) {
        const parsedNotification = JSON.parse(storedNotification);
        const currentNotifications = notifications;
        
        // Check if this is a new notification (different from current ones)
        const isNewNotification = !currentNotifications.some(n => 
          n.message === parsedNotification.message && 
          n.timestamp === parsedNotification.timestamp
        );
        
        setNotifications([parsedNotification]);
        
        // Only reset viewed state if this is genuinely a new notification
        if (isNewNotification) {
          setNotificationsViewed(false);
          localStorage.setItem('notificationsViewed', 'false');
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const loadRepairNotifications = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || localStorage.getItem('token');
      
      if (!userInfo || (!userInfo._id && !userInfo.id)) {
        console.log('🔔 CustomerNotifications: No user info found');
        setRepairNotifications([]);
        setLoading(false);
        return;
      }

      const userId = userInfo._id || userInfo.id;
      console.log('🔔 CustomerNotifications: Loading repair notifications for user:', userId);
      
      const response = await fetch(`http://localhost:5000/api/repair-notifications/customer/${userId}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔔 CustomerNotifications: Repair notifications loaded:', data);
        const newRepairNotifications = data.notifications || [];
        const currentRepairNotifications = repairNotifications;
        
        // Check if there are new unread repair notifications
        const hasNewUnreadRepairs = newRepairNotifications.some(newNotif => 
          !newNotif.isRead && !currentRepairNotifications.some(currentNotif => 
            currentNotif._id === newNotif._id
          )
        );
        
        setRepairNotifications(newRepairNotifications);
        
        // Only reset viewed state if there are genuinely new unread repair notifications
        if (hasNewUnreadRepairs) {
          setNotificationsViewed(false);
          localStorage.setItem('notificationsViewed', 'false');
        }
      } else {
        const errorText = await response.text();
        console.error('🔔 CustomerNotifications: Failed to load repair notifications:', response.status, response.statusText);
        console.error('🔔 CustomerNotifications: Error response:', errorText);
        setRepairNotifications([]);
      }
    } catch (error) {
      console.error('Error loading repair notifications:', error);
      setRepairNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const clearAllNotifications = () => {
    if (window.confirm('Are you sure you want to clear all order/enrollment notifications?')) {
      localStorage.removeItem('latestNotification');
      setNotifications([]);
    }
  };

  const clearAllRepairNotifications = async () => {
    if (window.confirm('Are you sure you want to clear all repair notifications?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo?.token || localStorage.getItem('token');
        
        if (!userInfo || (!userInfo._id && !userInfo.id)) return;

        const userId = userInfo._id || userInfo.id;
        const response = await fetch(`http://localhost:5000/api/repair-notifications/customer/${userId}/clear-all`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setRepairNotifications([]);
          localStorage.removeItem('repairNotifications');
        }
      } catch (error) {
        console.error('Error clearing repair notifications:', error);
      }
    }
  };

  const clearNotification = (index) => {
    if (window.confirm('Are you sure you want to clear this notification?')) {
      localStorage.removeItem('latestNotification');
      setNotifications([]);
    }
  };

  const markRepairNotificationAsRead = async (notificationId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/repair-notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setRepairNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking repair notification as read:', error);
    }
  };

  const deleteRepairNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo?.token || localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/repair-notifications/${notificationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Only remove from UI after successful server deletion
          setRepairNotifications(prev => 
            prev.filter(notif => notif._id !== notificationId)
          );
        } else {
          console.error('Failed to delete repair notification on server');
        }
      } catch (error) {
        console.error('Error deleting repair notification:', error);
      }
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

  const getRepairNotificationIcon = (type) => {
    switch (type) {
      case 'repair_submitted':
        return <Wrench className="w-6 h-6 text-blue-600" />;
      case 'repair_approved':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'repair_rejected':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'repair_in_progress':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'repair_completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
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

  const getRepairNotificationColor = (type) => {
    switch (type) {
      case 'repair_submitted':
        return 'bg-blue-50 border-blue-200';
      case 'repair_approved':
        return 'bg-green-50 border-green-200';
      case 'repair_rejected':
        return 'bg-red-50 border-red-200';
      case 'repair_in_progress':
        return 'bg-yellow-50 border-yellow-200';
      case 'repair_completed':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
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

  const allNotifications = [
    ...notifications.map(n => ({ ...n, source: 'order' })),
    ...repairNotifications.map(n => ({ ...n, source: 'repair' }))
  ]
  .filter((notification, index, self) => {
    // Remove duplicates based on unique ID if available, otherwise use message + timestamp + source
    if (notification._id) {
      return index === self.findIndex(n => n._id === notification._id);
    } else {
      return index === self.findIndex(n => 
        n.message === notification.message && 
        n.timestamp === notification.timestamp &&
        n.source === notification.source
      );
    }
  })
  .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'orders':
        return notifications.filter(n => n.type === 'order_success');
      case 'enrollments':
        return notifications.filter(n => n.type === 'enrollment_success' || n.type === 'enrollment_activated');
      case 'repairs':
        return repairNotifications;
      default:
        return allNotifications;
    }
  };

  const getTotalUnreadCount = () => {
    const orderUnread = notifications.length;
    const repairUnread = repairNotifications.filter(n => !n.isRead).length;
    return orderUnread + repairUnread;
  };

  return (
    <div className="bg-[#F1F2F7] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-[#072679]">Notifications</h2>
              <p className="text-gray-600 mt-1">Stay updated with your orders, repairs, and account notifications</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  console.log('🔄 Manually refreshing notifications...');
                  loadNotifications();
                  loadRepairNotifications();
                }}
                className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
              {getTotalUnreadCount() > 0 && (
                <>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Orders
                    </button>
                  )}
                  {repairNotifications.length > 0 && (
                    <button
                      onClick={clearAllRepairNotifications}
                      className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Repairs
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-[#072679] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All {!notificationsViewed && getTotalUnreadCount() > 0 && `(${getTotalUnreadCount()})`}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-white text-[#072679] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Orders {!notificationsViewed && notifications.filter(n => n.type === 'order_success').length > 0 && `(${notifications.filter(n => n.type === 'order_success').length})`}
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'enrollments'
                  ? 'bg-white text-[#072679] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Enrollments {!notificationsViewed && notifications.filter(n => n.type === 'enrollment_success' || n.type === 'enrollment_activated').length > 0 && `(${notifications.filter(n => n.type === 'enrollment_success' || n.type === 'enrollment_activated').length})`}
            </button>
            <button
              onClick={() => setActiveTab('repairs')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'repairs'
                  ? 'bg-white text-[#072679] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Repairs {!notificationsViewed && repairNotifications.filter(n => !n.isRead).length > 0 && `(${repairNotifications.filter(n => !n.isRead).length})`}
            </button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#42ADF5] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : getFilteredNotifications().length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
              <p className="text-gray-500 mb-6">
                {activeTab === 'orders' 
                  ? "You'll see order confirmations here."
                  : activeTab === 'enrollments'
                  ? "You'll see enrollment confirmations and status updates here."
                  : activeTab === 'repairs'
                  ? "You'll see repair request updates and status changes here."
                  : "You'll see all your notifications here."
                }
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>What you'll see here:</strong><br/>
                  • Order confirmation messages<br/>
                  • Enrollment status updates<br/>
                  • Repair request notifications<br/>
                  • Important account notifications
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredNotifications().map((notification, index) => (
                <div
                  key={notification._id || index}
                  className={`border rounded-lg p-6 ${
                    notification.source === 'repair' 
                      ? getRepairNotificationColor(notification.type)
                      : getNotificationColor(notification.type)
                  } ${!notification.isRead && notification.source === 'repair' ? 'ring-2 ring-blue-200' : ''}`}
                  onClick={() => notification.source === 'repair' && !notification.isRead && markRepairNotificationAsRead(notification._id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {notification.source === 'repair' 
                        ? getRepairNotificationIcon(notification.type)
                        : getNotificationIcon(notification.type)
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {notification.source === 'repair' && (
                            <h4 className="text-sm font-medium text-gray-800 mb-1">
                              {notification.title}
                            </h4>
                          )}
                          <p className="text-gray-800 leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTimestamp(notification.timestamp || notification.createdAt)}
                            </div>
                            {notification.source === 'repair' && !notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (notification.source === 'repair') {
                              deleteRepairNotification(notification._id);
                            } else {
                              clearNotification(index);
                            }
                          }}
                          className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove notification"
                        >
                          <Trash2 className="w-5 h-5" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <h4 className="font-medium text-gray-800 mb-2">Repair Requests</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Need help with your repair request? Track progress or contact our repair team.
                </p>
                <a
                  href="/repair"
                  className="text-[#42ADF5] hover:text-[#2C8ED1] text-sm font-medium"
                >
                  View Repairs →
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
