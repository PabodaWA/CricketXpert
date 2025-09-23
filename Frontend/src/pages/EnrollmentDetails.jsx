import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
    duration: 60,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (enrollmentId) {
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

      // Fetch enrollment details
      console.log('Fetching enrollment details for ID:', enrollmentId);
      const enrollmentResponse = await axios.get(`http://localhost:5000/api/enrollments/${enrollmentId}`, config);
      console.log('Enrollment response:', enrollmentResponse.data);
      
      if (enrollmentResponse.data.success) {
        setEnrollment(enrollmentResponse.data.data);
        
        // Fetch sessions for this enrollment
        try {
          console.log('Fetching sessions for enrollment ID:', enrollmentId);
          const sessionsResponse = await axios.get(`http://localhost:5000/api/sessions/enrollment/${enrollmentId}`, config);
          console.log('Sessions response:', sessionsResponse.data);
          if (sessionsResponse.data.success) {
            setSessions(sessionsResponse.data.data || []);
          }
        } catch (sessionErr) {
          console.log('No sessions found for this enrollment:', sessionErr.message);
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
        notes: bookingForm.notes
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
        // Refresh enrollment details to show new session
        fetchEnrollmentDetails();
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

  const completedSessions = sessions.filter(session => session.status === 'completed').length;
  const totalSessions = enrollment.program?.totalSessions || enrollment.progress?.totalSessions || 0;
  const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

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
                    {completedSessions} / {totalSessions} sessions
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {progressPercentage.toFixed(1)}% complete
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
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      📅 Book Session
                    </button>
                    <button
                      onClick={handleViewSessions}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      📋 Manage Sessions
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

              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Session {session.sessionNumber || 'N/A'}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {session.date ? new Date(session.date).toLocaleDateString() : 'Date TBD'}
                          </p>
                          {session.time && (
                            <p className="text-gray-600 text-sm mb-2">
                              Time: {session.time}
                            </p>
                          )}
                          {session.location && (
                            <p className="text-gray-600 text-sm mb-2">
                              Location: {session.location}
                            </p>
                          )}
                          {session.notes && (
                            <p className="text-gray-600 text-sm">
                              Notes: {session.notes}
                            </p>
                          )}
                        </div>
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Sessions Yet</h3>
                  <p className="text-gray-600 mb-4">You haven't booked any sessions for this program yet.</p>
                  {enrollment.status === 'active' && (
                    <button
                      onClick={handleBookSession}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Book Your First Session
                    </button>
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
                    <span className="text-sm text-gray-600">Sessions Completed</span>
                    <span className="font-medium text-gray-900">{completedSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Sessions</span>
                    <span className="font-medium text-gray-900">{totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
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
                <div className="text-center py-4 bg-green-50 rounded-lg">
                  <div className="text-green-600 text-2xl mb-2">🎓</div>
                  <p className="text-green-800 font-medium">Program Completed!</p>
                  <p className="text-green-600 text-sm">Congratulations on finishing the program!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Date *
                  </label>
                  <input
                    type="date"
                    value={bookingForm.requestedDate}
                    onChange={(e) => handleBookingFormChange('requestedDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Time *
                  </label>
                  <input
                    type="time"
                    value={bookingForm.requestedTime}
                    onChange={(e) => handleBookingFormChange('requestedTime', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <select 
                    value={bookingForm.duration}
                    onChange={(e) => handleBookingFormChange('duration', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Notes (Optional)
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => handleBookingFormChange('notes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Any specific requirements or notes for this session..."
                  />
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-green-600 mr-3">
                      <span className="text-lg">✅</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Direct Session Booking</p>
                      <p className="text-sm text-green-700">
                        Your session will be created immediately upon submission. 
                        No coach approval required - you can book sessions directly!
                      </p>
                    </div>
                  </div>
                </div>
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
                  disabled={submitting || !bookingForm.requestedDate || !bookingForm.requestedTime}
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
              
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Session {session.sessionNumber || 'N/A'}
                          </h3>
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
                          {session.status === 'scheduled' && (
                            <button className="text-red-600 text-sm hover:text-red-800">
                              Cancel Session
                            </button>
                          )}
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
              
              {sessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map((session) => (
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
                        <p><strong>Date:</strong> {session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'TBD'}</p>
                        {session.scheduledTime && (
                          <p><strong>Time:</strong> {session.scheduledTime}</p>
                        )}
                        {session.ground && (
                          <p><strong>Location:</strong> {session.ground.name || 'TBD'}</p>
                        )}
                        {session.duration && (
                          <p><strong>Duration:</strong> {session.duration} minutes</p>
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

      <Footer />
    </div>
  );
}
