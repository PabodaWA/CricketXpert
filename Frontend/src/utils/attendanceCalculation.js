/**
 * Calculates the attendance percentage for a user in a program
 * @param {Array} sessions - Array of session objects
 * @param {string} userId - The ID of the user
 * @returns {Object} Object containing { totalSessions: number, attendedSessions: number, percentage: number }
 */
export const calculateAttendancePercentage = (sessions, userId) => {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return { totalSessions: 0, attendedSessions: 0, percentage: 0 };
  }

  const totalSessions = sessions.length;
  const attendedSessions = sessions.filter(session => {
    const participant = session.participants?.find(p => p.user?._id === userId || p.user === userId);
    return participant?.attended === true || participant?.attendanceStatus === 'present';
  }).length;

  const percentage = Math.round((attendedSessions / totalSessions) * 100) || 0;
  
  return { totalSessions, attendedSessions, percentage };
};

/**
 * Checks if a program should be marked as completed based on attendance
 * @param {Array} sessions - Array of session objects
 * @param {string} userId - The ID of the user
 * @returns {boolean} True if attendance is 75% or higher
 */
export const isProgramCompleted = (sessions, userId) => {
  const { percentage } = calculateAttendancePercentage(sessions, userId);
  return percentage >= 75;
};
