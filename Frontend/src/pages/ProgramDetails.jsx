import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isLoggedIn, getCurrentUserRole } from '../utils/getCurrentUser';
import Payment from './Payment';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ProgramDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    emergencyContact: '',
    experience: '',
    goals: ''
  });

  useEffect(() => {
    if (id) {
      fetchProgramDetails();
    }
  }, [id]);

  const fetchProgramDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`http://localhost:5000/api/programs/${id}`);
      
      if (response.data.success) {
        setProgram(response.data.data);
      } else {
        setError('Program not found');
      }
    } catch (err) {
      console.error('Error fetching program details:', err);
      if (err.response?.status === 404) {
        setError('Program not found');
      } else {
        setError(err.response?.data?.message || 'Failed to load program details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = () => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    // Load user data into enrollment form
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    setEnrollmentData({
      firstName: userInfo.firstName || '',
      lastName: userInfo.lastName || '',
      email: userInfo.email || '',
      contactNumber: userInfo.contactNumber || '',
      emergencyContact: '',
      experience: '',
      goals: ''
    });
    setShowEnrollmentModal(true);
  };

  const handleEnrollmentSubmit = async () => {
    try {
      setEnrolling(true);
      console.log('Starting enrollment process...');
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      console.log('User info:', userInfo);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };

      const enrollmentPayload = {
        programId: id,
        userId: userInfo._id
      };
      
      console.log('Enrollment payload:', enrollmentPayload);
      console.log('Making API call to:', 'http://localhost:5000/api/enrollments');

      const response = await axios.post('http://localhost:5000/api/enrollments', enrollmentPayload, config);
      
      console.log('Enrollment response:', response.data);
      
      if (response.data.success) {
        setShowEnrollmentModal(false);
        // Navigate to payment page with enrollment data
        navigate('/payment', { 
          state: { 
            enrollment: response.data.data,
            program: program,
            amount: program.fee,
            type: 'enrollment'
          } 
        });
      }
    } catch (err) {
      console.error('Error enrolling in program:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response?.status === 401) {
        alert('Please log in to enroll in programs');
        navigate('/login');
      } else if (err.response?.status === 400) {
        alert(err.response.data.message || 'Unable to enroll in this program');
      } else if (err.response?.status === 404) {
        alert('Enrollment endpoint not found. Please check if the server is running.');
      } else {
        alert(`Failed to enroll. Error: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEnrollmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Program</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/programs')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏏</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Program Not Found</h3>
          <p className="text-gray-600 mb-4">The program you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/programs')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  const userRole = getCurrentUserRole();
  const canEnroll = isLoggedIn() && userRole === 'customer';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Page Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/programs')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="mr-2">←</span>
              Back to Programs
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Program Image */}
              <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-8xl">🏏</div>
              </div>
              
              <div className="p-8">
                {/* Program Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{program.title}</h1>
                
                {/* Coach Information */}
                <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-gray-600 text-lg font-medium">
                      {program.coach?.userId?.firstName?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Coach</p>
                    <p className="font-semibold text-gray-900">
                      {program.coach?.userId?.firstName} {program.coach?.userId?.lastName}
                    </p>
                    {program.coach?.specializations && (
                      <p className="text-sm text-gray-600">
                        Specializations: {program.coach.specializations.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Program Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">About This Program</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {program.description || 'No detailed description available for this program.'}
                  </p>
                </div>
                
                {/* Materials Section */}
                {program.materials && program.materials.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Program Materials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {program.materials.map((material, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center">
                            <div className="mr-3">
                              {material.type === 'video' ? (
                                <span className="text-red-500 text-xl">🎥</span>
                              ) : (
                                <span className="text-blue-500 text-xl">📄</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{material.name}</h3>
                              <p className="text-sm text-gray-600 capitalize">{material.type}</p>
                            </div>
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Program Details</h2>
              
              {/* Program Info */}
              <div className="space-y-4 mb-6">
                {program.duration && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-3">⏱️</span>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium text-gray-900">{program.duration} weeks</p>
                    </div>
                  </div>
                )}
                
                {program.fee && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-3">💰</span>
                    <div>
                      <p className="text-sm text-gray-600">Fee</p>
                      <p className="font-bold text-green-600 text-xl">${program.fee}</p>
                    </div>
                  </div>
                )}
                
                {program.category && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-3">🏷️</span>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium text-gray-900 capitalize">{program.category}</p>
                    </div>
                  </div>
                )}
                
                {program.difficulty && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-3">📊</span>
                    <div>
                      <p className="text-sm text-gray-600">Difficulty</p>
                      <p className="font-medium text-gray-900 capitalize">{program.difficulty}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Enroll Button */}
              {canEnroll ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              ) : (
                <div className="text-center">
                  {!isLoggedIn() ? (
                    <div>
                      <p className="text-gray-600 mb-4">Please log in to enroll in programs</p>
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Log In
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-600">Only customers can enroll in programs</p>
                  )}
                </div>
              )}
              
              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Need help? Contact our support team for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Enroll in {program?.title}</h2>
                <button
                  onClick={() => setShowEnrollmentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={enrollmentData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={enrollmentData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={enrollmentData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={enrollmentData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    value={enrollmentData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Emergency contact number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cricket Experience
                  </label>
                  <select
                    value={enrollmentData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select your experience level</option>
                    <option value="beginner">Beginner (0-1 years)</option>
                    <option value="intermediate">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goals & Expectations
                  </label>
                  <textarea
                    value={enrollmentData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="What do you hope to achieve from this program?"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Program Fee</p>
                      <p className="text-2xl font-bold text-green-600">${program?.fee}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium">{program?.duration} weeks</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowEnrollmentModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Continue to Payment button clicked!');
                    console.log('Form validation:', {
                      firstName: enrollmentData.firstName,
                      lastName: enrollmentData.lastName,
                      email: enrollmentData.email,
                      contactNumber: enrollmentData.contactNumber,
                      enrolling: enrolling
                    });
                    handleEnrollmentSubmit();
                  }}
                  disabled={enrolling || !enrollmentData.firstName || !enrollmentData.lastName || !enrollmentData.email || !enrollmentData.contactNumber}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {enrolling ? 'Processing...' : 'Continue to Payment'}
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
