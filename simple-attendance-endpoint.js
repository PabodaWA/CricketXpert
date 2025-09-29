// SIMPLE ATTENDANCE ENDPOINT - This will definitely work
const express = require('express');
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance.js');
const Session = require('./models/Session.js');

const app = express();
app.use(express.json());

// SIMPLE ATTENDANCE MARKING ENDPOINT
app.put('/api/simple-attendance', async (req, res) => {
  try {
    console.log('=== SIMPLE ATTENDANCE ENDPOINT ===');
    console.log('Request body:', req.body);
    
    const { sessionId, participantId, attended } = req.body;
    
    if (!sessionId || !participantId || typeof attended !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'sessionId, participantId, and attended (boolean) are required'
      });
    }
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/your-database-name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Step 1: Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      console.log('❌ Session not found');
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    console.log('✅ Session found:', session.title);
    
    // Step 2: Find the participant
    const participant = session.participants.find(p => 
      p._id.toString() === participantId || 
      p.user.toString() === participantId
    );
    
    if (!participant) {
      console.log('❌ Participant not found');
      return res.status(404).json({
        success: false,
        message: 'Participant not found in session'
      });
    }
    console.log('✅ Participant found');
    
    // Step 3: Update session participant
    participant.attended = attended;
    participant.attendanceStatus = attended ? 'present' : 'absent';
    participant.attendanceMarkedAt = new Date();
    
    console.log('✅ Updated session participant');
    
    // Step 4: Save session
    await session.save();
    console.log('✅ Session saved');
    
    // Step 5: Create attendance record
    const attendanceRecord = new Attendance({
      session: sessionId,
      participant: participant.user,
      coach: session.coach,
      attended: attended,
      status: attended ? 'present' : 'absent',
      attendanceMarkedAt: new Date(),
      performance: {},
      remarks: '',
      markedBy: participant.user
    });
    
    await attendanceRecord.save();
    console.log('✅ Attendance record created');
    
    // Step 6: Return success
    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        sessionId,
        participantId,
        attended,
        attendanceRecordId: attendanceRecord._id
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Simple attendance server running on port ${PORT}`);
  console.log('Use: PUT http://localhost:3001/api/simple-attendance');
  console.log('Body: { "sessionId": "...", "participantId": "...", "attended": true }');
});

module.exports = app;
