import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SessionCalendar({ enrollment, onClose }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

    useEffect(() => {
        fetchSessions();
    }, [enrollment, currentMonth]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // Fetch sessions for this program
            const { data } = await axios.get(
                `http://localhost:5000/api/sessions/program/${enrollment.program._id}`,
                config
            );

            if (data.success) {
                // Filter sessions where the user is a participant
                const userSessions = data.data.docs.filter(session => 
                    session.participants.some(participant => 
                        participant.user._id === userInfo._id
                    )
                );
                setSessions(userSessions);
            }
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError('Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
    };

    const getSessionsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return sessions.filter(session => {
            const sessionDate = new Date(session.scheduledDate).toISOString().split('T')[0];
            return sessionDate === dateStr;
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-500';
            case 'in-progress':
                return 'bg-yellow-500';
            case 'completed':
                return 'bg-green-500';
            case 'cancelled':
                return 'bg-red-500';
            case 'rescheduled':
                return 'bg-purple-500';
            default:
                return 'bg-gray-500';
        }
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const navigateMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
    };

    const upcomingSessions = sessions
        .filter(session => new Date(session.scheduledDate) >= new Date())
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading sessions...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">
                        Session Calendar - {enrollment.program.title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* View Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'calendar'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            📅 Calendar View
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            📋 List View
                        </button>
                    </div>
                </div>

                {viewMode === 'calendar' ? (
                    <div className="space-y-4">
                        {/* Calendar Header */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => navigateMonth(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                ←
                            </button>
                            <h3 className="text-xl font-semibold">
                                {formatMonthYear(currentMonth)}
                            </h3>
                            <button
                                onClick={() => navigateMonth(1)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                →
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Day headers */}
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                                    {day}
                                </div>
                            ))}
                            
                            {/* Calendar days */}
                            {getDaysInMonth(currentMonth).map((date, index) => {
                                const daySessions = getSessionsForDate(date);
                                const isToday = date && date.toDateString() === new Date().toDateString();
                                
                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[100px] p-2 border border-gray-200 ${
                                            date ? 'bg-white' : 'bg-gray-50'
                                        } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                                    >
                                        {date && (
                                            <>
                                                <div className={`text-sm font-medium mb-1 ${
                                                    isToday ? 'text-blue-600' : 'text-gray-700'
                                                }`}>
                                                    {date.getDate()}
                                                </div>
                                                <div className="space-y-1">
                                                    {daySessions.map((session, sessionIndex) => (
                                                        <div
                                                            key={sessionIndex}
                                                            className={`text-xs p-1 rounded text-white truncate ${getStatusColor(session.status)}`}
                                                            title={`${session.startTime} - ${session.endTime} (${session.status})`}
                                                        >
                                                            {session.startTime}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span>Scheduled</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                <span>In Progress</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span>Completed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span>Cancelled</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                                <span>Rescheduled</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Upcoming Sessions</h3>
                        {upcomingSessions.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-gray-400 text-4xl mb-4">📅</div>
                                <p className="text-gray-600">No upcoming sessions scheduled.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingSessions.map((session) => (
                                    <div key={session._id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-lg text-gray-800">
                                                    {session.title}
                                                </h4>
                                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                    <p>
                                                        <strong>Date:</strong> {new Date(session.scheduledDate).toLocaleDateString()}
                                                    </p>
                                                    <p>
                                                        <strong>Time:</strong> {session.startTime} - {session.endTime}
                                                    </p>
                                                    <p>
                                                        <strong>Ground:</strong> Slot {session.groundSlot}
                                                    </p>
                                                    <p>
                                                        <strong>Week:</strong> {session.week}, Session: {session.sessionNumber}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                    session.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {session.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
