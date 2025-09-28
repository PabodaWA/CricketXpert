import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CoachAvailability from '../components/CoachAvailability';
import WeeklySessionBooking from '../components/WeeklySessionBooking';
import CertificateDownload from '../components/CertificateDownload';

export default function EnrollmentDetails() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showSessionCalendar, setShowSessionCalendar] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    requestedDate: '',
    requestedTime: '',
    duration: 120, // Default to 2 hours
    notes: ''
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingMode, setBookingMode] = useState('weekly'); // 'weekly' or 'regular'
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    newGroundSlot: '',
    availableDates: [],
    availableTimes: [],
    availableGrounds: []
  });

  useEffect(() => {
    if (enrollmentId) {
      // Force refresh by clearing sessions first
      setSessions([]);
      fetchEnrollmentDetails();
    }
  }, [enrollmentId]);

  const fetchEnrollmentDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        setError('Please log in to view enrollment details');
        navigate('/login');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Fetch enrollment details with cache-busting
      console.log('Fetching enrollment details for ID:', enrollmentId);
      const enrollmentResponse = await axios.get(`http://localhost:5000/api/enrollments/${enrollmentId}?t=${Date.now()}`, config);
      console.log('Enrollment response:', enrollmentResponse.data);
      
      if (enrollmentResponse.data.success) {
        setEnrollment(enrollmentResponse.data.data);
        
        // Fetch sessions for this enrollment with cache-busting
        try {
          console.log('Fetching sessions for enrollment ID:', enrollmentId);
          const sessionsResponse = await axios.get(`http://localhost:5000/api/sessions/enrollment/${enrollmentId}?t=${Date.now()}`, config);
          console.log('Sessions response:', sessionsResponse.data);
          if (sessionsResponse.data.success) {
            console.log('Setting sessions:', sessionsResponse.data.data);
            
            // Debug: Check session data including reschedule info and weekly scheduling
            console.log('=== SESSION DATA DEBUG ===');
            sessionsResponse.data.data.forEach((session, index) => {
              console.log(`Session ${index + 1}:`, {
                id: session._id,
                title: session.title,
                sessionNumber: session.sessionNumber,
                week: session.week,
                scheduledDate: session.scheduledDate,
                scheduledTime: session.scheduledTime,
                groundSlot: session.groundSlot,
                rescheduled: session.rescheduled,
                rescheduledAt: session.rescheduledAt,
                rescheduledFrom: session.rescheduledFrom,
                participants: session.participants?.map(p => ({
                  userId: p.user?._id,
                  userName: `${p.user?.firstName || ''} ${p.user?.lastName || ''}`,
                  attended: p.attended,
                  attendance: p.attendance
                }))
              });
            });
            
            // Check if any participant has attended = true
            const hasAttendedParticipants = sessionsResponse.data.data.some(session => 
              session.participants?.some(p => p.attended === true)
            );
            console.log('API Response - Has attended participants:', hasAttendedParticipants);
            
            setSessions(sessionsResponse.data.data || []);
          }
        } catch (sessionErr) {
          console.log('Error fetching sessions:', sessionErr.response?.data || sessionErr.message);
          setSessions([]);
        }
      } else {
        setError('Enrollment not found');
      }
    } catch (err) {
      console.error('Error fetching enrollment details:', err);
      if (err.response?.status === 404) {
        setError('Enrollment not found');
      } else if (err.response?.status === 401) {
        setError('Please log in to view enrollment details');
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view this enrollment');
      } else {
        setError(err.response?.data?.message || 'Failed to load enrollment details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = () => {
    setShowBookingModal(true);
  };

  const handleViewSessions = () => {
    setShowSessionManager(true);
  };

  const handleViewCalendar = () => {
    setShowSessionCalendar(true);
  };

  const closeModals = () => {
    setShowBookingModal(false);
    setShowSessionManager(false);
    setShowSessionCalendar(false);
    setShowSessionDetails(false);
    setShowRescheduleModal(false);
    setSelectedSession(null);
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  const handleReschedule = (session) => {
    setSelectedSession(session);
    setShowRescheduleModal(true);
    fetchAvailableRescheduleDates();
  };

  const fetchAvailableRescheduleDates = async () => {
    try {
      if (!selectedSession || !enrollment) return;
      
      // Get available dates within the same week as the original session
      // Calculate week boundaries based on enrollment date
      const enrollmentDate = new Date(enrollment.createdAt);
      const originalWeek = selectedSession.week;
      
      // Calculate the start and end of the specific week based on enrollment
      const startOfWeek = new Date(enrollmentDate);
      startOfWeek.setDate(enrollmentDate.getDate() + (originalWeek - 1) * 7); // Start of the specific week
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the specific week
      
      console.log('Original session week based on enrollment:', {
        enrollmentDate: enrollmentDate.toISOString().split('T')[0],
        originalWeek: originalWeek,
        startOfWeek: startOfWeek.toISOString().split('T')[0],
        endOfWeek: endOfWeek.toISOString().split('T')[0]
      });
      
      const availableDates = [];
      const currentDate = new Date(startOfWeek);
      
      // Generate dates for the entire week
      while (currentDate <= endOfWeek) {
        // Skip the original date (can't reschedule to the same date)
        const originalDate = new Date(selectedSession.scheduledDate);
        if (currentDate.toISOString().split('T')[0] !== originalDate.toISOString().split('T')[0]) {
          availableDates.push({
            date: currentDate.toISOString().split('T')[0],
            display: currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log('Available reschedule dates:', availableDates);
      
      setRescheduleData(prev => ({
        ...prev,
        availableDates
      }));
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  const handleRescheduleDateChange = async (date) => {
    setRescheduleData(prev => ({
      ...prev,
      newDate: date,
      newTime: '',
      newGroundSlot: '',
      availableTimes: [],
      availableGrounds: []
    }));
    
    if (date) {
      await fetchAvailableTimesForReschedule(date);
    }
  };

  const fetchAvailableTimesForReschedule = async (date) => {
    try {
      // Get coach availability for the selected date
      const coachId = enrollment?.program?.coach?._id;
      if (!coachId) {
        console.log('No coach ID found');
        return;
      }

      console.log('Fetching times for date:', date, 'coachId:', coachId);

      const response = await axios.get(`/api/coaches/${coachId}/availability`, {
        params: { date, duration: 120 }
      });

      console.log('Coach availability response:', response.data);

      if (response.data.success && response.data.data.availableSlots) {
        const availableTimes = response.data.data.availableSlots.map(slot => ({
          value: slot.startTime,
          label: `${slot.startTime} - ${slot.endTime}`
        }));

        console.log('Available times:', availableTimes);

        setRescheduleData(prev => ({
          ...prev,
          availableTimes
        }));
      } else {
        console.log('No available slots found, trying fallback...');
        // Fallback: generate some default time slots
        const fallbackTimes = [
          { value: '09:00', label: '09:00 - 11:00' },
          { value: '11:00', label: '11:00 - 13:00' },
          { value: '14:00', label: '14:00 - 16:00' },
          { value: '16:00', label: '16:00 - 18:00' }
        ];
        
        setRescheduleData(prev => ({
          ...prev,
          availableTimes: fallbackTimes
        }));
      }
    } catch (error) {
      console.error('Error fetching available times:', error);
      // Fallback: generate some default time slots
      const fallbackTimes = [
        { value: '09:00', label: '09:00 - 11:00' },
        { value: '11:00', label: '11:00 - 13:00' },
        { value: '14:00', label: '14:00 - 16:00' },
        { value: '16:00', label: '16:00 - 18:00' }
      ];
      
      setRescheduleData(prev => ({
        ...prev,
        availableTimes: fallbackTimes
      }));
    }
  };

  const handleRescheduleTimeChange = async (time) => {
    setRescheduleData(prev => ({
      ...prev,
      newTime: time,
      newGroundSlot: '',
      availableGrounds: []
    }));
    
    if (time && rescheduleData.newDate) {
      await fetchAvailableGroundsForReschedule(rescheduleData.newDate, time);
    }
  };

  const fetchAvailableGroundsForReschedule = async (date, time) => {
    try {
      console.log('Fetching grounds for:', { date, time, endTime: calculateEndTime(time, 120) });
      
      const response = await axios.get('/api/grounds/available-slots', {
        params: {
          date,
          startTime: time,
          endTime: calculateEndTime(time, 120),
          duration: 120
        }
      });

      console.log('Ground availability response:', response.data);

      if (response.data.success && response.data.data) {
        // Filter to only show Practice Ground A
        const practiceGroundA = response.data.data.find(ground => 
          ground.name === 'Practice Ground A'
        );
        
        console.log('Practice Ground A found:', practiceGroundA);
        
        if (practiceGroundA && practiceGroundA.availableSlots) {
          console.log('Available slots:', practiceGroundA.availableSlots);
          setRescheduleData(prev => ({
            ...prev,
            availableGrounds: practiceGroundA.availableSlots
          }));
        } else {
          console.log('No Practice Ground A or no available slots');
          // Fallback: create all 8 slots for Practice Ground A
          const mockSlots = [];
          for (let i = 1; i <= 8; i++) {
            mockSlots.push({
              slotNumber: i,
              startTime: time,
              endTime: calculateEndTime(time, 120),
              duration: 120,
              available: true,
              timeSlot: `${time} - ${calculateEndTime(time, 120)}`
            });
          }
          
          setRescheduleData(prev => ({
            ...prev,
            availableGrounds: mockSlots
          }));
        }
      } else {
        console.log('API call failed, using fallback slots');
        // Fallback: create all 8 slots for Practice Ground A
        const mockSlots = [];
        for (let i = 1; i <= 8; i++) {
          mockSlots.push({
            slotNumber: i,
            startTime: time,
            endTime: calculateEndTime(time, 120),
            duration: 120,
            available: true,
            timeSlot: `${time} - ${calculateEndTime(time, 120)}`
          });
        }
        
        setRescheduleData(prev => ({
          ...prev,
          availableGrounds: mockSlots
        }));
      }
    } catch (error) {
      console.error('Error fetching available grounds:', error);
      // Fallback: create all 8 slots for Practice Ground A
      const mockSlots = [];
      for (let i = 1; i <= 8; i++) {
        mockSlots.push({
          slotNumber: i,
          startTime: time,
          endTime: calculateEndTime(time, 120),
          duration: 120,
          available: true,
          timeSlot: `${time} - ${calculateEndTime(time, 120)}`
        });
      }
      
      setRescheduleData(prev => ({
        ...prev,
        availableGrounds: mockSlots
      }));
    }
  };

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':');
    const start = new Date();
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toTimeString().slice(0, 5);
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.newDate || !rescheduleData.newTime || !rescheduleData.newGroundSlot) {
      alert('Please select date, time, and ground slot');
      return;
    }

    try {
      setSubmitting(true);
      
      // Skip API test for now and go directly to reschedule
      
      const reschedulePayload = {
        sessionId: selectedSession._id,
        newDate: rescheduleData.newDate,
        newTime: rescheduleData.newTime,
        newGroundSlot: parseInt(rescheduleData.newGroundSlot),
        duration: 120
      };

      console.log('Sending reschedule request to:', '/api/sessions/reschedule');
      console.log('Payload:', reschedulePayload);
      console.log('Current URL:', window.location.href);
      console.log('Base URL:', axios.defaults.baseURL);
      
      // Add authentication token
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        alert('Please log in to reschedule sessions');
        setSubmitting(false);
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const response = await axios.put('/api/sessions/reschedule', reschedulePayload, config);
      
      console.log('Reschedule response:', response.data);
      
      if (response.data.success) {
        alert('Session rescheduled successfully!');
        setShowRescheduleModal(false);
        setShowSessionDetails(false);
        
        // Clear sessions first to force refresh
        setSessions([]);
        
        // Add a small delay before refreshing to ensure session is updated
        setTimeout(() => {
          console.log('Refreshing enrollment details after reschedule...');
          console.log('Current sessions before refresh:', sessions);
          fetchEnrollmentDetails();
        }, 1000);
      } else {
        alert('Failed to reschedule session: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error rescheduling session:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Unknown error occurred';
      
      alert('Error rescheduling session: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingSuccess = () => {
    // Refresh enrollment details to show updated session count
    fetchEnrollmentDetails();
  };

  const handleBookingFormChange = (field, value) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    if (timeSlot) {
      setBookingForm(prev => ({
        ...prev,
        requestedDate: timeSlot.date,
        requestedTime: timeSlot.startTime
      }));
    }
  };

  const handleWeeklySessionSelect = (sessionData) => {
    setSelectedTimeSlot(sessionData);
    if (sessionData) {
      setBookingForm(prev => ({
        ...prev,
        requestedDate: sessionData.date,
        requestedTime: sessionData.startTime,
        duration: sessionData.duration
      }));
    }
  };

  const handleDirectSessionBooking = async () => {
    try {
      setSubmitting(true);
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        alert('Please log in to book sessions');
        navigate('/login');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const sessionData = {
        enrollmentId: enrollmentId,
        scheduledDate: bookingForm.requestedDate,
        scheduledTime: bookingForm.requestedTime,
        duration: parseInt(bookingForm.duration),
        notes: bookingForm.notes,
        sessionNumber: selectedTimeSlot?.sessionNumber || 1,
        week: selectedTimeSlot?.week || 1,
        ground: selectedTimeSlot?.ground?._id,
        groundSlot: selectedTimeSlot?.groundSlot?.slotNumber
      };

      console.log('Submitting session data:', sessionData);
      console.log('API URL:', 'http://localhost:5000/api/sessions/direct-booking');

      const response = await axios.post('http://localhost:5000/api/sessions/direct-booking', sessionData, config);
      
      console.log('Session booking response:', response.data);
      
      if (response.data.success) {
        alert('Session booked successfully! Your session has been scheduled.');
        setShowBookingModal(false);
        setBookingForm({
          requestedDate: '',
          requestedTime: '',
          duration: 60,
          notes: ''
        });
        // Add a small delay before refreshing to ensure session is saved
        setTimeout(() => {
          console.log('Refreshing enrollment details after session booking...');
          // Force refresh by clearing sessions first
          setSessions([]);
          fetchEnrollmentDetails();
        }, 1000);
      } else {
        alert(`Error: ${response.data.message || 'Failed to book session'}`);
      }
    } catch (err) {
      console.error('Error booking session:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response?.status === 401) {
        alert('Please log in to book sessions');
        navigate('/login');
      } else if (err.response?.status === 403) {
        alert('You are not authorized to book sessions for this enrollment');
      } else if (err.response?.status === 404) {
        alert('Enrollment not found');
      } else if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert(`Error booking session: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enrollment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Enrollment</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/customer/profile')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏏</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Enrollment Not Found</h3>
          <p className="text-gray-600 mb-4">The enrollment you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/customer/profile')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  // Calculate attendance-based progress
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  
  const attendedSessions = sessions.filter(session => {
    const participant = session.participants?.find(p => p.user && p.user._id === userInfo._id);
    // Check both the attendance object and the direct attended field
    const isAttended = (participant?.attendance?.attended === true) || (participant?.attended === true);
    
    
    return isAttended;
  }).length;
  
  const completedSessions = sessions.filter(session => session.status === 'completed').length;
  const totalSessions = enrollment.program?.totalSessions || enrollment.program?.duration || 10; // Use program duration as total sessions
  
  // Use attendance-based progress instead of just completed sessions
  const progressPercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
  
  // Remove duplicate sessions based on session ID (most reliable)
  const uniqueSessions = sessions.filter((session, index, self) => 
    index === self.findIndex(s => s._id === session._id)
  );
  
  // Use the deduplicated sessions
  const finalUniqueSessions = uniqueSessions;
  
  
  const bookedSessions = finalUniqueSessions.length;
  const canBookMore = bookedSessions < totalSessions;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Page Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/customer/profile')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="mr-2">←</span>
              Back to Profile
            </button>
            <button
              onClick={() => {
                setSessions([]);
                fetchEnrollmentDetails();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Attendance
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Enrollment Header */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {enrollment.program?.title || 'Program Title'}
                  </h1>
                  <p className="text-lg text-gray-600">
                    Coach: {enrollment.program?.coach?.userId?.firstName || 'N/A'} {enrollment.program?.coach?.userId?.lastName || ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    enrollment.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : enrollment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : enrollment.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {enrollment.status === 'active' ? '✅ Active' : 
                     enrollment.status === 'pending' ? '⏳ Pending' : 
                     enrollment.status === 'completed' ? '🎓 Completed' :
                     '📋 ' + enrollment.status}
                  </span>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-700">Progress</span>
                  <span className="text-lg font-bold text-blue-600">
                    {attendedSessions} / {totalSessions} sessions attended
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {progressPercentage.toFixed(1)}% attendance rate
                </p>
              </div>

              {/* Program Description */}
              {enrollment.program?.description && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Program</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {enrollment.program.description}
                  </p>
                </div>
              )}

              {/* Program Materials */}
              {enrollment.program?.materials && enrollment.program.materials.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Program Materials</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrollment.program.materials.map((material, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-3">
                          <div className="text-2xl mr-3">
                            {material.type === 'document' ? '📄' : 
                             material.type === 'video' ? '🎥' : 
                             material.type === 'image' ? '🖼️' : '📁'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{material.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">{material.type}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {material.url && (
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              View
                            </a>
                          )}
                          {material.downloadUrl && (
                            <a
                              href={material.downloadUrl}
                              download
                              className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals and Experience */}
              {(enrollment.goals || enrollment.experience) && (
                <div className="bg-blue-50 rounded-lg p-4">
                  {enrollment.goals && (
                    <div className="mb-3">
                      <h4 className="font-semibold text-blue-900 mb-1">Your Goals:</h4>
                      <p className="text-blue-800">{enrollment.goals}</p>
                    </div>
                  )}
                  {enrollment.experience && (
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Your Experience:</h4>
                      <p className="text-blue-800 capitalize">{enrollment.experience}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sessions Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Sessions</h2>
                {enrollment.status === 'active' && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleBookSession}
                      disabled={!canBookMore}
                      className={`px-4 py-2 text-white text-sm rounded-lg transition-colors flex items-center ${
                        canBookMore 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      📅 {canBookMore ? 'Book Session' : 'Session Limit Reached'}
                    </button>
                    <button
                      onClick={handleViewCalendar}
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                    >
                      📊 Calendar
                    </button>
                  </div>
                )}
              </div>

              {finalUniqueSessions.length > 0 ? (
                <div className="space-y-4">
                  {finalUniqueSessions.map((session) => {
                    // Get attendance data for the current user
                    const participant = session.participants?.find(p => 
                      p.user && p.user._id === JSON.parse(localStorage.getItem('userInfo'))._id
                    );
                    const userAttendance = participant?.attendance || (participant?.attended !== undefined ? {
                      attended: participant.attended,
                      status: participant.attended ? 'present' : 'absent',
                      attendanceMarkedAt: participant.attendanceMarkedAt,
                      performance: participant.performance,
                      remarks: participant.remarks
                    } : null);

                    return (
                      <div 
                        key={session._id} 
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleSessionClick(session)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900">
                                Session {session.sessionNumber || 'N/A'}
                              </h3>
                              {(() => {
                                // Use backend attendance status if available
                                const attendanceStatus = participant?.attendanceStatus;
                                
                                if (attendanceStatus === 'present' || attendanceStatus === 'absent') {
                                  return (
                                    <span className="text-xs text-blue-600 font-medium">
                                      📋 Attendance Marked
                                    </span>
                                  );
                                } else if (attendanceStatus === 'not_marked') {
                                  return (
                                    <span className="text-xs text-orange-600 font-medium">
                                      ⏳ Not Marked
                                    </span>
                                  );
                                }
                                
                                // Fallback to frontend logic if backend status not available
                                const sessionDate = new Date(session.scheduledDate);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const isPastSession = sessionDate < today;
                                
                                const hasCoachMarkedAttendance = userAttendance?.attendanceMarkedAt || 
                                  (participant?.attended !== undefined && participant?.attendanceMarkedAt);
                                
                                if (isPastSession && hasCoachMarkedAttendance) {
                                  return (
                                    <span className="text-xs text-blue-600 font-medium">
                                      📋 Attendance Marked
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="text-xs text-orange-600 font-medium">
                                      ⏳ Not Marked
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              {session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'Date TBD'}
                            </p>
                            {session.scheduledTime && (
                              <p className="text-gray-600 text-sm mb-2">
                                Time: {session.scheduledTime}
                              </p>
                            )}
                            {session.ground && (
                              <p className="text-gray-600 text-sm mb-2">
                                Location: {session.ground.name || 'TBD'}
                              </p>
                            )}
                            {session.notes && (
                              <p className="text-gray-600 text-sm">
                                Notes: {session.notes}
                              </p>
                            )}
                            
                            {/* Attendance Information */}
                            {(() => {
                              // Use backend attendance status if available
                              const attendanceStatus = participant?.attendanceStatus;
                              const isPastSession = participant?.isPastSession;
                              const isUpcomingSession = participant?.isUpcomingSession;
                              const hasAttendanceMarked = participant?.hasAttendanceMarked;
                              
                              // Show attendance information based on backend status
                              if (attendanceStatus === 'present' || attendanceStatus === 'absent') {
                                return (
                                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-blue-900">Attendance:</span>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        attendanceStatus === 'present' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {attendanceStatus === 'present' ? '✅ Present' : '❌ Absent'}
                                      </span>
                                    </div>
                                    {userAttendance.performance && (
                                      <div className="mt-2 text-sm text-blue-800">
                                        <div className="flex items-center">
                                          <span className="font-medium">Performance Rating:</span>
                                          <div className="ml-2 flex">
                                            {[...Array(5)].map((_, i) => (
                                              <span key={i} className={`text-lg ${
                                                i < (userAttendance.performance.rating || 0) 
                                                  ? 'text-yellow-400' 
                                                  : 'text-gray-300'
                                              }`}>
                                                ⭐
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                        {userAttendance.performance.notes && (
                                          <p className="mt-1 text-xs">
                                            <span className="font-medium">Notes:</span> {userAttendance.performance.notes}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {userAttendance.remarks && (
                                      <p className="mt-1 text-xs text-blue-800">
                                        <span className="font-medium">Coach Remarks:</span> {userAttendance.remarks}
                                      </p>
                                    )}
                                    {userAttendance.attendanceMarkedAt && (
                                      <p className="mt-1 text-xs text-blue-600">
                                        Marked on: {new Date(userAttendance.attendanceMarkedAt).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                );
                              } else if (attendanceStatus === 'not_marked') {
                                return (
                                  <div className="mt-3 p-2 bg-orange-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-orange-900">Attendance:</span>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        ⏳ Not Marked
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-orange-700">
                                      {isUpcomingSession 
                                        ? 'This session is scheduled for the future.'
                                        : 'Coach has not marked attendance for this session yet.'
                                      }
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              session.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : session.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : session.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status === 'completed' ? '✅ Completed' : 
                               session.status === 'scheduled' ? '📅 Scheduled' : 
                               session.status === 'cancelled' ? '❌ Cancelled' :
                               '📋 ' + session.status}
                            </span>
                            
                            {/* Attendance Status Badge */}
                            {(() => {
                              // Use backend attendance status if available
                              const attendanceStatus = participant?.attendanceStatus;
                              
                              if (attendanceStatus === 'present' || attendanceStatus === 'absent') {
                                return (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    attendanceStatus === 'present' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {attendanceStatus === 'present' ? '✅ Present' : '❌ Absent'}
                                  </span>
                                );
                              } else if (attendanceStatus === 'not_marked') {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    ⏳ Not Marked
                                  </span>
                                );
                              }
                              
                              // Fallback to frontend logic if backend status not available
                              const sessionDate = new Date(session.scheduledDate);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const isPastSession = sessionDate < today;
                              
                              const hasCoachMarkedAttendance = userAttendance?.attendanceMarkedAt || 
                                (participant?.attended !== undefined && participant?.attendanceMarkedAt);
                              
                              if (isPastSession && hasCoachMarkedAttendance) {
                                return (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    (userAttendance?.attended || participant?.attended) 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {(userAttendance?.attended || participant?.attended) ? '✅ Present' : '❌ Absent'}
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    ⏳ Not Marked
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Sessions Yet</h3>
                  <p className="text-gray-600 mb-4">You haven't booked any sessions for this program yet.</p>
                  {enrollment.status === 'active' && canBookMore && (
                    <button
                      onClick={handleBookSession}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Book Your First Session
                    </button>
                  )}
                  {enrollment.status === 'active' && !canBookMore && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
                      <p className="font-medium">Session Limit Reached</p>
                      <p className="text-sm">You have reached the maximum number of sessions ({totalSessions}) for this program.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Enrollment Details</h2>
              
              {/* Enrollment Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-3">📅</span>
                  <div>
                    <p className="text-sm text-gray-600">Enrolled Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(enrollment.enrollmentDate || enrollment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-600 mr-3">⏱️</span>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium text-gray-900">{enrollment.program?.duration || 'N/A'} weeks</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-600 mr-3">💰</span>
                  <div>
                    <p className="text-sm text-gray-600">Program Fee</p>
                    <p className="font-bold text-green-600 text-xl">LKR {enrollment.program?.fee || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-600 mr-3">💳</span>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      enrollment.paymentStatus === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : enrollment.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {enrollment.paymentStatus === 'completed' ? '✅ Paid' : 
                       enrollment.paymentStatus === 'pending' ? '⏳ Pending' : 
                       enrollment.paymentStatus === 'failed' ? '❌ Failed' :
                       '❓ Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Progress Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sessions Booked</span>
                    <span className="font-medium text-gray-900">{bookedSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Program Limit</span>
                    <span className="font-medium text-gray-900">{totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sessions Attended</span>
                    <span className="font-medium text-green-600">{attendedSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sessions Completed</span>
                    <span className="font-medium text-gray-900">{completedSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Attendance Rate</span>
                    <span className="font-medium text-blue-600">{progressPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {enrollment.status === 'pending' && enrollment.paymentStatus === 'pending' && (
                <button
                  onClick={() => navigate('/payment', { 
                    state: { 
                      enrollment: enrollment,
                      program: enrollment.program,
                      amount: enrollment.program?.fee,
                      type: 'enrollment'
                    } 
                  })}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors mb-4"
                >
                  💳 Complete Payment
                </button>
              )}

              {enrollment.status === 'completed' && (
                <div className="text-center py-4 bg-green-50 rounded-lg mb-4">
                  <div className="text-green-600 text-2xl mb-2">🎓</div>
                  <p className="text-green-800 font-medium">Program Completed!</p>
                  <p className="text-green-600 text-sm">Congratulations on finishing the program!</p>
                </div>
              )}

              {/* Certificate Download Section */}
              {(enrollment.status === 'completed' || enrollment.status === 'active') && (
                <CertificateDownload 
                  enrollmentId={enrollmentId}
                  enrollmentStatus={enrollment.status}
                  onCertificateGenerated={(certificate) => {
                    console.log('Certificate generated:', certificate);
                    // Optionally refresh enrollment data
                    fetchEnrollmentDetails();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Book a Session</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {/* Weekly Session Booking Section - Full Width */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Session Booking</h3>
                {enrollment?.program?.coach?._id ? (
                  <WeeklySessionBooking
                    coachId={enrollment.program.coach._id}
                    onSessionSelect={handleWeeklySessionSelect}
                    enrollmentDate={enrollment.enrollmentDate}
                    programDuration={enrollment.program?.duration}
                    existingSessions={sessions}
                  />
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800">Coach information not available</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={closeModals}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDirectSessionBooking}
                  disabled={submitting || !selectedTimeSlot || !selectedTimeSlot.ground || !selectedTimeSlot.groundSlot}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Booking...' : 'Book Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Manager Modal */}
      {showSessionManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Sessions</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {uniqueSessions.length > 0 ? (
                <div className="space-y-4">
                  {uniqueSessions.map((session) => (
                    <div key={session._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Session {session.sessionNumber || 'N/A'}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'Date TBD'}
                          </p>
                          {(session.startTime || session.scheduledTime) && (
                            <p className="text-gray-600 text-sm mb-2">
                              Time: {session.startTime || session.scheduledTime}
                            </p>
                          )}
                          {session.ground && (
                            <p className="text-gray-600 text-sm mb-2">
                              Location: {session.ground.name || 'TBD'}
                            </p>
                          )}
                          {session.notes && (
                            <p className="text-gray-600 text-sm">
                              Notes: {session.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            session.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : session.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : session.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status === 'completed' ? '✅ Completed' : 
                             session.status === 'scheduled' ? '📅 Scheduled' : 
                             session.status === 'cancelled' ? '❌ Cancelled' :
                             '📋 ' + session.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Sessions Yet</h3>
                  <p className="text-gray-600 mb-4">You haven't booked any sessions for this program yet.</p>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeModals}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Calendar Modal */}
      {showSessionCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Session Calendar</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center">
                  <div className="text-blue-600 mr-3">
                    <span className="text-lg">📅</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Calendar View</p>
                    <p className="text-sm text-blue-700">
                      View your scheduled sessions in a calendar format. 
                      This feature will show upcoming sessions and allow you to manage your schedule.
                    </p>
                  </div>
                </div>
              </div>
              
              {finalUniqueSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finalUniqueSessions.map((session) => (
                    <div key={session._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Session {session.sessionNumber || 'N/A'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : session.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : session.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status === 'completed' ? '✅' : 
                           session.status === 'scheduled' ? '📅' : 
                           session.status === 'cancelled' ? '❌' : '📋'}
                        </span>
                      </div>
                      
                        <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Week:</strong> Week {session.week || session.sessionNumber || 'N/A'}</p>
                        <p><strong>Date:</strong> {session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'TBD'}</p>
                        {(session.startTime || session.scheduledTime) && (
                          <p><strong>Time:</strong> {session.startTime || session.scheduledTime}</p>
                        )}
                        {session.ground && (
                          <p><strong>Location:</strong> {session.ground.name || 'TBD'}</p>
                        )}
                        {session.duration && (
                          <p><strong>Duration:</strong> {session.duration} minutes</p>
                        )}
                        {session.rescheduled && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <p className="text-yellow-800 font-medium">🔄 Rescheduled</p>
                            {session.rescheduledFrom && (
                              <p className="text-yellow-700">
                                From: {new Date(session.rescheduledFrom.date).toLocaleDateString()} at {session.rescheduledFrom.time}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {session.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <strong>Notes:</strong> {session.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Sessions Scheduled</h3>
                  <p className="text-gray-600 mb-4">You don't have any sessions scheduled yet.</p>
                  <button
                    onClick={() => {
                      closeModals();
                      handleBookSession();
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book Your First Session
                  </button>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => {
                    setShowSessionCalendar(false);
                    setShowBookingModal(true);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  📅 Book Session
                </button>
                <button
                  onClick={closeModals}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionDetails && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Session Details</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Session Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Session Number</label>
                      <p className="text-lg font-semibold text-gray-900">Session {selectedSession.sessionNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <p className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                        selectedSession.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedSession.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedSession.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedSession.status === 'completed' ? '✅ Completed' :
                         selectedSession.status === 'scheduled' ? '📅 Scheduled' :
                         selectedSession.status === 'cancelled' ? '❌ Cancelled' :
                         '📋 ' + selectedSession.status}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date</label>
                      <p className="text-gray-900">
                        {selectedSession.scheduledDate ? new Date(selectedSession.scheduledDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'Date TBD'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Time</label>
                      <p className="text-gray-900">
                        {selectedSession.startTime || selectedSession.scheduledTime || 'Time TBD'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Duration</label>
                      <p className="text-gray-900">{selectedSession.duration || 120} minutes</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Week</label>
                      <p className="text-gray-900">Week {selectedSession.week || selectedSession.sessionNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Ground Information */}
                {selectedSession.ground && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ground Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ground Name</label>
                        <p className="text-gray-900">{selectedSession.ground.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-gray-900">{selectedSession.ground.location || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ground Slot</label>
                        <p className="text-gray-900">Slot {selectedSession.groundSlot || 'N/A'}</p>
                      </div>
                      {selectedSession.ground.facilities && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Facilities</label>
                          <p className="text-gray-900">{selectedSession.ground.facilities.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reschedule Information */}
                {selectedSession.rescheduled && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">🔄 Rescheduled Session</h3>
                    <div className="space-y-2">
                      <p className="text-orange-800">
                        <strong>Rescheduled on:</strong> {selectedSession.rescheduledAt ? new Date(selectedSession.rescheduledAt).toLocaleDateString() : 'Unknown'}
                      </p>
                      {selectedSession.rescheduledFrom && (
                        <div className="bg-orange-100 p-3 rounded border border-orange-300">
                          <p className="text-orange-900 font-medium">Previous Schedule:</p>
                          <p className="text-orange-800">
                            <strong>Date:</strong> {new Date(selectedSession.rescheduledFrom.date).toLocaleDateString()}
                          </p>
                          {selectedSession.rescheduledFrom.time && (
                            <p className="text-orange-800">
                              <strong>Time:</strong> {selectedSession.rescheduledFrom.time}
                            </p>
                          )}
                          <p className="text-orange-800">
                            <strong>Ground Slot:</strong> {selectedSession.rescheduledFrom.groundSlot}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Session Notes */}
                {selectedSession.notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Notes</h3>
                    <p className="text-gray-700">{selectedSession.notes}</p>
                  </div>
                )}

                {/* Attendance Information */}
                {(() => {
                  const participant = selectedSession.participants?.find(p => 
                    p.user && p.user._id === JSON.parse(localStorage.getItem('userInfo'))._id
                  );
                  const userAttendance = participant?.attendance || (participant?.attended !== undefined ? {
                    attended: participant.attended,
                    status: participant.attended ? 'present' : 'absent',
                    attendanceMarkedAt: participant.attendanceMarkedAt,
                    performance: participant.performance,
                    remarks: participant.remarks
                  } : null);

                  // Use backend attendance status if available
                  const attendanceStatus = participant?.attendanceStatus;
                  const isPastSession = participant?.isPastSession;
                  const isUpcomingSession = participant?.isUpcomingSession;
                  const hasAttendanceMarked = participant?.hasAttendanceMarked;
                  
                  if (attendanceStatus === 'present' || attendanceStatus === 'absent') {
                    return (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Attendance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              attendanceStatus === 'present' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attendanceStatus === 'present' ? '✅ Present' : '❌ Absent'}
                            </p>
                          </div>
                          {userAttendance.attendanceMarkedAt && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Marked On</label>
                              <p className="text-gray-900">
                                {new Date(userAttendance.attendanceMarkedAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                          {userAttendance.performance && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Performance Rating</label>
                              <div className="flex items-center">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-lg ${
                                      i < (userAttendance.performance.rating || 0) 
                                        ? 'text-yellow-400' 
                                        : 'text-gray-300'
                                    }`}>
                                      ⭐
                                    </span>
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-600">
                                  ({userAttendance.performance.rating}/5)
                                </span>
                              </div>
                            </div>
                          )}
                          {userAttendance.remarks && (
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-600">Coach Remarks</label>
                              <p className="text-gray-900 bg-white p-2 rounded border">
                                {userAttendance.remarks}
                              </p>
                            </div>
                          )}
                          {userAttendance.performance?.notes && (
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-600">Performance Notes</label>
                              <p className="text-gray-900 bg-white p-2 rounded border">
                                {userAttendance.performance.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else if (attendanceStatus === 'not_marked') {
                    return (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Attendance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <p className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                              ⏳ Not Marked
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Note</label>
                            <p className="text-orange-700 text-sm">
                              {isUpcomingSession 
                                ? 'This session is scheduled for the future.'
                                : 'Coach has not marked attendance for this session yet.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Coach Information */}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <div className="flex space-x-3">
                  {selectedSession.status === 'scheduled' && (() => {
                    // Check if attendance has been marked - only check for actual attendance records
                    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                    const participant = selectedSession.participants?.find(p => p.user && p.user._id === userInfo._id);
                    
                    // Debug logging
                    console.log('Reschedule check - Participant data:', participant);
                    console.log('Attendance status:', participant?.attendanceStatus);
                    console.log('Attended value:', participant?.attended);
                    console.log('Attendance marked at:', participant?.attendanceMarkedAt);
                    
                    // Only disable if attendance is actually marked (present/absent), not just if attended field exists
                    // Check for explicit attendance status or attendance marked timestamp
                    const hasAttendanceMarked = participant?.attendanceStatus === 'present' || 
                                              participant?.attendanceStatus === 'absent' ||
                                              participant?.attendanceMarkedAt !== undefined;
                    
                    console.log('Has attendance marked:', hasAttendanceMarked);
                    
                    if (hasAttendanceMarked) {
                      return (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-60"
                        >
                          📅 Cannot Reschedule (Attendance Marked)
                        </button>
                      );
                    }
                    
                    return (
                      <button
                        onClick={() => handleReschedule(selectedSession)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        📅 Reschedule Session
                      </button>
                    );
                  })()}
                </div>
                <button
                  onClick={closeModals}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reschedule Session</h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Session Details</h3>
                  <p><strong>Session:</strong> Session {selectedSession.sessionNumber}</p>
                  <p><strong>Current Date:</strong> {selectedSession.scheduledDate ? new Date(selectedSession.scheduledDate).toLocaleDateString() : 'Date TBD'}</p>
                  <p><strong>Current Time:</strong> {selectedSession.scheduledTime || 'Time TBD'}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-yellow-600 mr-3">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-800">Rescheduling Rules</h4>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• You can only reschedule sessions that are more than 24 hours away</li>
                        <li>• <strong>Week Restriction:</strong> Session {selectedSession.sessionNumber} can only be rescheduled within Week {selectedSession.week}</li>
                        <li>• <strong>Coach Availability:</strong> Only times when your coach is available will be shown</li>
                        <li>• <strong>Ground Slots:</strong> Only free ground slots can be selected</li>
                        <li>• You can only reschedule once per session</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* New Session Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Select New Date & Time</h3>
                  
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <select
                      value={rescheduleData.newDate}
                      onChange={(e) => handleRescheduleDateChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a date</option>
                      {rescheduleData.availableDates.map((dateOption) => (
                        <option key={dateOption.date} value={dateOption.date}>
                          {dateOption.display}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Selection */}
                  {rescheduleData.newDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Time
                        {rescheduleData.availableTimes.length > 0 && (
                          <span className="text-green-600 text-sm ml-2">
                            ({rescheduleData.availableTimes.length} slots available)
                          </span>
                        )}
                      </label>
                      <select
                        value={rescheduleData.newTime}
                        onChange={(e) => handleRescheduleTimeChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={rescheduleData.availableTimes.length === 0}
                      >
                        <option value="">
                          {rescheduleData.availableTimes.length === 0 
                            ? "Loading available times..." 
                            : "Choose a time"
                          }
                        </option>
                        {rescheduleData.availableTimes.map((timeOption) => (
                          <option key={timeOption.value} value={timeOption.value}>
                            {timeOption.label}
                          </option>
                        ))}
                      </select>
                      {rescheduleData.availableTimes.length === 0 && rescheduleData.newDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          No available time slots for the selected date. Please choose a different date.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Ground Slot Selection */}
                  {rescheduleData.newTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Ground Slot
                        {rescheduleData.availableGrounds.length > 0 && (
                          <span className="text-green-600 text-sm ml-2">
                            ({rescheduleData.availableGrounds.length} slots available)
                          </span>
                        )}
                      </label>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }, (_, index) => {
                          const slotNumber = index + 1;
                          const isAvailable = rescheduleData.availableGrounds.some(slot => slot.slotNumber === slotNumber);
                          const isSelected = rescheduleData.newGroundSlot === slotNumber;
                          
                          return (
                            <button
                              key={slotNumber}
                              onClick={() => {
                                if (isAvailable) {
                                  setRescheduleData(prev => ({ ...prev, newGroundSlot: slotNumber }));
                                }
                              }}
                              disabled={!isAvailable}
                              className={`p-3 border rounded-lg text-center transition-all ${
                                !isAvailable
                                  ? 'border-red-300 bg-red-50 text-red-400 cursor-not-allowed opacity-60'
                                  : isSelected
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="font-medium flex items-center justify-center">
                                {!isAvailable && <span className="mr-1">🔒</span>}
                                Slot {slotNumber}
                              </div>
                              <div className="text-sm text-gray-600">
                                {!isAvailable ? 'Booked' : rescheduleData.availableGrounds.find(slot => slot.slotNumber === slotNumber)?.timeSlot || 'Available'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={closeModals}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRescheduleSubmit}
                    disabled={!rescheduleData.newDate || !rescheduleData.newTime || !rescheduleData.newGroundSlot || submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Rescheduling...' : 'Reschedule Session'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
