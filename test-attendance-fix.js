import axios from 'axios';

const testAttendanceFix = async () => {
  try {
    console.log('=== TESTING ATTENDANCE FIX ===\n');

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test if server is running
    try {
      const response = await axios.get('http://localhost:5000/api/sessions/test');
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Now test the attendance marking
    console.log('\n🔍 Testing attendance marking...');
    
    // We need to get a session ID first
    // Let's try to get sessions (this will require authentication, but let's see what happens)
    try {
      const sessionsResponse = await axios.get('http://localhost:5000/api/sessions');
      console.log('✅ Sessions accessible');
      console.log('Sessions found:', sessionsResponse.data);
    } catch (error) {
      console.log('❌ Sessions require authentication:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Error testing attendance fix:', error);
  }
};

testAttendanceFix();
