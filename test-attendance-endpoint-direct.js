import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAttendanceEndpointDirect() {
  console.log('🧪 Testing Attendance Endpoint Directly...\n');
  
  // Test with dummy data first to see if the endpoint is working
  const testData = {
    sessionId: '507f1f77bcf86cd799439011', // Dummy MongoDB ObjectId
    attendanceData: [
      {
        participantId: '507f1f77bcf86cd799439012', // Dummy MongoDB ObjectId
        attended: true
      }
    ]
  };
  
  console.log('📋 Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');
  
  try {
    console.log('📤 Sending request to attendance endpoint...');
    
    const response = await axios.put(
      'http://https://cricketxpert-backend.vercel.app/api/coaches/attendance-only',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log('✅ Request successful!');
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Request failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused - is the server running?');
      console.error('   Make sure to start your server with: npm start or npm run dev');
    } else if (error.response) {
      console.error('📊 Error Response Status:', error.response.status);
      console.error('📊 Error Response Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.error('🔍 Session not found - this is expected with dummy data');
        console.error('   The endpoint is working, but needs real session/participant IDs');
      }
    } else {
      console.error('❓ Other error:', error.message);
    }
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Make sure your server is running (npm start or npm run dev)');
  console.log('2. Mark attendance in the coach dashboard');
  console.log('3. Check the server console logs for email sending messages');
  console.log('4. Check your email inbox for attendance notifications');
  console.log('5. If no emails, check the server logs for error messages');
}

// Run the test
testAttendanceEndpointDirect();

