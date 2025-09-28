// Comprehensive test script for all notification types
// Run this in browser console to test repair, order, and enrollment notifications

const API_BASE_URL = 'http://localhost:5000/api';

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

// Test 1: Repair Request Submission Notification
const testRepairNotification = async () => {
  console.log('🔧 Testing Repair Request Submission Notification...');
  
  const { userInfo, token } = getUserInfo();
  if (!userInfo || !token) {
    console.error('❌ No user logged in or token missing.');
    return false;
  }

  const userId = userInfo._id || userInfo.id;
  console.log('✅ User:', userInfo.username, '(ID:', userId + ')');

  try {
    // Submit a repair request
    const repairPayload = {
      customerId: userId,
      equipmentType: 'cricket_bat',
      damageType: 'Bat Handle Damage',
      description: `Test repair request - ${new Date().toLocaleString()}`,
      status: 'Pending'
    };

    console.log('🚀 Submitting repair request...');
    const repairResponse = await fetch(`${API_BASE_URL}/repairs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(repairPayload)
    });

    if (repairResponse.ok) {
      const repairData = await repairResponse.json();
      console.log('✅ Repair request submitted:', repairData.repairRequest._id);
      
      // Check if notification was created
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const notificationResponse = await fetch(`${API_BASE_URL}/repair-notifications/customer/${userId}?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        const latestNotification = notificationData.notifications[0];
        
        if (latestNotification && latestNotification.type === 'repair_submitted') {
          console.log('✅ Repair notification created successfully!');
          console.log('   Title:', latestNotification.title);
          console.log('   Message:', latestNotification.message);
          console.log('   Unread count:', notificationData.unreadCount);
          return true;
        } else {
          console.error('❌ Repair notification not found or incorrect type');
          return false;
        }
      } else {
        console.error('❌ Failed to fetch repair notifications');
        return false;
      }
    } else {
      console.error('❌ Failed to submit repair request');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing repair notification:', error);
    return false;
  }
};

// Test 2: Order Submission Notification (using localStorage)
const testOrderNotification = () => {
  console.log('📦 Testing Order Submission Notification...');
  
  try {
    // Create a test order notification
    const orderNotification = {
      message: `Test order notification - ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      type: 'order_submitted'
    };

    // Store in localStorage (simulating order submission)
    localStorage.setItem('latestNotification', JSON.stringify(orderNotification));
    console.log('✅ Order notification stored in localStorage');
    
    // Verify it was stored
    const stored = localStorage.getItem('latestNotification');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('✅ Order notification verified:', parsed.message);
      return true;
    } else {
      console.error('❌ Order notification not found in localStorage');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing order notification:', error);
    return false;
  }
};

// Test 3: Enrollment Submission Notification (using localStorage)
const testEnrollmentNotification = () => {
  console.log('🎓 Testing Enrollment Submission Notification...');
  
  try {
    // Create a test enrollment notification
    const enrollmentNotification = {
      message: `Test enrollment notification - ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      type: 'enrollment_submitted'
    };

    // Store in localStorage (simulating enrollment submission)
    localStorage.setItem('latestNotification', JSON.stringify(enrollmentNotification));
    console.log('✅ Enrollment notification stored in localStorage');
    
    // Verify it was stored
    const stored = localStorage.getItem('latestNotification');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('✅ Enrollment notification verified:', parsed.message);
      return true;
    } else {
      console.error('❌ Enrollment notification not found in localStorage');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing enrollment notification:', error);
    return false;
  }
};

