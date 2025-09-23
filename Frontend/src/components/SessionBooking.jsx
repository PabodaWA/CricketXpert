import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SessionBooking({ enrollment, onClose, onBookingSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form data
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedGround, setSelectedGround] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    
    // Available options
    const [grounds, setGrounds] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    
    // Loading states
    const [loadingGrounds, setLoadingGrounds] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        fetchGrounds();
    }, []);

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
            setLoadingGrounds(true);
            const { data } = await axios.get('http://localhost:5000/api/grounds');
            if (data.success) {
                setGrounds(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching grounds:', err);
            setError('Failed to load grounds');
        } finally {
            setLoadingGrounds(false);
        }
    };

    const fetchAvailableSlots = async () => {
        try {
            setLoadingSlots(true);
            const { data } = await axios.get(
                `http://localhost:5000/api/session-grounds/ground/${selectedGround}/availability?date=${selectedDate}`
            );
            if (data.success) {
                setAvailableSlots(data.data.availability || []);
            }
        } catch (err) {
            console.error('Error fetching available slots:', err);
            setError('Failed to load available slots');
        } finally {
            setLoadingSlots(false);
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
        
        if (!selectedDate || !selectedGround || !selectedSlot || !selectedStartTime || !selectedEndTime) {
            setError('Please fill in all fields');
            return;
        }

        // Validate date is not in the past
        const selectedDateTime = new Date(selectedDate);
        const now = new Date();
        if (selectedDateTime <= now) {
            setError('Please select a future date');
            return;
        }

        // Validate time range
        if (selectedStartTime >= selectedEndTime) {
            setError('End time must be after start time');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // Calculate duration in minutes
            const startTime = new Date(`2000-01-01T${selectedStartTime}:00`);
            const endTime = new Date(`2000-01-01T${selectedEndTime}:00`);
            const duration = Math.round((endTime - startTime) / (1000 * 60));

            // First, create a session
            const sessionData = {
                program: enrollment.program._id,
                coach: enrollment.program.coach._id,
                title: `${enrollment.program.title} - Session`,
                description: `Session for ${enrollment.program.title}`,
                sessionNumber: 1, // This should be calculated based on existing sessions
                week: 1, // This should be calculated
                scheduledDate: selectedDate,
                startTime: selectedStartTime,
                endTime: selectedEndTime,
                duration: duration,
                ground: selectedGround,
                groundSlot: parseInt(selectedSlot),
                maxParticipants: 10,
                objectives: ['Skill development', 'Practice'],
                materials: []
                // Note: bookingDeadline will be set automatically by the model's pre-save middleware
            };

            console.log('Creating session with data:', sessionData);

            const sessionResponse = await axios.post(
                'http://localhost:5000/api/sessions',
                sessionData,
                config
            );

            if (sessionResponse.data.success) {
                // Now create the SessionGround booking
                const bookingData = {
                    sessionId: sessionResponse.data.data._id,
                    groundId: selectedGround,
                    groundSlot: parseInt(selectedSlot),
                    bookingDate: selectedDate,
                    startTime: selectedStartTime,
                    endTime: selectedEndTime,
                    duration: duration,
                    bookingType: 'session',
                    specialRequirements: [],
                    notes: `Session booking for ${enrollment.program.title}`
                };

                console.log('Creating session ground booking with data:', bookingData);

                const bookingResponse = await axios.post(
                    'http://localhost:5000/api/session-grounds',
                    bookingData,
                    config
                );

                if (bookingResponse.data.success) {
                    // Now add the user as a participant
                    const participantData = {
                        userId: userInfo._id,
                        enrollmentId: enrollment._id
                    };

                    await axios.post(
                        `http://localhost:5000/api/sessions/${sessionResponse.data.data._id}/participants`,
                        participantData,
                        config
                    );

                    setSuccess('Session booked successfully!');
                    setTimeout(() => {
                        onBookingSuccess();
                        onClose();
                    }, 1500);
                } else {
                    setError('Failed to create ground booking');
                }
            }
        } catch (err) {
            console.error('Booking error:', err);
            console.error('Error response:', err.response?.data);
            
            let errorMessage = 'Failed to book session';
            
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.errors) {
                if (Array.isArray(err.response.data.errors)) {
                    errorMessage = err.response.data.errors.join(', ');
                } else {
                    errorMessage = err.response.data.errors;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            // Show more specific error messages
            if (errorMessage.includes('Validation error')) {
                errorMessage = 'Please check all fields and try again. Make sure all required information is provided.';
            } else if (errorMessage.includes('Ground slot is not available')) {
                errorMessage = 'This time slot is already booked. Please choose a different time.';
            } else if (errorMessage.includes('Not authorized')) {
                errorMessage = 'You are not authorized to create this session.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getMinDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 1); // Minimum 1 day in advance
        return today.toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30); // Maximum 30 days in advance
        return maxDate.toISOString().split('T')[0];
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">
                        Book Session - {enrollment.program.title}
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
                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Date *
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={getMinDate()}
                            max={getMaxDate()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Ground Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Ground *
                        </label>
                        {loadingGrounds ? (
                            <div className="text-center py-2">Loading grounds...</div>
                        ) : (
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
                        )}
                    </div>

                    {/* Slot Selection */}
                    {selectedDate && selectedGround && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Slot *
                            </label>
                            {loadingSlots ? (
                                <div className="text-center py-2">Loading available slots...</div>
                            ) : (
                                <select
                                    value={selectedSlot}
                                    onChange={(e) => setSelectedSlot(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select a slot</option>
                                    {availableSlots.map((slot) => (
                                        <option key={slot.slot} value={slot.slot}>
                                            Slot {slot.slot}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Time Selection */}
                    {selectedSlot && (
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
                    )}

                    {/* Session Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-2">Session Details</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Program:</strong> {enrollment.program.title}</p>
                            <p><strong>Coach:</strong> {enrollment.program.coach?.userId?.firstName} {enrollment.program.coach?.userId?.lastName}</p>
                            {selectedDate && <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>}
                            {selectedStartTime && selectedEndTime && (
                                <p><strong>Time:</strong> {selectedStartTime} - {selectedEndTime}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
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
                            {loading ? 'Booking...' : 'Book Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

