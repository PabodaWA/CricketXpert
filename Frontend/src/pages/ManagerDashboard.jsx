import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Link, 
  FileText, 
  Video, 
  Settings,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Clock,
  MapPin,
  Star,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [coaches, setCoaches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Form states
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [programForm, setProgramForm] = useState({
    title: '',
    description: '',
    fee: '',
    duration: '',
    coach: '',
    category: '',
    specialization: '',
    difficulty: 'beginner',
    totalSessions: 10,
    maxParticipants: 20,
    isActive: true
  });
  const [materialForm, setMaterialForm] = useState({
    name: '',
    type: 'document',
    url: ''
  });
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: '',
    newStartTime: '',
    newEndTime: '',
    reason: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API, but fallback to mock data if API is not available
      try {
        const [coachesRes, programsRes, sessionsRes] = await Promise.all([
          axios.get('/api/coaches'),
          axios.get('/api/programs'),
          axios.get('/api/sessions')
        ]);

        setCoaches(coachesRes.data.data.docs || []);
        setPrograms(programsRes.data.data.docs || []);
        setSessions(sessionsRes.data.data.docs || []);
      } catch (apiError) {
        console.warn('API not available, using mock data:', apiError);
        
        // Use mock data for development
        const mockCoaches = [
          {
            _id: 'coach1',
            userId: {
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.smith@example.com'
            },
            specializations: ['Batting', 'Bowling'],
            experience: 5,
            assignedPrograms: ['program1', 'program2']
          },
          {
            _id: 'coach2',
            userId: {
              firstName: 'Sarah',
              lastName: 'Johnson',
              email: 'sarah.johnson@example.com'
            },
            specializations: ['Fielding', 'Wicket Keeping'],
            experience: 8,
            assignedPrograms: ['program2']
          }
        ];

        const mockPrograms = [
          {
            _id: 'program1',
            title: 'Beginner Cricket Training',
            description: 'Learn the basics of cricket including batting, bowling, and fielding techniques.',
            fee: 200,
            duration: 8,
            coach: {
              _id: 'coach1',
              userId: {
                firstName: 'John',
                lastName: 'Smith'
              }
            },
            category: 'Training',
            specialization: 'General',
            difficulty: 'beginner',
            totalSessions: 10,
            maxParticipants: 15,
            currentEnrollments: 8,
            isActive: true,
            materials: []
          },
          {
            _id: 'program2',
            title: 'Advanced Batting Masterclass',
            description: 'Advanced techniques for experienced players looking to improve their batting skills.',
            fee: 350,
            duration: 6,
            coach: {
              _id: 'coach1',
              userId: {
                firstName: 'John',
                lastName: 'Smith'
              }
            },
            category: 'Specialized',
            specialization: 'Batting',
            difficulty: 'advanced',
            totalSessions: 8,
            maxParticipants: 10,
            currentEnrollments: 5,
            isActive: true,
            materials: []
          }
        ];

        const mockSessions = [
          {
            _id: 'session1',
            title: 'Basic Batting Techniques',
            program: { title: 'Beginner Cricket Training' },
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            startTime: '10:00',
            endTime: '12:00',
            status: 'scheduled',
            sessionNumber: 1,
            week: 1,
            maxParticipants: 15,
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
            sessionNumber: 2,
            week: 1,
            maxParticipants: 15,
            participants: [
              { _id: 'p3', user: { firstName: 'Charlie', lastName: 'Brown' } }
            ]
          }
        ];

        setCoaches(mockCoaches);
        setPrograms(mockPrograms);
        setSessions(mockSessions);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/programs', programForm);
      setPrograms([...programs, response.data.data]);
      setShowProgramModal(false);
      resetProgramForm();
    } catch (error) {
      console.error('Error creating program:', error);
      // For development, add to local state even if API fails
      const newProgram = {
        _id: `program_${Date.now()}`,
        ...programForm,
        coach: coaches.find(c => c._id === programForm.coach),
        currentEnrollments: 0,
        materials: []
      };
      setPrograms([...programs, newProgram]);
      setShowProgramModal(false);
      resetProgramForm();
      alert('Program created locally (API not available)');
    }
  };

  const handleUpdateProgram = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/programs/${selectedProgram._id}`, programForm);
      setPrograms(programs.map(p => p._id === selectedProgram._id ? response.data.data : p));
      setShowProgramModal(false);
      setSelectedProgram(null);
      resetProgramForm();
    } catch (error) {
      console.error('Error updating program:', error);
      // For development, update local state even if API fails
      const updatedProgram = {
        ...selectedProgram,
        ...programForm,
        coach: coaches.find(c => c._id === programForm.coach)
      };
      setPrograms(programs.map(p => p._id === selectedProgram._id ? updatedProgram : p));
      setShowProgramModal(false);
      setSelectedProgram(null);
      resetProgramForm();
      alert('Program updated locally (API not available)');
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('Are you sure you want to delete this program?')) return;
    
    try {
      await axios.delete(`/api/programs/${programId}`);
      setPrograms(programs.filter(p => p._id !== programId));
    } catch (error) {
      console.error('Error deleting program:', error);
      // For development, remove from local state even if API fails
      setPrograms(programs.filter(p => p._id !== programId));
      alert('Program deleted locally (API not available)');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/programs/${selectedProgram._id}/materials`, materialForm);
      setPrograms(programs.map(p => p._id === selectedProgram._id ? response.data.data : p));
      setShowMaterialModal(false);
      setMaterialForm({ name: '', type: 'document', url: '' });
    } catch (error) {
      console.error('Error adding material:', error);
      // For development, add to local state even if API fails
      const updatedProgram = {
        ...selectedProgram,
        materials: [...(selectedProgram.materials || []), { ...materialForm, _id: `material_${Date.now()}` }]
      };
      setPrograms(programs.map(p => p._id === selectedProgram._id ? updatedProgram : p));
      setShowMaterialModal(false);
      setMaterialForm({ name: '', type: 'document', url: '' });
      alert('Material added locally (API not available)');
    }
  };

  const handleAssignCoach = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/coaches/${selectedCoach._id}/assign-program`, {
        programId: selectedProgram._id
      });
      await fetchDashboardData(); // Refresh data
      setShowAssignModal(false);
      setSelectedCoach(null);
      setSelectedProgram(null);
    } catch (error) {
      console.error('Error assigning coach:', error);
      // For development, update local state even if API fails
      const updatedCoach = {
        ...selectedCoach,
        assignedPrograms: [...(selectedCoach.assignedPrograms || []), selectedProgram._id]
      };
      setCoaches(coaches.map(c => c._id === selectedCoach._id ? updatedCoach : c));
      setShowAssignModal(false);
      setSelectedCoach(null);
      setSelectedProgram(null);
      alert('Coach assigned locally (API not available)');
    }
  };

  const handleRescheduleSession = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/sessions/${selectedSession._id}/reschedule`, rescheduleForm);
      await fetchDashboardData(); // Refresh data
      setShowRescheduleModal(false);
      setSelectedSession(null);
      setRescheduleForm({ newDate: '', newStartTime: '', newEndTime: '', reason: '' });
    } catch (error) {
      console.error('Error rescheduling session:', error);
      // For development, update local state even if API fails
      const updatedSession = {
        ...selectedSession,
        scheduledDate: new Date(rescheduleForm.newDate).toISOString(),
        startTime: rescheduleForm.newStartTime,
        endTime: rescheduleForm.newEndTime,
        status: 'rescheduled',
        notes: rescheduleForm.reason ? `Rescheduled: ${rescheduleForm.reason}` : 'Session rescheduled by manager'
      };
      setSessions(sessions.map(s => s._id === selectedSession._id ? updatedSession : s));
      setShowRescheduleModal(false);
      setSelectedSession(null);
      setRescheduleForm({ newDate: '', newStartTime: '', newEndTime: '', reason: '' });
      alert('Session rescheduled locally (API not available)');
    }
  };

  const resetProgramForm = () => {
    setProgramForm({
      title: '',
      description: '',
      fee: '',
      duration: '',
      coach: '',
      category: '',
      specialization: '',
      difficulty: 'beginner',
      totalSessions: 10,
      maxParticipants: 20,
      isActive: true
    });
  };

  const openProgramModal = (program = null) => {
    setSelectedProgram(program);
    if (program) {
      setProgramForm({
        title: program.title,
        description: program.description,
        fee: program.fee,
        duration: program.duration,
        coach: program.coach._id,
        category: program.category,
        specialization: program.specialization,
        difficulty: program.difficulty,
        totalSessions: program.totalSessions,
        maxParticipants: program.maxParticipants,
        isActive: program.isActive
      });
    } else {
      resetProgramForm();
    }
    setShowProgramModal(true);
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
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-4xl font-bold">Manager Dashboard</h1>
              <p className="mt-2 text-purple-100 text-lg">
                Manage coaching programs, coaches, and sessions
              </p>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-purple-100 text-sm">Total Coaches</p>
                <p className="text-3xl font-bold">{coaches.length}</p>
              </div>
              <div className="text-center bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-purple-100 text-sm">Active Programs</p>
                <p className="text-3xl font-bold">{programs.filter(p => p.isActive).length}</p>
              </div>
              <div className="text-center bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-purple-100 text-sm">Upcoming Sessions</p>
                <p className="text-3xl font-bold">{sessions.filter(s => s.status === 'scheduled').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Settings },
              { id: 'programs', label: 'Programs', icon: BookOpen },
              { id: 'coaches', label: 'Coaches', icon: Users },
              { id: 'sessions', label: 'Sessions', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab coaches={coaches} programs={programs} sessions={sessions} />}
        {activeTab === 'programs' && (
          <ProgramsTab 
            programs={programs} 
            coaches={coaches}
            onEdit={openProgramModal}
            onDelete={handleDeleteProgram}
            onAddMaterial={(program) => {
              setSelectedProgram(program);
              setShowMaterialModal(true);
            }}
            onAssignCoach={(program) => {
              setSelectedProgram(program);
              setShowAssignModal(true);
            }}
          />
        )}
        {activeTab === 'coaches' && <CoachesTab coaches={coaches} programs={programs} />}
        {activeTab === 'sessions' && (
          <SessionsTab 
            sessions={sessions} 
            onReschedule={(session) => {
              setSelectedSession(session);
              setShowRescheduleModal(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
      {showProgramModal && (
        <ProgramModal
          program={selectedProgram}
          form={programForm}
          setForm={setProgramForm}
          coaches={coaches}
          onSubmit={selectedProgram ? handleUpdateProgram : handleCreateProgram}
          onClose={() => {
            setShowProgramModal(false);
            setSelectedProgram(null);
            resetProgramForm();
          }}
        />
      )}

      {showMaterialModal && selectedProgram && (
        <MaterialModal
          program={selectedProgram}
          form={materialForm}
          setForm={setMaterialForm}
          onSubmit={handleAddMaterial}
          onClose={() => {
            setShowMaterialModal(false);
            setSelectedProgram(null);
            setMaterialForm({ name: '', type: 'document', url: '' });
          }}
        />
      )}

      {showAssignModal && selectedProgram && (
        <AssignCoachModal
          program={selectedProgram}
          coaches={coaches}
          onAssign={handleAssignCoach}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedProgram(null);
          }}
        />
      )}

      {showRescheduleModal && selectedSession && (
        <RescheduleModal
          session={selectedSession}
          form={rescheduleForm}
          setForm={setRescheduleForm}
          onSubmit={handleRescheduleSession}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedSession(null);
            setRescheduleForm({ newDate: '', newStartTime: '', newEndTime: '', reason: '' });
          }}
        />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ coaches, programs, sessions }) => {
  const activePrograms = programs.filter(p => p.isActive);
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const totalEnrollments = programs.reduce((sum, p) => sum + (p.currentEnrollments || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Coaches</p>
            <p className="text-2xl font-bold text-gray-900">{coaches.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Programs</p>
            <p className="text-2xl font-bold text-gray-900">{activePrograms.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Calendar className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{upcomingSessions.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <UserPlus className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
            <p className="text-2xl font-bold text-gray-900">{totalEnrollments}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Programs Tab Component
const ProgramsTab = ({ programs, coaches, onEdit, onDelete, onAddMaterial, onAssignCoach }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Coaching Programs</h2>
        <button
          onClick={() => onEdit(null)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Program</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programs.map((program) => (
                <tr key={program._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{program.title}</div>
                      <div className="text-sm text-gray-500">{program.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {program.coach?.userId?.firstName} {program.coach?.userId?.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {program.currentEnrollments || 0}/{program.maxParticipants}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      program.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {program.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(program)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onAddMaterial(program)}
                        className="text-green-600 hover:text-green-900"
                        title="Add Material"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onAssignCoach(program)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Assign Coach"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(program._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Coaches Tab Component
const CoachesTab = ({ coaches, programs }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Coaches</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map((coach) => (
          <div key={coach._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900">
                  {coach.userId?.firstName} {coach.userId?.lastName}
                </h3>
                <p className="text-sm text-gray-500">{coach.userId?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {coach.specializations?.slice(0, 3).map((spec, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {spec}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Programs: {coach.assignedPrograms?.length || 0}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Sessions Tab Component
const SessionsTab = ({ sessions, onReschedule }) => {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sessions</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{session.title}</div>
                    <div className="text-sm text-gray-500">Session {session.sessionNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.program?.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(session.scheduledDate)}</div>
                    <div className="text-sm text-gray-500">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {session.participants?.length || 0}/{session.maxParticipants}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      session.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onReschedule(session)}
                      className="text-orange-600 hover:text-orange-900"
                      title="Reschedule Session"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Program Modal Component
const ProgramModal = ({ program, form, setForm, coaches, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {program ? 'Edit Program' : 'Create New Program'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
              <input
                type="number"
                value={form.fee}
                onChange={(e) => setForm({...form, fee: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({...form, duration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
              <input
                type="number"
                value={form.maxParticipants}
                onChange={(e) => setForm({...form, maxParticipants: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
              <select
                value={form.coach}
                onChange={(e) => setForm({...form, coach: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a coach</option>
                {coaches.map(coach => (
                  <option key={coach._id} value={coach._id}>
                    {coach.userId?.firstName} {coach.userId?.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({...form, difficulty: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({...form, isActive: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {program ? 'Update Program' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Material Modal Component
const MaterialModal = ({ program, form, setForm, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add Material</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({...form, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="document">Document (PDF)</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({...form, url: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/file.pdf"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Material
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assign Coach Modal Component
const AssignCoachModal = ({ program, coaches, onAssign, onClose }) => {
  const [selectedCoachId, setSelectedCoachId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCoachId) {
      onAssign(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Assign Coach</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <input
              type="text"
              value={program.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Coach</label>
            <select
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a coach</option>
              {coaches.map(coach => (
                <option key={coach._id} value={coach._id}>
                  {coach.userId?.firstName} {coach.userId?.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Assign Coach
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reschedule Modal Component
const RescheduleModal = ({ session, form, setForm, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Reschedule Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <input
              type="text"
              value={session.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
            <input
              type="date"
              value={form.newDate}
              onChange={(e) => setForm({...form, newDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.newStartTime}
                onChange={(e) => setForm({...form, newStartTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.newEndTime}
                onChange={(e) => setForm({...form, newEndTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({...form, reason: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reason for rescheduling..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Reschedule Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerDashboard;
