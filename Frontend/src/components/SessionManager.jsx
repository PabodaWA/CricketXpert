import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SessionManager({ enrollment, onClose }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    useEffect(() => {
        fetchSessions();
    }, [enrollment]);

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

    const handleCancelSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to cancel this session?')) {
            return;
        }

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // Remove user from session participants
            const session = sessions.find(s => s._id === sessionId);
            const participant = session.participants.find(p => p.user._id === userInfo._id);
            
            if (participant) {
                await axios.delete(
                    `http://localhost:5000/api/sessions/${sessionId}/participants/${participant._id}`,
                    config
                );
                
                // Refresh sessions
                fetchSessions();
            }
        } catch (err) {
            console.error('Error cancelling session:', err);
            setError('Failed to cancel session');
        }
    };

    const handleRescheduleSession = (session) => {
        setSelectedSession(session);
        setShowRescheduleModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'in-progress':
                return 'bg-yellow-100 text-yellow-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'rescheduled':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const canCancel = (session) => {
        const sessionDate = new Date(session.scheduledDate);
        const now = new Date();
        const hoursUntilSession = (sessionDate - now) / (1000 * 60 * 60);
        return hoursUntilSession > 2 && session.status === 'scheduled';
    };

    const canReschedule = (session) => {
        const sessionDate = new Date(session.scheduledDate);
        const now = new Date();
        const hoursUntilSession = (sessionDate - now) / (1000 * 60 * 60);
        return hoursUntilSession > 24 && session.status === 'scheduled';
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">
                        My Sessions - {enrollment.program.title}
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

                {sessions.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-4">📅</div>
                        <p className="text-gray-600">No sessions booked yet.</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Book your first session to get started!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <div key={session._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-gray-800">
                                            {session.title}
                                        </h3>
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
                                        {session.description && (
                                            <p className="mt-2 text-sm text-gray-600">
                                                {session.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                                            {session.status}
                                        </span>
                                        <div className="mt-3 space-x-2">
                                            {canReschedule(session) && (
                                                <button
                                                    onClick={() => handleRescheduleSession(session)}
                                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                >
                                                    Reschedule
                                                </button>
                                            )}
                                            {canCancel(session) && (
                                                <button
                                                    onClick={() => handleCancelSession(session._id)}
                                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reschedule Modal */}
                {showRescheduleModal && selectedSession && (
                    <RescheduleModal
                        session={selectedSession}
                        enrollment={enrollment}
                        onClose={() => {
                            setShowRescheduleModal(false);
                            setSelectedSession(null);
                        }}
                        onSuccess={() => {
                            fetchSessions();
                            setShowRescheduleModal(false);
                            setSelectedSession(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// Reschedule Modal Component
function RescheduleModal({ session, enrollment, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedGround, setSelectedGround] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    
    const [grounds, setGrounds] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);

    useEffect(() => {
        fetchGrounds();
        // Pre-fill with current session data
        setSelectedDate(session.scheduledDate.split('T')[0]);
        setSelectedGround(session.ground._id);
        setSelectedSlot(session.groundSlot.toString());
        setSelectedStartTime(session.startTime);
        setSelectedEndTime(session.endTime);
    }, [session]);

    useEffect(() => {
        if (selectedDate && selectedGround) {
            fetchAvailableSlots();
        }
    }, [selectedDate, selectedGround]);

    useEffect(() => {
        if (selectedSlot) {
            generateTimeSlots();
        }
    }, [selectedSlot]);

    const fetchGrounds = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/grounds');
            if (data.success) {
                setGrounds(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching grounds:', err);
        }
    };

    const fetchAvailableSlots = async () => {
        try {
            const { data } = await axios.get(
                `http://localhost:5000/api/sessions/ground/${selectedGround}/availability?date=${selectedDate}`
            );
            if (data.success) {
                setAvailableSlots(data.data.availability || []);
            }
        } catch (err) {
            console.error('Error fetching available slots:', err);
        }
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour < 20; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
            slots.push({ startTime, endTime });
        }
        setTimeSlots(slots);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            setError('');
            
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const updateData = {
                scheduledDate: selectedDate,
                startTime: selectedStartTime,
                endTime: selectedEndTime,
                ground: selectedGround,
                groundSlot: parseInt(selectedSlot),
                status: 'rescheduled'
            };

            await axios.put(
                `http://localhost:5000/api/sessions/${session._id}`,
                updateData,
                config
            );

            setSuccess('Session rescheduled successfully!');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err) {
            console.error('Error rescheduling session:', err);
            setError(err.response?.data?.message || 'Failed to reschedule session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">
                        Reschedule Session
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

                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Similar form fields as SessionBooking component */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Date *
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Ground *
                        </label>
                        <select
                            value={selectedGround}
                            onChange={(e) => setSelectedGround(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select a ground</option>
                            {grounds.map((ground) => (
                                <option key={ground._id} value={ground._id}>
                                    {ground.name || `Ground ${ground._id}`} - ${ground.pricePerSlot}/slot
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Time *
                            </label>
                            <select
                                value={selectedStartTime}
                                onChange={(e) => setSelectedStartTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select start time</option>
                                {timeSlots.map((slot) => (
                                    <option key={slot.startTime} value={slot.startTime}>
                                        {slot.startTime}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Time *
                            </label>
                            <select
                                value={selectedEndTime}
                                onChange={(e) => setSelectedEndTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select end time</option>
                                {timeSlots
                                    .filter(slot => slot.startTime > selectedStartTime)
                                    .map((slot) => (
                                        <option key={slot.endTime} value={slot.endTime}>
                                            {slot.endTime}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Rescheduling...' : 'Reschedule Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
