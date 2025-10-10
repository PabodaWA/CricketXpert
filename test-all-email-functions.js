import dotenv from 'dotenv';
import {
  sendWelcomeEmail,
  sendNewUserNotification,
  sendPasswordResetCodeEmail,
  sendEmailVerificationCode,
  sendLowStockAlert,
  sendOrderConfirmationEmail,
  sendOrderManagerNotificationEmail,
  sendSupplierOrderEmail,
  sendCertificateEmail,
  sendAttendanceNotificationEmail
} from './utils/wemailService.js';

// Load environment variables
dotenv.config();

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date()
};

const testProduct = {
  productId: 'PROD001',
  name: 'Test Cricket Bat',
  category: 'Equipment',
  brand: 'Test Brand',
  stock_quantity: 5,
  price: 15000
};

const testOrder = {
  _id: 'ORDER123',
  date: new Date(),
  status: 'Confirmed',
  amount: 25000,
  address: '123 Test Street, Colombo',
  paymentId: 'PAY123',
  items: [
    {
      productId: { name: 'Test Product' },
      quantity: 2,
      priceAtOrder: 12500
    }
  ]
};

const testCustomer = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+94123456789'
};

const testSession = {
  title: 'Test Coaching Session',
  scheduledDate: new Date(),
  startTime: '10:00 AM',
  endTime: '12:00 PM',
  description: 'Test session description'
};

async function testAllEmailFunctions() {
  console.log('🧪 Testing all email functions...\n');
  
  const tests = [
    {
      name: 'Welcome Email',
      func: () => sendWelcomeEmail('test@example.com', 'TestUser'),
      description: 'Sends welcome email to new user'
    },
    {
      name: 'New User Notification',
      func: () => sendNewUserNotification(testUser),
      description: 'Sends notification to manager about new user'
    },
    {
      name: 'Password Reset Code',
      func: () => sendPasswordResetCodeEmail('test@example.com', '123456'),
      description: 'Sends password reset code'
    },
    {
      name: 'Email Verification Code',
      func: () => sendEmailVerificationCode('test@example.com', '789012'),
      description: 'Sends email verification code'
    },
    {
      name: 'Low Stock Alert',
      func: () => sendLowStockAlert(testProduct),
      description: 'Sends low stock alert to manager'
    },
    {
      name: 'Order Confirmation',
      func: () => sendOrderConfirmationEmail(testOrder, testCustomer),
      description: 'Sends order confirmation to customer'
    },
    {
      name: 'Order Manager Notification',
      func: () => sendOrderManagerNotificationEmail(testOrder, testCustomer),
      description: 'Sends order notification to manager'
    },
    {
      name: 'Supplier Order Email',
      func: () => sendSupplierOrderEmail(testProduct, 50, 'supplier@example.com'),
      description: 'Sends supplier order request'
    },
    {
      name: 'Certificate Email',
      func: () => sendCertificateEmail('test@example.com', 'John Doe', 'Cricket Coaching', 'CERT123'),
      description: 'Sends certificate completion email'
    },
    {
      name: 'Attendance Notification',
      func: () => sendAttendanceNotificationEmail(testCustomer, testSession, 'present', 'Coach Smith'),
      description: 'Sends attendance notification'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📧 Testing ${test.name}...`);
      console.log(`   Description: ${test.description}`);
      
      const result = await test.func();
      
      if (result === true || result?.success === true) {
        console.log(`   ✅ ${test.name} - PASSED\n`);
        passed++;
      } else {
        console.log(`   ❌ ${test.name} - FAILED (returned: ${result})\n`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.name} - ERROR: ${error.message}\n`);
      failed++;
    }
  }

  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All email functions are working correctly!');
  } else {
    console.log('\n⚠️ Some email functions need attention.');
  }
}

// Run the tests
testAllEmailFunctions().catch(console.error);
