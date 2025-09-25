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
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgramEnrollment',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  attended: {
    type: Boolean,
    default: false,
    required: true
  },
  attendanceMarkedAt: {
    type: Date,
    default: Date.now
  },
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent'
  },
  remarks: String,
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
attendanceSchema.index({ session: 1, participant: 1 }, { unique: true });
attendanceSchema.index({ coach: 1, attendanceMarkedAt: -1 });
attendanceSchema.index({ participant: 1, session: 1 });

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
      .populate('enrollment')
      .sort({ attendanceMarkedAt: -1 });
  } catch (error) {
    throw new Error(`Error fetching session attendance: ${error.message}`);
  }
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
