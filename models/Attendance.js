import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  attended: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  attendanceMarkedAt: {
    type: Date,
    default: Date.now
  },
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    notes: {
      type: String,
      default: ''
    }
  },
  remarks: {
    type: String,
    default: ''
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ session: 1, participant: 1 }, { unique: true });
attendanceSchema.index({ session: 1 });
attendanceSchema.index({ participant: 1 });
attendanceSchema.index({ coach: 1 });

// Virtual for attendance status
attendanceSchema.virtual('isPresent').get(function() {
  return this.attended && this.status === 'present';
});

// Static method to mark attendance for multiple participants
attendanceSchema.statics.markSessionAttendance = async function(sessionId, attendanceData, coachId, markedBy) {
  try {
    const Attendance = this;
    const results = [];

    for (const attendance of attendanceData) {
      const { participantId, attended, performance, status = 'present', remarks } = attendance;
      
      // Create or update attendance record
      const attendanceRecord = await Attendance.findOneAndUpdate(
        { 
          session: sessionId, 
          participant: participantId 
        },
        {
          session: sessionId,
          participant: participantId,
          coach: coachId,
          attended: attended,
          status: attended ? status : 'absent',
          attendanceMarkedAt: new Date(),
          performance: performance || {},
          remarks: remarks,
          markedBy: markedBy
        },
        { 
          upsert: true, 
          new: true 
        }
      );

      results.push(attendanceRecord);
    }

    return results;
  } catch (error) {
    throw new Error(`Error marking session attendance: ${error.message}`);
  }
};

// Static method to get session attendance
attendanceSchema.statics.getSessionAttendance = async function(sessionId) {
  try {
    return await this.find({ session: sessionId })
      .populate('participant', 'firstName lastName email')
      .populate('coach', 'userId')
      .populate('markedBy', 'firstName lastName')
      .sort({ attendanceMarkedAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching session attendance: ${error.message}`);
  }
};

// Static method to get attendance for a specific participant in a session
attendanceSchema.statics.getParticipantAttendance = async function(sessionId, participantId) {
  try {
    return await this.findOne({ 
      session: sessionId, 
      participant: participantId 
    })
    .populate('participant', 'firstName lastName email')
    .populate('coach', 'userId')
    .populate('markedBy', 'firstName lastName');
  } catch (error) {
    throw new Error(`Error fetching participant attendance: ${error.message}`);
  }
};

// Static method to update session participants attendance status
attendanceSchema.statics.updateSessionParticipants = async function(sessionId, attendanceData) {
  try {
    const Session = mongoose.model('Session');
    
    for (const attendance of attendanceData) {
      await Session.updateOne(
        { 
          _id: sessionId,
          'participants.user': attendance.participantId
        },
        {
          $set: {
            'participants.$.attended': attendance.attended,
            'participants.$.attendanceMarkedAt': new Date()
          }
        }
      );
    }
    
    return true;
  } catch (error) {
    throw new Error(`Error updating session participants: ${error.message}`);
  }
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;