import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Star, 
  Clock, 
  MapPin, 
  BookOpen, 
  MessageSquare, 
  Plus, 
  LogOut,
  Home,
  User,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  Upload,
  ChevronDown,
  Menu,
  X,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  BarChart3
} from 'lucide-react';
import axios from 'axios';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('programs');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [difficultyFilter, setDifficultyFilter] = useState('All Levels');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [coachSessions, setCoachSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [enrolledCustomers, setEnrolledCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSessions, setCustomerSessions] = useState([]);
  const [showCustomerSessions, setShowCustomerSessions] = useState(false);

  useEffect(() => {
    fetchCoachData();
  }, []);

  const fetchCoachData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      
      if (!userInfo || !userInfo._id) {
        setError('Please log in to access the coach dashboard');
        setLoading(false);
        navigate('/login');
        return;
      }

      // Get coach profile by user ID
      const coachResponse = await axios.get(`/api/coaches/user/${userInfo._id}`);
      const coachData = coachResponse.data.data;
      
      console.log('Coach data received:', coachData);
      console.log('Assigned programs:', coachData.assignedPrograms);
      
      if (!coachData) {
        setError('Coach profile not found. Please contact support.');
        setLoading(false);
        return;
      }
      
      setCoach(coachData);
      
      // Get coach's assigned programs
      if (coachData.assignedPrograms && coachData.assignedPrograms.length > 0) {
        setAssignedPrograms(coachData.assignedPrograms);
      } else {
        setAssignedPrograms([]);
      }
      
      // Get coach's enrolled programs (students enrolled in coach's programs)
      let enrolledProgramsData = [];
      try {
        const enrolledProgramsResponse = await axios.get(`/api/coaches/${coachData._id}/enrolled-programs`);
        enrolledProgramsData = enrolledProgramsResponse.data.data.docs || [];
        console.log('Enrolled programs data:', enrolledProgramsData);
        setEnrolledPrograms(enrolledProgramsData);
      } catch (enrolledError) {
        console.warn('Could not fetch enrolled programs:', enrolledError);
        setEnrolledPrograms([]);
      }
      
      // SIMPLE CUSTOMER DATA WITH PROGRESS CALCULATION
      console.log('Setting up customer data with progress...');
      
      try {
        // Get sessions for progress calculation
        const coachSessionsResponse = await axios.get(`/api/coaches/${coachData._id}/sessions`);
        const allSessions = coachSessionsResponse.data.data.docs || [];
        
        // Simple customer data with progress calculation
        const customersData = enrolledProgramsData.map(enrollment => {
          const customer = enrollment.user;
          
          // Find sessions for this customer
          const customerSessions = allSessions.filter(session => 
            session.participants?.some(participant => 
              participant.user && participant.user._id === customer._id
            )
          );
          
          // Take only first 2 sessions (most recent)
          const recentSessions = customerSessions
            .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
            .slice(0, 2);
          
          // Count completed sessions (any attendance marked)
          const completedSessions = recentSessions.filter(session => {
            const participant = session.participants?.find(p => p.user._id === customer._id);
            return participant && (participant.attended === true || participant.attended === false);
          }).length;
          
          // Count present sessions (only attended = true)
          const presentSessions = recentSessions.filter(session => {
            const participant = session.participants?.find(p => p.user._id === customer._id);
            return participant && participant.attended === true;
          }).length;
          
          return {
            _id: customer._id,
            user: customer,
            enrolledPrograms: [enrollment.program._id],
            totalSessions: recentSessions.length,
            completedSessions,
            presentSessions
          };
        });
        
        console.log('Customers data with progress:', customersData);
        setCustomers(customersData);
        
      } catch (error) {
        console.error('Error setting up customers:', error);
        // Fallback to simple data
        const simpleCustomersData = enrolledProgramsData.map(enrollment => ({
          _id: enrollment.user._id,
          user: enrollment.user,
          enrolledPrograms: [enrollment.program._id],
          totalSessions: 2,
          completedSessions: 0,
          presentSessions: 0
        }));
        setCustomers(simpleCustomersData);
      }
      
      // Fetch coach's sessions with attendance data
      try {
        const coachSessionsResponse = await axios.get(`/api/coaches/${coachData._id}/sessions`);
        const coachSessionsData = coachSessionsResponse.data.data.docs || [];
        console.log('Raw coach sessions data:', coachSessionsData);
        console.log('Total sessions fetched:', coachSessionsData.length);
        
        // Log session details for debugging
        coachSessionsData.forEach((session, index) => {
          console.log(`Session ${index + 1}:`, {
            id: session._id,
            title: session.title,
            description: session.description,
            date: session.scheduledDate,
            participants: session.participants?.length || 0
          });
        });
        
        // Check for duplicate titles
        const titles = coachSessionsData.map(s => s.title);
        const uniqueTitles = [...new Set(titles)];
        console.log('Session titles found:', titles);
        console.log('Unique titles:', uniqueTitles);
        
        if (titles.length !== uniqueTitles.length) {
          console.warn('WARNING: Duplicate session titles found!');
          console.warn('This might be why you see only Session 2 twice');
        }
        
        console.log('Session participants with attendance:', coachSessionsData.map(s => ({
          title: s.title,
          participants: s.participants?.map(p => ({
            user: p.user,
            attended: p.attended,
            attendanceMarkedAt: p.attendanceMarkedAt
          }))
        })));
        
        // Verify attendance data persistence
        console.log('=== ATTENDANCE PERSISTENCE CHECK ===');
        coachSessionsData.forEach((session, index) => {
          console.log(`Session ${index + 1} (${session.title}) attendance data:`, {
            sessionId: session._id,
            participants: session.participants?.map(p => ({
              userId: p.user,
              attended: p.attended,
              attendanceMarkedAt: p.attendanceMarkedAt,
              isMarked: p.attended !== undefined && p.attended !== null
            }))
          });
        });
        setSessions(coachSessionsData);
        setCoachSessions(coachSessionsData);
      } catch (sessionsError) {
        console.warn('Could not fetch coach sessions:', sessionsError);
        setSessions([]);
        setCoachSessions([]);
      }

      // Fetch enrolled customers
      await fetchEnrolledCustomers();
      
    } catch (error) {
      console.error('Error fetching coach data:', error);
      setError('Failed to load coach data. Please try again.');
      // Set empty data on error
      setCoach(null);
      setAssignedPrograms([]);
      setCustomers([]);
      setSessions([]);
      setEnrolledPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (feedbackData) => {
    try {
      const response = await axios.post('/api/player-feedback', feedbackData);
      console.log('Feedback submitted successfully:', response.data);
      setShowFeedbackModal(false);
      setSelectedParticipant(null);
      // Refresh data after feedback submission
      fetchCoachData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  // SIMPLE ATTENDANCE MARKING - STAY ON ATTENDANCE PAGE
  const handleMarkAttendance = async (attendanceData) => {
    try {
      console.log('=== SIMPLE ATTENDANCE MARKING ===');
      console.log('Session:', selectedSession._id);
      console.log('Customer:', selectedCustomer._id);
      console.log('Attendance Data:', attendanceData);
      
      // Get the participant for this customer
      const participant = selectedSession.participants?.find(p => p.user._id === selectedCustomer._id);
      if (!participant) {
        alert('Participant not found in this session');
        return;
      }
      
      // Simple API call
      const response = await axios.put(
        `/api/coaches/${coach._id}/sessions/${selectedSession._id}/attendance`,
        { 
          attendanceData: [{
            participantId: participant._id,
            attended: attendanceData[0]?.attended || false
          }]
        }
      );
      
      console.log('Attendance marked successfully:', response.data);
      alert('Attendance marked successfully!');
      
      // Close modal
      setShowAttendanceModal(false);
      setSelectedSession(null);
      
      // Refresh customer sessions to show updated attendance - NO PAGE RELOAD
      if (selectedCustomer) {
        console.log('Refreshing customer sessions...');
        await fetchCustomerSessions(selectedCustomer._id);
        console.log('Customer sessions refreshed successfully');
        
        // SIMPLE PROGRESS CALCULATION
        console.log('Calculating simple progress...');
        try {
          // Get fresh session data
          const sessionsResponse = await axios.get(`/api/coaches/${coach._id}/sessions`);
          const allSessions = sessionsResponse.data.data.docs || [];
          
          // Update customer progress based on actual attendance
          const updatedCustomers = customers.map(customer => {
            // Find sessions for this customer
            const customerSessions = allSessions.filter(session => 
              session.participants?.some(participant => 
                participant.user && participant.user._id === customer._id
              )
            );
            
            // Take only first 2 sessions (most recent)
            const recentSessions = customerSessions
              .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
              .slice(0, 2);
            
            // Count completed sessions (any attendance marked)
            const completedSessions = recentSessions.filter(session => {
              const participant = session.participants?.find(p => p.user._id === customer._id);
              return participant && (participant.attended === true || participant.attended === false);
            }).length;
            
            // Count present sessions (only attended = true)
            const presentSessions = recentSessions.filter(session => {
              const participant = session.participants?.find(p => p.user._id === customer._id);
              return participant && participant.attended === true;
            }).length;
            
            console.log(`Customer ${customer.firstName} progress:`, {
              totalSessions: recentSessions.length,
              completedSessions,
              presentSessions
            });
            
            return {
              ...customer,
              totalSessions: recentSessions.length,
              completedSessions,
              presentSessions
            };
          });
          
          setCustomers(updatedCustomers);
          console.log('Customer progress updated successfully');
          
        } catch (refreshError) {
          console.warn('Could not calculate progress:', refreshError);
        }
        
        // Ensure we stay on the attendance page
        setShowCustomerSessions(true);
      }
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchEnrolledCustomers = async () => {
    try {
      if (!coach || !coach._id) return;
      
      const response = await axios.get(`/api/coaches/${coach._id}/enrolled-customers`);
      setEnrolledCustomers(response.data.data.customersByProgram || []);
    } catch (error) {
      console.warn('Could not fetch enrolled customers (this is optional):', error.message);
      // Don't set error state for this optional call
      setEnrolledCustomers([]);
    }
  };

  // SIMPLE CUSTOMER SESSIONS - NO COMPLEX LOGIC
  const fetchCustomerSessions = async (customerId, enrollmentId) => {
    try {
      console.log('=== SIMPLE CUSTOMER SESSIONS ===');
      console.log('Customer ID:', customerId);
      
      if (!coach || !coach._id) return;
      
      // Get all sessions for this coach
      const response = await axios.get(`/api/coaches/${coach._id}/sessions`);
      const allSessions = response.data.data.docs || [];
      
      // Filter sessions that include this customer
      const customerSessions = allSessions.filter(session => {
        return session.participants?.some(participant => 
          participant.user && participant.user._id === customerId
        );
      });
      
      console.log('Found customer sessions:', customerSessions.length);
      
      // Sort by date (newest first) and take first 2
      const sortedSessions = customerSessions
        .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
        .slice(0, 2);
      
      // Simple renaming to ensure Session 1 and Session 2
      const renamedSessions = sortedSessions.map((session, index) => ({
        ...session,
        title: `Session ${index + 1} - Test`
      }));
      
      console.log('Final sessions:', renamedSessions);
      setCustomerSessions(renamedSessions);
      
      // Find the customer from the customers array
      const customer = customers.find(c => c._id === customerId);
      setSelectedCustomer(customer ? customer.user : null);
      
      setShowCustomerSessions(true);
      
    } catch (error) {
      console.error('Error fetching customer sessions:', error);
      alert('Error fetching customer sessions: ' + error.message);
    }
  };

  const handleCustomerClick = async (customer) => {
    await fetchCustomerSessions(customer._id);
  };

  const handleBackToCustomers = () => {
    try {
      console.log('Going back to customers...');
      setShowCustomerSessions(false);
      setSelectedCustomer(null);
      setCustomerSessions([]);
      console.log('Successfully went back to customers');
    } catch (error) {
      console.error('Error going back to customers:', error);
      // Force reset all states
      setShowCustomerSessions(false);
      setSelectedCustomer(null);
      setCustomerSessions([]);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('userInfo');
      navigate('/login');
    }
  };

  // SIMPLE DEBUG FUNCTION
  const debugSessions = () => {
    console.log('=== SIMPLE SESSION DEBUG ===');
    console.log('Customer sessions:', customerSessions);
    console.log('Selected customer:', selectedCustomer);
    console.log('All customers:', customers);
    alert('Check console for session debug info');
  };
  window.debugSessions = debugSessions;
  
  // Test attendance marking function
  const testAttendanceMarking = async () => {
    try {
      console.log('=== TESTING ATTENDANCE MARKING ===');
      if (!selectedCustomer || !selectedSession) {
        alert('Please select a customer and session first');
        return;
      }
      
      const participant = selectedSession.participants?.find(p => p.user._id === selectedCustomer._id);
      if (!participant) {
        alert('Participant not found');
        return;
      }
      
      console.log('Testing with participant:', participant._id);
      console.log('Customer:', selectedCustomer._id);
      console.log('Session:', selectedSession._id);
      
      const response = await axios.put(
        `/api/coaches/${coach._id}/sessions/${selectedSession._id}/attendance`,
        { 
          attendanceData: [{
            participantId: participant._id,
            attended: true
          }]
        }
      );
      
      console.log('Test response:', response.data);
      alert('Test attendance marked! Check console and refresh page to see changes.');
      
    } catch (error) {
      console.error('Test attendance error:', error);
      alert('Test failed: ' + error.message);
    }
  };
  window.testAttendanceMarking = testAttendanceMarking;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchCoachData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getFilteredPrograms = () => {
    return assignedPrograms.filter(program => {
      const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           program.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All Categories' || program.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'All Levels' || program.difficulty === difficultyFilter;
      const matchesStatus = statusFilter === 'All Status' || 
                           (statusFilter === 'Active' && program.isActive) ||
                           (statusFilter === 'Inactive' && !program.isActive);
      
      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
    });
  };

  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const fullName = `${customer.user.firstName} ${customer.user.lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) ||
             customer.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const getFilteredSessions = () => {
    return sessions.filter(session => {
      const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.program.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Status' || session.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredEnrolledPrograms = () => {
    return enrolledPrograms.filter(enrollment => {
      const studentName = `${enrollment.user.firstName} ${enrollment.user.lastName}`.toLowerCase();
      const programTitle = enrollment.program.title.toLowerCase();
      const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
                           programTitle.includes(searchTerm.toLowerCase()) ||
                           enrollment.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Status' || enrollment.status === statusFilter;
      const matchesCategory = categoryFilter === 'All Categories' || enrollment.program.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  const getFilteredCoachSessions = () => {
    return coachSessions.filter(session => {
      const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.program?.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Status' || session.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-blue-800">
          <h1 className="text-xl font-bold">Coach Dashboard</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

          <nav className="mt-6">
            <div className="px-6 space-y-2">

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <User className="h-5 w-5 mr-3" />
              Profile
            </button>

            <button
              onClick={() => setActiveTab('programs')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'programs' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <BookOpen className="h-5 w-5 mr-3" />
              Programs
            </button>
            
            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'customers' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              Customers
            </button>
            
            <button
              onClick={() => setActiveTab('sessions')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'sessions' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Calendar className="h-5 w-5 mr-3" />
              Sessions
            </button>
            
            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'attendance' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <UserCheck className="h-5 w-5 mr-3" />
              Attendance
            </button>
            
            
            
            
          </div>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Coach Dashboard</h1>
            <div></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          {activeTab === 'programs' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Coaching Programs</h2>
                
                {/* Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search by title, description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="All Categories">All Categories</option>
                      <option value="Training">Training</option>
                      <option value="Specialized">Specialized</option>
                    </select>
                    
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="All Levels">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="All Status">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-600">Showing {getFilteredPrograms().length} of {assignedPrograms.length} programs</p>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Program Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getFilteredPrograms().map((program) => (
                  <ProgramCard
                    key={program._id}
                    program={program}
                    coach={coach}
                    onViewSessions={() => setSelectedProgram(program)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Customers</h2>
              
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Customer Cards */}
              {getFilteredCustomers().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredCustomers().map((customer) => {
                    // Find the enrollment data for this customer
                    const enrollment = enrolledPrograms.find(ep => ep.user._id === customer._id);
                    return (
                      <CustomerCard 
                        key={customer._id} 
                        customer={customer} 
                        enrollment={enrollment}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                  <p className="text-gray-500">
                    {customers.length === 0 
                      ? "No students are currently enrolled in your programs."
                      : "No customers match your search criteria."
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Sessions</h2>
              
              {/* Filter Bar */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All Status">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Session Cards */}
              <div className="space-y-4">
                {getFilteredSessions().map((session) => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    onGiveFeedback={(participant) => {
                      setSelectedParticipant(participant);
                      setShowFeedbackModal(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'enrolled' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Enrolled Programs</h2>
              
              {/* Filter Bar */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search by student name, program..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All Status">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Training">Training</option>
                    <option value="Specialized">Specialized</option>
                  </select>
                </div>
              </div>

              {/* Enrolled Programs Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getFilteredEnrolledPrograms().map((enrollment) => (
                  <EnrolledProgramCard key={enrollment._id} enrollment={enrollment} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Session Attendance</h2>
              
              {!showCustomerSessions ? (
                // Customer List View - Show customers directly like before
                <div>
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">Select a customer to view their sessions and mark attendance:</p>
                  </div>
                  
                  {customers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {customers.map((customer) => (
                        <div 
                          key={customer._id} 
                          onClick={() => handleCustomerClick(customer.user)}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {customer.user.firstName} {customer.user.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">{customer.user.email}</p>
                              {customer.user.contactNumber && (
                                <p className="text-sm text-gray-500">{customer.user.contactNumber}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Total Sessions</span>
                              <span className="text-gray-900 font-medium">{customer.totalSessions}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Completed Sessions</span>
                              <span className="text-gray-900 font-medium">{customer.completedSessions}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Progress</span>
                                <span className="text-gray-500">{Math.round(((customer.presentSessions || 0) / customer.totalSessions) * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.round(((customer.presentSessions || 0) / customer.totalSessions) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <User className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                      <div className="text-gray-400 text-6xl mb-4">👥</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enrolled Customers</h3>
                      <p className="text-gray-600">No customers are currently enrolled in your programs.</p>
                    </div>
                  )}
                </div>
              ) : (
                // Customer Sessions View
                <div>
                  <div className="flex items-center mb-6">
                    <button
                      onClick={handleBackToCustomers}
                      className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
                    >
                      <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
                      Back to Customers
                    </button>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedCustomer?.email}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-900">Session Attendance</h4>
                        <p className="text-sm text-blue-700">
                          Showing {customerSessions.length} sessions for {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {customerSessions.map((session) => (
                      <CustomerSessionCard
                        key={session._id}
                        session={session}
                        customer={selectedCustomer}
                        onMarkAttendance={(session) => {
                          setSelectedSession(session);
                          setShowAttendanceModal(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>
              
              {coach ? (
                <CoachProfileCard 
                  coach={coach} 
                  enrolledPrograms={enrolledPrograms}
                  sessions={sessions}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading profile...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Program Sessions Modal */}
      {selectedProgram && (
        <ProgramSessionsModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
          onGiveFeedback={(participant) => {
            setSelectedParticipant(participant);
            setShowFeedbackModal(true);
          }}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedParticipant && (
        <FeedbackModal
          participant={selectedParticipant}
          onSubmit={handleSubmitFeedback}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedParticipant(null);
          }}
        />
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedSession && (
        <AttendanceModal
          session={selectedSession}
          coach={coach}
          selectedCustomer={selectedCustomer}
          onSubmit={handleMarkAttendance}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
};

// Program Card Component
const ProgramCard = ({ program, coach, onViewSessions }) => {
  const enrollmentPercentage = Math.round((program.currentEnrollments / program.maxParticipants) * 100);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              {program.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{program.category}</p>
          <p className="text-gray-600 text-sm mb-4">{program.description}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Coach: {coach?.userId?.firstName} {coach?.userId?.lastName}</span>
          <span className="text-gray-500">Fee: LKR {program.fee}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Duration: {program.duration} weeks</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            program.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
            program.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {program.difficulty}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Enrollments: {program.currentEnrollments}/{program.maxParticipants}</span>
          <span className="text-gray-500">Sessions: {program.totalSessions}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Enrollment Progress</span>
            <span className="text-gray-500">{enrollmentPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${enrollmentPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Edit className="h-4 w-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Upload className="h-4 w-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};


// Session Card Component
const SessionCard = ({ session, onGiveFeedback }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{session.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{session.program?.title}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
            <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(session.scheduledDate)}
            </span>
            <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </span>
          </div>
          {session.ground && (
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              {session.ground.name}
            </div>
          )}
        </div>
        <div className="ml-4 text-center bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Participants</p>
          <p className="text-2xl font-bold text-blue-600">{session.participants?.length || 0}</p>
        </div>
      </div>
      
      {session.participants && session.participants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            Give Feedback:
          </p>
          <div className="flex flex-wrap gap-2">
            {session.participants.map((participant) => (
              <button
                key={participant._id}
                onClick={() => onGiveFeedback(participant)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm transition-colors font-medium"
              >
                {participant.user?.firstName} {participant.user?.lastName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Program Sessions Modal Component
const ProgramSessionsModal = ({ program, onClose, onGiveFeedback }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [program._id]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/sessions/program/${program._id}`);
      setSessions(response.data.data.docs || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Sessions for {program.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No sessions found for this program</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  onGiveFeedback={onGiveFeedback}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Feedback Modal Component
const FeedbackModal = ({ participant, onSubmit, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        participantId: participant._id,
        userId: participant.user._id,
        rating,
        comment: comment.trim()
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Give Feedback</h2>
          <p className="text-sm text-gray-600 mt-1">
            Feedback for {participant.user?.firstName} {participant.user?.lastName}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (1-5 stars)
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Share your feedback about this player's performance..."
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Coach Profile Card Component
const CoachProfileCard = ({ coach, enrolledPrograms, sessions }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    specializations: coach.specializations || [],
    experience: coach.experience || 0,
    bio: coach.bio || '',
    hourlyRate: coach.hourlyRate || 0,
    achievements: coach.achievements || []
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      specializations: coach.specializations || [],
      experience: coach.experience || 0,
      bio: coach.bio || '',
      hourlyRate: coach.hourlyRate || 0,
      achievements: coach.achievements || []
    });
  };

  const handleSave = async () => {
    try {
      // Here you would make an API call to update the coach profile
      // await axios.put(`/api/coaches/${coach._id}`, editData);
      console.log('Saving profile data:', editData);
      setIsEditing(false);
      // You might want to refresh the coach data here
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      specializations: coach.specializations || [],
      experience: coach.experience || 0,
      bio: coach.bio || '',
      hourlyRate: coach.hourlyRate || 0,
      achievements: coach.achievements || []
    });
  };

  const addSpecialization = () => {
    setEditData(prev => ({
      ...prev,
      specializations: [...prev.specializations, '']
    }));
  };

  const updateSpecialization = (index, value) => {
    setEditData(prev => ({
      ...prev,
      specializations: prev.specializations.map((spec, i) => i === index ? value : spec)
    }));
  };

  const removeSpecialization = (index) => {
    setEditData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const addAchievement = () => {
    setEditData(prev => ({
      ...prev,
      achievements: [...prev.achievements, '']
    }));
  };

  const updateAchievement = (index, value) => {
    setEditData(prev => ({
      ...prev,
      achievements: prev.achievements.map((ach, i) => i === index ? value : ach)
    }));
  };

  const removeAchievement = (index) => {
    setEditData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {coach.userId?.firstName} {coach.userId?.lastName}
            </h3>
            <p className="text-gray-600">{coach.userId?.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                coach.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {coach.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-sm text-gray-500">
                {coach.assignedPrograms?.length || 0} Programs
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Personal Information
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <p className="text-gray-900">{coach.userId?.firstName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <p className="text-gray-900">{coach.userId?.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{coach.userId?.email}</p>
            </div>
            {coach.userId?.contactNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <p className="text-gray-900">{coach.userId.contactNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Professional Information
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Experience</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.experience}
                  onChange={(e) => setEditData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              ) : (
                <p className="text-gray-900">{coach.experience || 0} years</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.hourlyRate}
                  onChange={(e) => setEditData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              ) : (
                <p className="text-gray-900">LKR {coach.hourlyRate || 0}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
          Specializations
        </h4>
        
        {isEditing ? (
          <div className="space-y-3">
            {editData.specializations.map((spec, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={spec}
                  onChange={(e) => updateSpecialization(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter specialization"
                />
                <button
                  onClick={() => removeSpecialization(index)}
                  className="p-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addSpecialization}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Specialization
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {coach.specializations?.length > 0 ? (
              coach.specializations.map((spec, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {spec}
                </span>
              ))
            ) : (
              <p className="text-gray-500 italic">No specializations added</p>
            )}
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
          Bio
        </h4>
        
        {isEditing ? (
          <textarea
            value={editData.bio}
            onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about your coaching experience and philosophy..."
          />
        ) : (
          <p className="text-gray-900 whitespace-pre-wrap">
            {coach.bio || 'No bio available'}
          </p>
        )}
      </div>

      {/* Achievements */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
          Achievements
        </h4>
        
        {isEditing ? (
          <div className="space-y-3">
            {editData.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={achievement}
                  onChange={(e) => updateAchievement(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter achievement"
                />
                <button
                  onClick={() => removeAchievement(index)}
                  className="p-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addAchievement}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Achievement
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {coach.achievements?.length > 0 ? (
              coach.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-900">{achievement}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No achievements added</p>
            )}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Assigned Programs</p>
              <p className="text-2xl font-bold text-blue-600">{coach.assignedPrograms?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-green-600">{enrolledPrograms.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-purple-600">{sessions.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enrolled Program Card Component
const EnrolledProgramCard = ({ enrollment }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {enrollment.user.firstName} {enrollment.user.lastName}
              </h3>
              <p className="text-sm text-gray-600">{enrollment.user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
              {enrollment.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(enrollment.paymentStatus)}`}>
              {enrollment.paymentStatus}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-gray-900 mb-1">{enrollment.program.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{enrollment.program.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{enrollment.program.category}</span>
            <span>•</span>
            <span>LKR {enrollment.program.fee}</span>
            <span>•</span>
            <span>{enrollment.program.duration} weeks</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="text-gray-900 font-medium">
              {enrollment.progress.completedSessions}/{enrollment.progress.totalSessions} sessions
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${enrollment.progress.progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Enrolled</span>
            <span className="text-gray-500">{formatDate(enrollment.enrollmentDate)}</span>
          </div>
        </div>
        
        {enrollment.sessions && enrollment.sessions.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Recent Sessions:</p>
            <div className="space-y-1">
              {enrollment.sessions.slice(0, 2).map((session) => (
                <div key={session._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{session.title}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status}
                  </span>
                </div>
              ))}
              {enrollment.sessions.length > 2 && (
                <p className="text-xs text-gray-500">+{enrollment.sessions.length - 2} more sessions</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <MessageSquare className="h-4 w-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <User className="h-4 w-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
          <Edit className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Session Attendance Card Component
const SessionAttendanceCard = ({ session, onMarkAttendance }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{session.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{session.program?.title}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
            <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(session.scheduledDate)}
            </span>
            <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </span>
          </div>
          {session.ground && (
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              {session.ground.name}
            </div>
          )}
        </div>
        
        {/* Attendance Stats */}
        <div className="ml-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3 mb-2">
            <p className="text-sm text-gray-500">Attendance</p>
            <p className={`text-2xl font-bold ${getAttendanceColor(session.attendanceStats?.attendancePercentage || 0)}`}>
              {session.attendanceStats?.attendancePercentage || 0}%
            </p>
            <p className="text-xs text-gray-500">
              {session.attendanceStats?.attendedCount || 0}/{session.attendanceStats?.totalParticipants || 0}
            </p>
          </div>
          
          <button
            onClick={() => onMarkAttendance(session)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Mark Attendance
          </button>
        </div>
      </div>
      
      {/* Participants List */}
      {session.participants && session.participants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">Participants:</p>
          <div className="flex flex-wrap gap-2">
            {session.participants.map((participant) => (
              <div
                key={participant._id}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  participant.attended 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {participant.attended ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                {participant.user?.firstName} {participant.user?.lastName}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Attendance Modal Component
const AttendanceModal = ({ session, coach, selectedCustomer, onSubmit, onClose }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Initialize attendance data - handle both multi-participant and single customer scenarios
    let initialData = [];
    
    console.log('=== ATTENDANCE MODAL INITIALIZATION ===');
    console.log('Session:', session);
    console.log('Selected Customer:', selectedCustomer);
    console.log('Session Participants:', session.participants);
    
    if (session.participants && session.participants.length > 0) {
      // Find the participant for the selected customer
      const participant = session.participants.find(p => p.user && p.user._id === selectedCustomer?._id);
      
      if (participant) {
        console.log('Found participant for customer:', {
          participantId: participant._id,
          userId: participant.user._id,
          customerId: selectedCustomer?._id,
          attended: participant.attended
        });
        
        initialData = [{
          participantId: participant._id,
          attended: participant.attended || false,
          performance: {
            rating: participant.performance?.rating || 5,
            notes: participant.performance?.notes || ''
          }
        }];
      } else {
        console.error('Participant not found for customer:', {
          customerId: selectedCustomer?._id,
          availableParticipants: session.participants.map(p => ({
            _id: p._id,
            user: p.user,
            attended: p.attended
          }))
        });
        
        // Try to find participant by user ID directly
        const participantByUserId = session.participants.find(p => p.user?._id === selectedCustomer?._id);
        if (participantByUserId) {
          console.log('Found participant by user ID:', participantByUserId);
          initialData = [{
            participantId: participantByUserId._id,
            attended: participantByUserId.attended || false,
            performance: {
              rating: participantByUserId.performance?.rating || 5,
              notes: participantByUserId.performance?.notes || ''
            }
          }];
        } else {
        // Fallback - create a default entry with user ID
        initialData = [{
          participantId: selectedCustomer?._id, // Use user ID as fallback
          attended: false,
          performance: {
            rating: 5,
            notes: ''
          }
        }];
        }
      }
    } else {
      console.error('No participants found in session:', session);
      // Fallback - create a default entry
      initialData = [{
        participantId: selectedCustomer?._id, // Use user ID as fallback
        attended: false,
        performance: {
          rating: 5,
          notes: ''
        }
      }];
    }
    
    console.log('Initial attendance data:', initialData);
    setAttendanceData(initialData);
  }, [session, selectedCustomer]);

  const handleAttendanceChange = (participantId, attended) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.participantId === participantId 
          ? { ...item, attended }
          : item
      )
    );
  };

  const handlePerformanceChange = (participantId, field, value) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.participantId === participantId 
          ? { 
              ...item, 
              performance: { 
                ...item.performance, 
                [field]: value 
              } 
            }
          : item
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      console.log('=== ATTENDANCE MODAL SUBMIT ===');
      console.log('Submitting attendance data:', attendanceData);
      
      // Ensure we have valid data
      const validAttendanceData = attendanceData.filter(item => 
        item.participantId && typeof item.attended === 'boolean'
      );
      
      if (validAttendanceData.length === 0) {
        alert('No valid attendance data to submit');
        return;
      }
      
      console.log('Valid attendance data:', validAttendanceData);
      await onSubmit(validAttendanceData);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Mark Attendance</h2>
            <p className="text-sm text-gray-600">
              {session.title} - {formatDate(session.scheduledDate)} at {formatTime(session.startTime)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {attendanceData.map((item) => {
              const participant = session.participants.find(p => p._id === item.participantId);
              return (
                <div key={item.participantId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {participant?.user?.firstName} {participant?.user?.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{participant?.user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleAttendanceChange(item.participantId, false)}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                          !item.attended 
                            ? 'bg-red-100 text-red-800 border-2 border-red-300' 
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttendanceChange(item.participantId, true)}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                          item.attended 
                            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Present
                      </button>
                    </div>
                  </div>
                  
                  {item.attended && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Performance Rating (1-5)
                          </label>
                          <select
                            value={item.performance.rating}
                            onChange={(e) => handlePerformanceChange(item.participantId, 'rating', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value={1}>1 - Poor</option>
                            <option value={2}>2 - Below Average</option>
                            <option value={3}>3 - Average</option>
                            <option value={4}>4 - Good</option>
                            <option value={5}>5 - Excellent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={item.performance.notes}
                            onChange={(e) => handlePerformanceChange(item.participantId, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Performance notes..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Customer Card Component
const CustomerCard = ({ customer, onCustomerClick }) => {
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      onClick={onCustomerClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {customer.user.firstName} {customer.user.lastName}
            </h4>
            <p className="text-sm text-gray-600">{customer.user.email}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
          {customer.status}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress:</span>
          <span className={`font-medium ${getProgressColor(customer.progress.progressPercentage || 0)}`}>
            {customer.progress.progressPercentage || 0}%
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Sessions:</span>
          <span className="font-medium">
            {customer.progress.completedSessions || 0} / {customer.progress.totalSessions || 0}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Enrolled:</span>
          <span className="font-medium">
            {new Date(customer.enrollmentDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// Customer Session Card Component
const CustomerSessionCard = ({ session, customer, onMarkAttendance }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Find the participant for this customer in the session
  const participant = session.participants?.find(p => p.user && p.user._id === customer._id);
  
  console.log('CustomerSessionCard - Session:', session.title);
  console.log('CustomerSessionCard - Customer:', customer);
  console.log('CustomerSessionCard - Participant:', participant);
  
  const getAttendanceStatus = () => {
    if (!participant) {
      console.log('No participant found for customer');
      return { status: 'Not Enrolled', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
    
    console.log('Participant attendance status:', participant.attended);
    
    if (participant.attended === true) {
      return { status: 'Present', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (participant.attended === false) {
      return { status: 'Absent', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else {
      return { status: 'Not Marked', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const attendanceStatus = getAttendanceStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {session.title}
          </h3>
          <p className="text-gray-600 mb-3">{session.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(session.scheduledDate)}
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </div>
            
            {session.ground && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {session.ground.name}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
            {session.status}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${attendanceStatus.bgColor} ${attendanceStatus.color}`}>
            {attendanceStatus.status}
          </div>
          
          {participant?.attendanceMarkedAt && (
            <div className="text-sm text-gray-500">
              Marked: {new Date(participant.attendanceMarkedAt).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
        <button
          onClick={() => onMarkAttendance(session)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <UserCheck className="h-4 w-4 mr-1" />
          Mark Attendance
        </button>
          
          {/* Debug button - remove in production */}
          <button
            onClick={() => {
              console.log('=== DEBUG ATTENDANCE ===');
              console.log('Session:', session);
              console.log('Customer:', customer);
              console.log('Participant:', participant);
              alert('Check console for debug info');
            }}
            className="flex items-center px-2 py-1 bg-gray-500 text-white rounded text-xs"
          >
            Debug
        </button>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;

