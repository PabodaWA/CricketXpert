// Debug script for notification issues
// Run this in browser console to debug the specific problems

const API_BASE_URL = 'http://https://cricketxpert-backend.vercel.app/api';

// Helper to get user info from localStorage
const getUserInfo = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = userInfo?.token || localStorage.getItem('token');
    return { userInfo, token };
  } catch (e) {
    console.error('Error parsing user info from localStorage:', e);
    return { userInfo: null, token: null };
  }
};

// Debug function 1: Check if repair notifications are being fetched correctly
const debugRepairNotifications = async () => {
  console.log('🔧 Debug 1: Checking repair notifications API...');
  
  const { userInfo, token } = getUserInfo();
  if (!userInfo || !token) {
    console.error('❌ No user logged in or token missing.');
    return;
  }

  const userId = userInfo._id || userInfo.id;
  console.log('✅ User:', userInfo.username, '(ID:', userId + ')');
  console.log('✅ Token exists:', !!token);

  try {
    const url = `${API_BASE_URL}/repair-notifications/customer/${userId}?limit=10`;
    console.log('🔍 API URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      console.log('📊 Notifications found:', data.notifications?.length || 0);
      console.log('📊 Unread count:', data.unreadCount || 0);
      
      if (data.notifications && data.notifications.length > 0) {
        console.log('📋 Notification details:');
        data.notifications.forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.title} (${notif.type}) - ${notif.isRead ? 'Read' : 'Unread'}`);
        });
      } else {
        console.log('⚠️ No repair notifications found');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Debug function 2: Check localStorage notifications
const debugLocalStorageNotifications = () => {
  console.log('🔧 Debug 2: Checking localStorage notifications...');
  
  try {
    const storedNotification = localStorage.getItem('latestNotification');
    if (storedNotification) {
      const parsed = JSON.parse(storedNotification);
      console.log('✅ Order/Enrollment notification found:', parsed);
    } else {
      console.log('⚠️ No order/enrollment notifications in localStorage');
    }
  } catch (error) {
    console.error('❌ Error reading localStorage:', error);
  }
};

// Debug function 3: Test mark as read functionality
const debugMarkAsRead = async (notificationId) => {
  console.log('🔧 Debug 3: Testing mark as read for notification:', notificationId);
  
  const { userInfo, token } = getUserInfo();
  if (!userInfo || !token) {
    console.error('❌ No user logged in or token missing.');
    return;
  }

  try {
    const url = `${API_BASE_URL}/repair-notifications/${notificationId}/read`;
    console.log('🔍 Mark as read URL:', url);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Mark as read response status:', response.status);
    console.log('📡 Mark as read response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Mark as read successful:', data);
    } else {
      const errorText = await response.text();
      console.error('❌ Mark as read failed:', response.status, response.statusText);
      console.error('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Mark as read network error:', error);
  }
};

// Debug function 4: Check bell icon state
const debugBellIconState = () => {
  console.log('🔧 Debug 4: Checking bell icon state...');
  
  // Check if NotificationDropdown component is mounted
  const bellButton = document.querySelector('[data-testid="notification-bell"]') || 
                    document.querySelector('button[class*="relative p-3"]');
  
  if (bellButton) {
    console.log('✅ Bell icon found in DOM');
    
    // Check for badge
    const badge = bellButton.querySelector('span[class*="absolute -top-1 -right-1"]');
    if (badge) {
      console.log('✅ Notification badge found:', badge.textContent);
    } else {
      console.log('⚠️ No notification badge found');
    }
  } else {
    console.log('❌ Bell icon not found in DOM');
  }
};

// Debug function 5: Check customer notifications page state
const debugCustomerPageState = () => {
  console.log('🔧 Debug 5: Checking customer notifications page state...');
  
  // Check if we're on the customer notifications page
  if (window.location.pathname.includes('/customer/notifications')) {
    console.log('✅ On customer notifications page');
    
    // Check for repair notifications in the page
    const repairNotifications = document.querySelectorAll('[data-testid="repair-notification"]') ||
                               document.querySelectorAll('div[class*="border rounded-lg p-4"]');
    
    console.log('📊 Repair notification elements found:', repairNotifications.length);
    
    // Check for tabs
    const tabs = document.querySelectorAll('button[class*="px-4 py-2"]');
    console.log('📊 Tab buttons found:', tabs.length);
    
  } else {
    console.log('⚠️ Not on customer notifications page. Current path:', window.location.pathname);
  }
};

// Comprehensive debug function
const debugAllNotificationIssues = async () => {
  console.log('🔧 Starting comprehensive notification debugging...');
  console.log('='.repeat(60));
  
  await debugRepairNotifications();
  console.log('-'.repeat(40));
  
  debugLocalStorageNotifications();
  console.log('-'.repeat(40));
  
  debugBellIconState();
  console.log('-'.repeat(40));
  
  debugCustomerPageState();
  console.log('-'.repeat(40));
  
  console.log('🎯 Debugging complete! Check the results above.');
};

// Helper function to get a notification ID for testing mark as read
const getFirstNotificationId = async () => {
  const { userInfo, token } = getUserInfo();
  if (!userInfo || !token) return null;
  
  try {
    const userId = userInfo._id || userInfo.id;
    const response = await fetch(`${API_BASE_URL}/repair-notifications/customer/${userId}?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.notifications?.[0]?._id || null;
    }
  } catch (error) {
    console.error('Error getting notification ID:', error);
  }
  return null;
};

// Test mark as read with first available notification
const testMarkAsRead = async () => {
  const notificationId = await getFirstNotificationId();
  if (notificationId) {
    await debugMarkAsRead(notificationId);
  } else {
    console.log('❌ No notifications found to test mark as read');
  }
};

// Expose functions globally
window.debugAllNotificationIssues = debugAllNotificationIssues;
window.debugRepairNotifications = debugRepairNotifications;
window.debugLocalStorageNotifications = debugLocalStorageNotifications;
window.debugMarkAsRead = debugMarkAsRead;
window.debugBellIconState = debugBellIconState;
window.debugCustomerPageState = debugCustomerPageState;
window.testMarkAsRead = testMarkAsRead;

console.log('🔧 Notification Debug Script Loaded!');
console.log('Available functions:');
console.log('- debugAllNotificationIssues() - Debug everything');
console.log('- debugRepairNotifications() - Check repair notifications API');
console.log('- debugLocalStorageNotifications() - Check localStorage notifications');
console.log('- debugMarkAsRead(notificationId) - Test mark as read');
console.log('- debugBellIconState() - Check bell icon state');
console.log('- debugCustomerPageState() - Check customer page state');
console.log('- testMarkAsRead() - Test mark as read with first notification');
console.log('\nRun debugAllNotificationIssues() to start debugging!');

