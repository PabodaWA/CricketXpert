/**
 * Test script for Repair Notification System
 * 
 * This script tests the repair notification functionality by:
 * 1. Creating a test repair request
 * 2. Verifying notification creation
 * 3. Testing notification retrieval
 * 
 * Run this script after starting the server to test the repair notification system.
 */

import RepairRequest from './models/RepairRequest.js';
import RepairNotification from './models/RepairNotification.js';
import User from './models/User.js';
import repairNotificationController from './controllers/repairNotificationController.js';
import connectDB from './config/db.js';

// Connect to database
connectDB();

const testRepairNotificationSystem = async () => {
  try {
    console.log('🧪 Starting Repair Notification System Test...\n');

    // Find a test user (or create one if needed)
    let testUser = await User.findOne({ role: 'customer' });
    if (!testUser) {
      console.log('❌ No customer user found. Please create a customer user first.');
      return;
    }

    console.log(`✅ Found test user: ${testUser.username} (ID: ${testUser._id})`);

    // Test 1: Create a repair request
    console.log('\n📝 Test 1: Creating a repair request...');
    const repairData = {
      customerId: testUser._id,
      equipmentType: 'cricket_bat',
      damageType: 'Handle Damage',
      description: 'Test repair request for notification system',
      status: 'Pending',
      repairProgress: 0,
      currentStage: 'Request Submitted'
    };

    const repairRequest = await RepairRequest.create(repairData);
    console.log(`✅ Repair request created: ${repairRequest._id}`);

    // Test 2: Create repair submission notification
    console.log('\n🔔 Test 2: Creating repair submission notification...');
    const notification = await repairNotificationController.createRepairSubmissionNotification(
      testUser._id,
      repairRequest._id,
      repairData
    );

    if (notification) {
      console.log(`✅ Repair submission notification created: ${notification._id}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Type: ${notification.type}`);
    } else {
      console.log('❌ Failed to create repair submission notification');
    }

    // Test 3: Retrieve notifications for customer
    console.log('\n📋 Test 3: Retrieving notifications for customer...');
    const notifications = await RepairNotification.find({ customerId: testUser._id })
      .populate('repairRequestId', 'equipmentType damageType status')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${notifications.length} notifications for customer`);
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} (${notif.type}) - ${notif.isRead ? 'Read' : 'Unread'}`);
    });

    // Test 4: Test status change notification
    console.log('\n🔄 Test 4: Testing status change notification...');
    const statusNotification = await repairNotificationController.createRepairStatusNotification(
      testUser._id,
      repairRequest._id,
      'Approved',
      {
        equipmentType: repairData.equipmentType,
        damageType: repairData.damageType,
        status: 'Approved',
        repairProgress: 0,
        costEstimate: 150,
        timeEstimate: '3-5 days'
      }
    );

    if (statusNotification) {
      console.log(`✅ Status change notification created: ${statusNotification._id}`);
      console.log(`   Title: ${statusNotification.title}`);
      console.log(`   Message: ${statusNotification.message}`);
    } else {
      console.log('❌ Failed to create status change notification');
    }

    // Test 5: Test notification count
    console.log('\n📊 Test 5: Testing notification count...');
    const totalCount = await RepairNotification.countDocuments({ customerId: testUser._id });
    const unreadCount = await RepairNotification.countDocuments({ 
      customerId: testUser._id, 
      isRead: false 
    });

    console.log(`✅ Total notifications: ${totalCount}`);
    console.log(`✅ Unread notifications: ${unreadCount}`);

    // Test 6: Test mark as read
    console.log('\n👁️ Test 6: Testing mark as read...');
    if (notifications.length > 0) {
      const firstNotification = notifications[0];
      firstNotification.isRead = true;
      await firstNotification.save();
      console.log(`✅ Marked notification ${firstNotification._id} as read`);
    }

    // Final verification
    console.log('\n🎯 Final Verification:');
    const finalUnreadCount = await RepairNotification.countDocuments({ 
      customerId: testUser._id, 
      isRead: false 
    });
    console.log(`✅ Final unread count: ${finalUnreadCount}`);

    console.log('\n🎉 Repair Notification System Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Test user: ${testUser.username}`);
    console.log(`   - Repair request: ${repairRequest._id}`);
    console.log(`   - Total notifications created: ${totalCount}`);
    console.log(`   - Unread notifications: ${finalUnreadCount}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
};

// Run the test
testRepairNotificationSystem();
