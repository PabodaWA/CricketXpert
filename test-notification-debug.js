/**
 * Debug script for Repair Notification System
 * 
 * This script helps debug why repair notifications might not be showing up.
 * Run this in the browser console to test the notification system.
 */

// Test function to check if notifications are being created
const testRepairNotifications = async () => {
  console.log('🧪 Testing Repair Notification System...');
  
  try {
    // Check if user is logged in
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || (!userInfo._id && !userInfo.id)) {
      console.error('❌ No user logged in. Please log in first.');
      return;
    }
    
    const userId = userInfo._id || userInfo.id;
    console.log('✅ User logged in:', userInfo.username, '(ID:', userId + ')');
    
    // Check if token exists
    const token = userInfo?.token || localStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found.');
      return;
    }
    
    console.log('✅ Authentication token found');
    
    // Test API endpoint
    console.log('🔍 Testing repair notifications API...');
    const response = await fetch(`http://localhost:5000/api/repair-notifications/customer/${userId}?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      console.log(`📊 Found ${data.notifications?.length || 0} notifications`);
      console.log(`📊 Unread count: ${data.unreadCount || 0}`);
      
      if (data.notifications && data.notifications.length > 0) {
        console.log('📋 Notifications:');
        data.notifications.forEach((notif, index) => {
          console.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${notif.isRead ? 'Read' : 'Unread'}`);
        });
      } else {
        console.log('ℹ️ No repair notifications found');
      }
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Test function to manually trigger notification refresh
const refreshNotifications = () => {
  console.log('🔄 Manually triggering notification refresh...');
  window.dispatchEvent(new CustomEvent('repairRequestSubmitted'));
  console.log('✅ Event dispatched');
};

// Test function to check repair requests
const checkRepairRequests = async () => {
  console.log('🔍 Checking repair requests...');
  
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || (!userInfo._id && !userInfo.id)) {
      console.error('❌ No user logged in.');
      return;
    }
    
    const userId = userInfo._id || userInfo.id;
    const token = userInfo?.token || localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:5000/api/repairs/dashboard/customer/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Repair requests found:', data.length);
      if (data.length > 0) {
        console.log('📋 Recent repair requests:');
        data.slice(0, 3).forEach((req, index) => {
          console.log(`  ${index + 1}. ${req.damageType} - ${req.status} (${new Date(req.createdAt).toLocaleString()})`);
        });
      }
    } else {
      console.error('❌ Failed to fetch repair requests:', response.status);
    }
  } catch (error) {
    console.error('❌ Error checking repair requests:', error);
  }
};

// Test function to simulate repair request submission
const simulateRepairSubmission = () => {
  console.log('🎭 Simulating repair request submission...');
  window.dispatchEvent(new CustomEvent('repairRequestSubmitted', {
    detail: { 
      repairRequest: { 
        _id: 'test123', 
        damageType: 'Test Damage',
        status: 'Pending'
      } 
    }
  }));
  console.log('✅ Simulation event dispatched');
};

// Make functions available globally
window.testRepairNotifications = testRepairNotifications;
window.refreshNotifications = refreshNotifications;
window.checkRepairRequests = checkRepairRequests;
window.simulateRepairSubmission = simulateRepairSubmission;

console.log('🔧 Debug functions loaded!');
console.log('Available functions:');
console.log('  - testRepairNotifications() - Test the notification system');
console.log('  - refreshNotifications() - Manually refresh notifications');
console.log('  - checkRepairRequests() - Check repair requests for current user');
console.log('  - simulateRepairSubmission() - Simulate a repair request submission');
console.log('');
console.log('Run testRepairNotifications() to start debugging...');
