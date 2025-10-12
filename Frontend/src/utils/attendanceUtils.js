export const getAttendanceStatus = (session, userId) => {
  // Get the current user's participant info for this session
  const participant = session.participants?.find(p => p.user?._id === userId);
  
  // Check if the session is in the past or future
  const sessionDate = session.scheduledDate ? new Date(session.scheduledDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isPastSession = sessionDate ? sessionDate < today : false;
  const isFutureSession = sessionDate ? sessionDate > today : false;

  // For future sessions, always return "Not Marked" in gray
  if (isFutureSession) {
    return { 
      status: 'Not Marked', 
      class: 'bg-gray-100 text-gray-800' 
    };
  }

  // For past sessions, check attendance status
  if (participant) {
    if (participant.attended === true || participant.attendanceStatus === 'present') {
      return { status: 'Present', class: 'bg-green-100 text-green-800' };
    } else if (participant.attended === false || participant.attendanceStatus === 'absent') {
      return { status: 'Absent', class: 'bg-red-100 text-red-800' };
    }
  }
  
  // If we get here, it's a past session with no attendance marked
  return { 
    status: 'Not Marked', 
    class: 'bg-yellow-100 text-yellow-800'
  };
};