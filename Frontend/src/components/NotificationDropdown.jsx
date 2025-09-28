import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Wrench, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [repairNotifications, setRepairNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Load notification from localStorage
    const loadNotification = () => {
      try {
        const storedNotification = localStorage.getItem('latestNotification');
        if (storedNotification) {
          const parsedNotification = JSON.parse(storedNotification);
          setNotification(parsedNotification);
          setHasUnread(true);
        }
      } catch (error) {
        console.error('Error loading notification:', error);
      }
    };

    // Load repair notifications
    const loadRepairNotifications = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo?.token || localStorage.getItem('token');
        
        console.log('🔔 Debug - User Info:', userInfo);
        console.log('🔔 Debug - Token exists:', !!token);
        
        if (!userInfo || (!userInfo._id && !userInfo.id)) {
          console.log('🔔 No user info found for repair notifications');
          return;
        }

        if (!token) {
          console.log('🔔 No authentication token found');
          return;
        }

        const userId = userInfo._id || userInfo.id;
        console.log('🔔 Loading repair notifications for user:', userId);
        const url = `http://localhost:5000/api/repair-notifications/customer/${userId}?limit=5`;
        console.log('🔔 API URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('🔔 Response status:', response.status);
        console.log('🔔 Response ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('🔔 Repair notifications loaded:', data);
          const notifications = data.notifications || [];
          setRepairNotifications(notifications);
        } else {
          const errorText = await response.text();
          console.error('🔔 Failed to load repair notifications:', response.status, response.statusText);
          console.error('🔔 Error response:', errorText);
        }
      } catch (error) {
        console.error('🔔 Error loading repair notifications:', error);
      }
    };

    loadNotification();
    loadRepairNotifications();

    // Listen for storage changes (in case notification is updated from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'latestNotification') {
        loadNotification();
      } else if (e.key === 'repairNotifications') {
        loadRepairNotifications();
      }
    };

    // Listen for custom events to refresh notifications
    const handleRepairRequestSubmitted = () => {
      console.log('🔔 Repair request submitted, refreshing notifications...');
      loadRepairNotifications();
    };

    const handlePageFocus = () => {
      // Refresh notifications when page regains focus (user comes back from another tab)
      loadRepairNotifications();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('repairRequestSubmitted', handleRepairRequestSubmitted);
    window.addEventListener('focus', handlePageFocus);
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadRepairNotifications();
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('repairRequestSubmitted', handleRepairRequestSubmitted);
      window.removeEventListener('focus', handlePageFocus);
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update total unread count whenever notification or repairNotifications change
  useEffect(() => {
    const orderUnread = (notification && hasUnread) ? 1 : 0;
    const repairUnread = repairNotifications.filter(n => !n.isRead).length;
    setTotalUnreadCount(orderUnread + repairUnread);
  }, [notification, repairNotifications, hasUnread]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark order notification as read when opening dropdown (but don't clear it)
      if (notification && hasUnread) {
        setHasUnread(false);
      }
      // Load fresh repair notifications when opening
      loadRepairNotifications();
    }
  };

  const loadRepairNotifications = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || localStorage.getItem('token');
      
      if (!userInfo || (!userInfo._id && !userInfo.id)) {
        console.log('🔔 No user info found for repair notifications (toggle)');
        return;
      }

      const userId = userInfo._id || userInfo.id;
      console.log('🔔 Loading repair notifications for user (toggle):', userId);
      const response = await fetch(`http://localhost:5000/api/repair-notifications/customer/${userId}?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔔 Repair notifications loaded (toggle):', data);
        const notifications = data.notifications || [];
        setRepairNotifications(notifications);
      } else {
        console.error('🔔 Failed to load repair notifications (toggle):', response.status, response.statusText);
      }
    } catch (error) {
      console.error('🔔 Error loading repair notifications (toggle):', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearNotification = () => {
    localStorage.removeItem('latestNotification');
    setNotification(null);
    setHasUnread(false);
    setIsOpen(false);
  };

  const markRepairNotificationAsRead = async (notificationId) => {
    try {
      console.log('🔔 Marking repair notification as read:', notificationId);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/repair-notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔔 Mark as read response status:', response.status);
      console.log('🔔 Mark as read response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔔 Mark as read response data:', data);
        console.log('🔔 Notification marked as read successfully');
        return true;
      } else {
        const errorText = await response.text();
        console.error('🔔 Failed to mark notification as read:', response.status, response.statusText);
        console.error('🔔 Error response:', errorText);
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }
    } catch (error) {
      console.error('🔔 Error marking repair notification as read:', error);
      throw error;
    }
  };

  const getRepairNotificationIcon = (type) => {
    switch (type) {
      case 'repair_submitted':
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'repair_approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'repair_rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'repair_in_progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'repair_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
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

  // Calculate total unread count
  const getTotalUnreadCount = () => {
    return totalUnreadCount;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Button */}
      <button
        onClick={handleToggle}
        className="relative p-3 text-white hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
      >
        <Bell className="w-7 h-7" />
        {/* Notification Badge */}
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">All Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    console.log('🔔 Manual refresh triggered');
                    loadRepairNotifications();
                  }}
                  className="text-gray-400 hover:text-blue-600 transition-colors text-xs"
                  title="Refresh notifications"
                >
                  ↻
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">Loading notifications...</p>
              </div>
            ) : (notification || repairNotifications.length > 0) ? (
              <div className="space-y-3">
                {/* Order/Enrollment Notifications */}
                {notification && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={handleClearNotification}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Repair Notifications */}
                {repairNotifications.map((repairNotif) => (
                  <div
                    key={repairNotif._id}
                    className={`border rounded-lg p-4 ${getRepairNotificationColor(repairNotif.type)} ${
                      !repairNotif.isRead ? 'ring-2 ring-blue-200' : ''
                    }`}
                    onClick={async () => {
                      console.log('🔔 Repair notification clicked:', repairNotif._id, 'isRead:', repairNotif.isRead);
                      if (!repairNotif.isRead) {
                        // Prevent multiple clicks by immediately updating local state
                        setRepairNotifications(prev => 
                          prev.map(notif => 
                            notif._id === repairNotif._id 
                              ? { ...notif, isRead: true }
                              : notif
                          )
                        );
                        // Then call the API
                        try {
                          await markRepairNotificationAsRead(repairNotif._id);
                        } catch (error) {
                          // Revert state if API call fails
                          setRepairNotifications(prev => 
                            prev.map(notif => 
                              notif._id === repairNotif._id 
                                ? { ...notif, isRead: false }
                                : notif
                            )
                          );
                        }
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getRepairNotificationIcon(repairNotif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 mb-1">
                          {repairNotif.title}
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed mb-2">
                          {repairNotif.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(repairNotif.createdAt)}
                          </p>
                          {!repairNotif.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">You'll see order updates, repair notifications, and important messages here</p>
              </div>
            )}
            
            {(notification || repairNotifications.length > 0) && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <a
                  href="/customer/notifications"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all notifications →
                </a>
              </div>
            )}
            
            {/* Debug section - remove in production */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  console.log('🔧 Debug Info:');
                  console.log('User Info:', JSON.parse(localStorage.getItem('userInfo')));
                  console.log('Token exists:', !!localStorage.getItem('token'));
                  console.log('Current notifications:', repairNotifications);
                  loadRepairNotifications();
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Debug Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
