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
  X
} from 'lucide-react';
import axios from 'axios';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sessions, setSessions] = useState([]);
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

  useEffect(() => {
    fetchCoachData();
  }, []);

  const fetchCoachData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      
      // Use mock data for testing - no authentication required
      const mockCoach = {
        _id: 'mock-coach-id',
        userId: {
          firstName: userInfo?.firstName || 'John',
          lastName: userInfo?.lastName || 'Smith',
          email: userInfo?.email || 'john.smith@example.com'
        },
        specializations: ['Batting', 'Bowling', 'Fielding'],
        assignedPrograms: ['program1', 'program2']
      };
      setCoach(mockCoach);
      
      // Mock programs
      const mockPrograms = [
        {
          _id: 'program1',
          title: 'Beginner Cricket Training',
          description: 'Learn the basics of cricket including batting, bowling, and fielding techniques.',
          currentEnrollments: 8,
          maxParticipants: 15,
          duration: 8,
          difficulty: 'beginner',
          category: 'Training',
          fee: 200,
          totalSessions: 10,
          isActive: true
        },
        {
          _id: 'program2',
          title: 'Advanced Batting Masterclass',
          description: 'Advanced techniques for experienced players looking to improve their batting skills.',
          currentEnrollments: 5,
          maxParticipants: 10,
          duration: 6,
          difficulty: 'advanced',
          category: 'Specialized',
          fee: 350,
          totalSessions: 8,
          isActive: true
        }
      ];
      setAssignedPrograms(mockPrograms);
      
      // Mock customers
      const mockCustomers = [
        {
          _id: 'customer1',
          user: { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com' },
          enrolledPrograms: ['program1'],
          totalSessions: 5,
          completedSessions: 3
        },
        {
          _id: 'customer2',
          user: { firstName: 'Bob', lastName: 'Wilson', email: 'bob@example.com' },
          enrolledPrograms: ['program1', 'program2'],
          totalSessions: 8,
          completedSessions: 6
        },
        {
          _id: 'customer3',
          user: { firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com' },
          enrolledPrograms: ['program2'],
          totalSessions: 3,
          completedSessions: 1
        }
      ];
      setCustomers(mockCustomers);
      
      // Mock sessions
      const mockSessions = [
        {
          _id: 'session1',
          title: 'Basic Batting Techniques',
          program: { title: 'Beginner Cricket Training' },
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          startTime: '10:00',
          endTime: '12:00',
          status: 'scheduled',
          ground: { name: 'Main Cricket Ground' },
          participants: [
            { _id: 'p1', user: { firstName: 'Alice', lastName: 'Johnson' } },
            { _id: 'p2', user: { firstName: 'Bob', lastName: 'Wilson' } }
          ]
        },
        {
          _id: 'session2',
          title: 'Bowling Fundamentals',
          program: { title: 'Beginner Cricket Training' },
          scheduledDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          startTime: '14:00',
          endTime: '16:00',
          status: 'scheduled',
          ground: { name: 'Practice Ground' },
          participants: [
            { _id: 'p3', user: { firstName: 'Charlie', lastName: 'Brown' } }
          ]
        }
      ];
      setSessions(mockSessions);
      
    } catch (error) {
      console.error('Error fetching coach data:', error);
      // Set default data even if there's an error
      const defaultCoach = {
        _id: 'default-coach-id',
        userId: {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com'
        },
        specializations: ['Batting', 'Bowling', 'Fielding'],
        assignedPrograms: []
      };
      setCoach(defaultCoach);
      setAssignedPrograms([]);
      setCustomers([]);
      setSessions([]);
      setError(null); // Clear any previous errors
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

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('userInfo');
      navigate('/login');
    }
  };

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredCustomers().map((customer) => (
                  <CustomerCard key={customer._id} customer={customer} />
                ))}
              </div>
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
    </div>
  );
};

// Program Card Component
const ProgramCard = ({ program, onViewSessions }) => {
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
          <span className="text-gray-500">Coach: John Smith</span>
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

// Customer Card Component
const CustomerCard = ({ customer }) => {
  const completionPercentage = Math.round((customer.completedSessions / customer.totalSessions) * 100);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {customer.user.firstName} {customer.user.lastName}
          </h3>
          <p className="text-sm text-gray-600">{customer.user.email}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Programs Enrolled</span>
          <span className="text-gray-900 font-medium">{customer.enrolledPrograms.length}</span>
        </div>
        
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
            <span className="text-gray-500">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
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

export default CoachDashboard;
