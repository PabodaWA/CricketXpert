import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function monitorAttendanceMarking() {
  console.log('🔍 MONITORING ATTENDANCE MARKING PROCESS...\n');
  
  console.log('📋 Instructions:');
  console.log('1. Keep this script running');
  console.log('2. Go to your coach dashboard');
  console.log('3. Mark attendance for a session');
  console.log('4. Watch this console for any errors or issues');
  console.log('5. Check your server console logs as well');
  console.log('');
  
  // Test the endpoint with a simple request first
  console.log('🧪 Testing endpoint accessibility...');
  
  try {
    const response = await axios.put(
      'http://https://cricketxpert-backend.vercel.app/api/coaches/attendance-only',
      {
        sessionId: 'test',
        attendanceData: [{ participantId: 'test', attended: true }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );
    
    console.log('❌ Unexpected success with test data');
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Endpoint is accessible (404 expected for test data)');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running - start your server first!');
      console.log('   Run: npm start or npm run dev');
      return;
    } else {
      console.log('⚠️  Unexpected error:', error.message);
    }
  }
  
  console.log('');
  console.log('🎯 Now mark attendance in your coach dashboard...');
  console.log('📊 Watch for these messages in your SERVER console:');
  console.log('   - "=== ATTENDANCE ONLY (NO COACH DATA) ==="');
  console.log('   - "📧 Sending attendance notification emails..."');
  console.log('   - "✅ Professional attendance notification sent to [email]"');
  console.log('');
  console.log('📧 Check your email inbox for attendance notifications');
  console.log('');
  console.log('Press Ctrl+C to stop monitoring...');
  
  // Keep the script running
  setInterval(() => {
    // Just keep the script alive
  }, 1000);
}

monitorAttendanceMarking();

