import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EnrollmentCalendar({ enrollment, onClose }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchSessions();
    }, [enrollment, currentMonth]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            if (!enrollment || !enrollment._id) {
                setError('No enrollment data available');
                return;
            }

            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.token) {
                setError('Please log in to view sessions');
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // Fetch sessions for this enrollment
            const { data } = await axios.get(
                `http://localhost:5000/api/sessions/enrollment/${enrollment._id}?t=${Date.now()}`,
                config
            );

            if (data.success) {
                setSessions(data.data || []);
            } else {
                setError(data.message || 'Failed to load sessions');
            }
        } catch (err) {
            setError(`Failed to load sessions: ${err.response?.data?.message || err.message}`);
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
        
        // Use local date comparison to avoid timezone issues
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        return sessions.filter(session => {
            const sessionDate = new Date(session.scheduledDate);
            const sessionLocalDate = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
            
            
            return targetDate.getTime() === sessionLocalDate.getTime();
        });
    };

    const getSessionStatus = (session) => {
        // Check if session is completed, cancelled, or rescheduled
        if (session.status === 'completed') return 'completed';
        if (session.status === 'cancelled') return 'cancelled';
        if (session.rescheduled) return 'rescheduled';
        return 'scheduled';
    };

    const isScheduledDate = (date) => {
        if (!date) return false;
        
        // Use local date comparison to avoid timezone issues
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        return sessions.some(session => {
            const sessionDate = new Date(session.scheduledDate);
            const sessionLocalDate = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
            return targetDate.getTime() === sessionLocalDate.getTime();
        });
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const navigateMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
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
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">
                        Calendar
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

                <div className="space-y-4">
                    {/* Calendar Header */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-blue-600 hover:text-blue-800"
                        >
                            ←
                        </button>
                        <h3 className="text-xl font-semibold text-blue-600">
                            {formatMonthYear(currentMonth)}
                        </h3>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-blue-600 hover:text-blue-800"
                        >
                            →
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 bg-gray-50 rounded-lg p-2">
                        {/* Day headers */}
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                                {day}
                            </div>
                        ))}
                        
                        {/* Calendar days */}
                        {getDaysInMonth(currentMonth).map((date, index) => {
                            const hasSessions = isScheduledDate(date);
                            const daySessions = getSessionsForDate(date);
                            const isToday = date && date.toDateString() === new Date().toDateString();
                            
                            // Determine the background color based on session status
                            const getDateBackgroundColor = () => {
                                if (!hasSessions) return '';
                                
                                const hasCompleted = daySessions.some(s => getSessionStatus(s) === 'completed');
                                const hasScheduled = daySessions.some(s => getSessionStatus(s) === 'scheduled');
                                const hasRescheduled = daySessions.some(s => getSessionStatus(s) === 'rescheduled');
                                
                                if (hasCompleted) return 'bg-green-100';
                                if (hasRescheduled) return 'bg-purple-100';
                                if (hasScheduled) return 'bg-orange-100';
                                return 'bg-orange-100';
                            };
                            
                            return (
                                <div
                                    key={index}
                                    className={`min-h-[80px] p-2 border border-gray-200 rounded ${
                                        date ? 'bg-white' : 'bg-gray-100'
                                    } ${isToday ? 'ring-2 ring-blue-500' : ''} ${getDateBackgroundColor()}`}
                                >
                                    {date && (
                                        <>
                                            <div className={`text-sm font-medium mb-1 ${
                                                hasSessions ? 'text-orange-600' : 'text-gray-700'
                                            }`}>
                                                {date.getDate()}
                                            </div>
                                            {hasSessions && (
                                                <div className="space-y-1">
                                                    {daySessions.slice(0, 2).map((session, sessionIndex) => {
                                                        const status = getSessionStatus(session);
                                                        const statusColors = {
                                                            scheduled: 'text-orange-600 bg-orange-100',
                                                            completed: 'text-green-600 bg-green-100',
                                                            rescheduled: 'text-purple-600 bg-purple-100',
                                                            cancelled: 'text-red-600 bg-red-100'
                                                        };
                                                        
                                                        return (
                                                            <div
                                                                key={sessionIndex}
                                                                className={`text-xs p-1 rounded truncate ${statusColors[status] || statusColors.scheduled}`}
                                                                title={`Session ${session.sessionNumber || ''} - ${session.scheduledTime || ''} (${status})`}
                                                            >
                                                                Session {session.sessionNumber || ''}
                                                            </div>
                                                        );
                                                    })}
                                                    {daySessions.length > 2 && (
                                                        <div className="text-xs text-orange-600">
                                                            +{daySessions.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-sm mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-100 rounded"></div>
                            <span className="text-gray-700">Scheduled Sessions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-100 rounded"></div>
                            <span className="text-gray-700">Completed Sessions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-100 rounded"></div>
                            <span className="text-gray-700">Rescheduled Sessions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-gray-700">Today</span>
                        </div>
                    </div>

                    {/* Session Summary */}
                    <div className="mt-6 bg-blue-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Session Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-gray-600">
                                <span className="text-blue-600 font-medium">Total Sessions:</span> {sessions.length}
                            </div>
                            <div className="text-gray-600">
                                <span className="text-blue-600 font-medium">This Month:</span> {
                                    sessions.filter(session => {
                                        const sessionDate = new Date(session.scheduledDate);
                                        return sessionDate.getMonth() === currentMonth.getMonth() && 
                                               sessionDate.getFullYear() === currentMonth.getFullYear();
                                    }).length
                                }
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
}
