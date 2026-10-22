import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

console.log('🔍 TESTING ATTENDANCE-ONLY ENDPOINT\n');

async function testAttendanceOnlyEndpoint() {
  try {
    console.log('📋 Testing PUT /api/coaches/attendance-only endpoint...\n');
    
    // Test data (like what frontend sends)
    const testData = {
      sessionId: 'test-session-id', // This will fail, but we'll see the error
      attendanceData: [
        {
          participantId: 'test-participant-id',
          attended: true
        }
      ]
    };
    
    console.log('📤 Sending test request to:', 'http://https://cricketxpert-backend.vercel.app/api/coaches/attendance-only');
    console.log('📊 Test data:', JSON.stringify(testData, null, 2));
    
    try {
      const response = await axios.put(
        'http://https://cricketxpert-backend.vercel.app/api/coaches/attendance-only',
        testData,
        {
          timeout: 5000, // 5 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Response received:');
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Connection refused - Server is not running');
        console.log('Solution: Start your server with "npm start"');
      } else if (error.response) {
        console.log('📡 Server responded with error:');
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 404) {
          console.log('❌ Endpoint not found - Check if the route is properly defined');
        } else if (error.response.status === 500) {
          console.log('❌ Server error - Check server console for error messages');
        }
      } else if (error.code === 'ENOTFOUND') {
        console.log('❌ Server not found - Check if server is running on https://cricketxpert-backend.vercel.app');
      } else {
        console.log('❌ Error:', error.message);
      }
    }
    
    console.log('\n📋 DEBUGGING CHECKLIST:');
    console.log('');
    console.log('1. ✅ Is your server running?');
    console.log('   Run: npm start');
    console.log('   Check: http://https://cricketxpert-backend.vercel.app');
    console.log('');
    console.log('2. ✅ Is the attendance-only endpoint accessible?');
    console.log('   Check: PUT /api/coaches/attendance-only');
    console.log('');
    console.log('3. ✅ Are you using the correct session ID?');
    console.log('   Check: Use real session ID from your database');
    console.log('');
    console.log('4. ✅ Are participant IDs correct?');
    console.log('   Check: Use participant._id from session.participants');
    console.log('');
    console.log('5. ✅ Check server console for error messages');
    console.log('   Look for: "📧 Sending attendance notification emails..."');
    console.log('   Look for: "✅ Professional attendance notification sent to [email]"');
    console.log('   Look for: "❌ Failed to send professional email to [email]"');
    console.log('');
    
    console.log('🎯 NEXT STEPS:');
    console.log('1. Start your server: npm start');
    console.log('2. Mark attendance in coach dashboard');
    console.log('3. Watch server console for email messages');
    console.log('4. Check your email inbox');
    console.log('');
    console.log('If emails are still not being sent:');
    console.log('- Check server console for error messages');
    console.log('- Verify customers have email addresses');
    console.log('- Ensure session data is complete');
    console.log('- Test with real session and participant IDs');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testAttendanceOnlyEndpoint().catch(console.error);
