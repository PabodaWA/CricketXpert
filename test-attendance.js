// Simple test script to verify the new attendance system
import axios from 'axios';

const testAttendance = async () => {
  try {
    console.log('Testing new attendance system...');
    
    const response = await axios.post('http://localhost:5000/api/attendance/mark', {
      sessionId: '68d43af4b4fb08864e99194c',
      attendanceData: [{
        participantId: '68d43af4b4fb08864e99194d',
        attended: true,
        performance: {
          rating: 5,
          notes: 'Test attendance'
        }
      }],
      coachId: '68d438cb66caa02c82ffdd9f',
      markedBy: '68d438cb66caa02c82ffdd9f'
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testAttendance();