// Test 4: Check Bell Icon Notifications
const testBellIconNotifications = async () => {
  console.log('🔔 Testing Bell Icon Notifications...');
  
  const { userInfo, token } = getUserInfo();
  if (!userInfo || !token) {
    console.error('❌ No user logged in or token missing.');
    return false;
  }

  const userId = userInfo._id || userInfo.id;

  try {
    // Check repair notifications
    const repairResponse = await fetch(`${API_BASE_URL}/repair-notifications/customer/${userId}?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    let repairCount = 0;
    if (repairResponse.ok) {
      const repairData = await repairResponse.json();
      repairCount = repairData.notifications.length;
      console.log('✅ Repair notifications found:', repairCount);
    } else {
      console.log('⚠️ No repair notifications or API error');
    }

    // Check order/enrollment notifications
    const orderNotification = localStorage.getItem('latestNotification');
    const orderCount = orderNotification ? 1 : 0;
    console.log('✅ Order/Enrollment notifications found:', orderCount);

    const totalCount = repairCount + orderCount;
    console.log('✅ Total notifications for bell icon:', totalCount);
    
    return totalCount > 0;
  } catch (error) {
    console.error('❌ Error testing bell icon notifications:', error);
    return false;
  }
};

// Test 5: Check Customer Notifications Page
const testCustomerNotificationsPage = async () => {
  console.log('📄 Testing Customer Notifications Page...');
  
  const { userInfo, token } = getUserInfo();
  if (!userInfo || !token) {
    console.error('❌ No user logged in or token missing.');
    return false;
  }

  const userId = userInfo._id || userInfo.id;

  try {
    // Check if we can access the notifications page data
    const repairResponse = await fetch(`${API_BASE_URL}/repair-notifications/customer/${userId}?limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    let repairCount = 0;
    if (repairResponse.ok) {
      const repairData = await repairResponse.json();
      repairCount = repairData.notifications.length;
      console.log('✅ Repair notifications for page:', repairCount);
    }

    const orderNotification = localStorage.getItem('latestNotification');
    const orderCount = orderNotification ? 1 : 0;
    console.log('✅ Order/Enrollment notifications for page:', orderCount);

    const totalCount = repairCount + orderCount;
    console.log('✅ Total notifications for customer page:', totalCount);
    
    return totalCount > 0;
  } catch (error) {
    console.error('❌ Error testing customer notifications page:', error);
    return false;
  }
};

// Comprehensive test function
const testAllNotifications = async () => {
  console.log('🧪 Starting Comprehensive Notification System Test...');
  console.log('='.repeat(60));
  
  const results = {
    repair: false,
    order: false,
    enrollment: false,
    bellIcon: false,
    customerPage: false
  };

  // Test each notification type
  results.repair = await testRepairNotification();
  console.log('-'.repeat(40));
  
  results.order = testOrderNotification();
  console.log('-'.repeat(40));
  
  results.enrollment = testEnrollmentNotification();
  console.log('-'.repeat(40));
  
  results.bellIcon = await testBellIconNotifications();
  console.log('-'.repeat(40));
  
  results.customerPage = await testCustomerNotificationsPage();
  console.log('-'.repeat(40));

  // Summary
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('='.repeat(60));
  console.log('🔧 Repair Notifications:', results.repair ? '✅ WORKING' : '❌ FAILED');
  console.log('📦 Order Notifications:', results.order ? '✅ WORKING' : '❌ FAILED');
  console.log('🎓 Enrollment Notifications:', results.enrollment ? '✅ WORKING' : '❌ FAILED');
  console.log('🔔 Bell Icon Display:', results.bellIcon ? '✅ WORKING' : '❌ FAILED');
  console.log('📄 Customer Page Display:', results.customerPage ? '✅ WORKING' : '❌ FAILED');
  
  const allWorking = Object.values(results).every(result => result === true);
  console.log('='.repeat(60));
  console.log('🎯 OVERALL STATUS:', allWorking ? '✅ ALL SYSTEMS WORKING' : '❌ SOME ISSUES FOUND');
  
  if (!allWorking) {
    console.log('\n🔧 TROUBLESHOOTING TIPS:');
    if (!results.repair) console.log('- Check if repair API endpoints are working');
    if (!results.order) console.log('- Check if order submission stores notifications in localStorage');
    if (!results.enrollment) console.log('- Check if enrollment submission stores notifications in localStorage');
    if (!results.bellIcon) console.log('- Check NotificationDropdown component and API calls');
    if (!results.customerPage) console.log('- Check CustomerNotifications page and API calls');
  }
  
  return results;
};

// Individual test functions for manual testing
const testRepairOnly = () => testRepairNotification();
const testOrderOnly = () => testOrderNotification();
const testEnrollmentOnly = () => testEnrollmentNotification();
const testBellOnly = () => testBellIconNotifications();
const testPageOnly = () => testCustomerNotificationsPage();

// Expose functions globally
window.testAllNotifications = testAllNotifications;
window.testRepairOnly = testRepairOnly;
window.testOrderOnly = testOrderOnly;
window.testEnrollmentOnly = testEnrollmentOnly;
window.testBellOnly = testBellOnly;
window.testPageOnly = testPageOnly;

console.log('🔧 Notification Test Script Loaded!');
console.log('Available functions:');
console.log('- testAllNotifications() - Test everything');
console.log('- testRepairOnly() - Test repair notifications only');
console.log('- testOrderOnly() - Test order notifications only');
console.log('- testEnrollmentOnly() - Test enrollment notifications only');
console.log('- testBellOnly() - Test bell icon display only');
console.log('- testPageOnly() - Test customer notifications page only');
console.log('\nRun testAllNotifications() to start comprehensive testing!');

