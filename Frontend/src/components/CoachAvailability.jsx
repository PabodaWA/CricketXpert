import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CoachAvailability({ coachId, onTimeSlotSelect, selectedDate: initialDate, selectedTime, enrollmentDate, programDuration }) {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (coachId) {
      fetchCoachAvailability();
    }
  }, [coachId]);

  useEffect(() => {
    if (coachId && selectedDate) {
      fetchAvailableSlots();
    }
  }, [coachId, selectedDate]);

  const fetchCoachAvailability = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`http://localhost:5000/api/coaches/${coachId}/availability`);
      
      if (response.data.success) {
        setAvailability(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching coach availability:', err);
      setError('Failed to load coach availability');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        date: selectedDate
      });
      
      if (enrollmentDate && programDuration) {
        params.append('enrollmentDate', enrollmentDate);
        params.append('programDuration', programDuration);
      }
      
      const response = await axios.get(`http://localhost:5000/api/coaches/${coachId}/availability?${params}`);
      
      if (response.data.success) {
        setAvailableSlots(response.data.data.availableSlots || []);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    if (enrollmentDate) {
      const enrollment = new Date(enrollmentDate);
      return enrollment.toISOString().split('T')[0];
    }
    const today = new Date();
    today.setDate(today.getDate() + 1); // Minimum 1 day in advance
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    if (enrollmentDate && programDuration) {
      const enrollment = new Date(enrollmentDate);
      const programEndDate = new Date(enrollment);
      programEndDate.setDate(programEndDate.getDate() + (parseInt(programDuration) * 7));
      return programEndDate.toISOString().split('T')[0];
    }
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // Maximum 30 days in advance
    return maxDate.toISOString().split('T')[0];
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (onTimeSlotSelect) {
      onTimeSlotSelect(null); // Clear selected time when date changes
    }
  };

  const handleTimeSlotSelect = (timeSlot) => {
    if (onTimeSlotSelect) {
      onTimeSlotSelect({
        date: selectedDate,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime
      });
    }
  };

  const formatAvailability = (availability) => {
    if (!availability || availability.length === 0) {
      return 'No availability set';
    }

    const dayNames = {
      'monday': 'Monday',
      'tuesday': 'Tuesday', 
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    };

    return availability.map(slot => 
      `${dayNames[slot.day.toLowerCase()] || slot.day}: ${slot.startTime} - ${slot.endTime}`
    ).join(', ');
  };

  if (loading && !availability) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading coach availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="text-center">
          <div className="text-gray-400 text-2xl mb-2">📅</div>
          <p className="text-gray-600">Coach availability not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Coach Availability
      </h3>
      
      {/* Coach Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Coach:</strong> {availability.coach.name}
        </p>
        <p className="text-sm text-blue-700 mt-1">
          <strong>General Availability:</strong> {formatAvailability(availability.generalAvailability)}
        </p>
      </div>

      {/* Program Duration Info */}
      {enrollmentDate && programDuration && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>📅 Booking Period:</strong> You can book sessions from {new Date(enrollmentDate).toLocaleDateString()} 
            to {new Date(new Date(enrollmentDate).getTime() + (parseInt(programDuration) * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
          </p>
          <p className="text-sm text-green-700 mt-1">
            <strong>Program Duration:</strong> {programDuration} weeks ({parseInt(programDuration) * 7} days)
          </p>
        </div>
      )}

      {/* Date Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date for Session *
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          min={getMinDate()}
          max={getMaxDate()}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Available Time Slots */}
      {selectedDate && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Time Slots
          </label>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading available slots...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSlotSelect(slot)}
                  className={`p-4 text-sm rounded-lg border transition-colors ${
                    selectedTime === slot.startTime
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-base">{slot.startTime} - {slot.endTime}</div>
                  <div className="text-xs opacity-75 mt-1">2 hours</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-yellow-50 rounded-lg">
              <div className="text-yellow-600 text-2xl mb-2">⚠️</div>
              <p className="text-yellow-800 font-medium">No available slots</p>
              <p className="text-yellow-700 text-sm">
                The coach is not available on this date. Please select a different date.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Time Display */}
      {selectedTime && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✅</div>
            <div>
              <p className="text-sm font-medium text-green-800">Selected Time Slot</p>
              <p className="text-sm text-green-700">
                {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start">
          <div className="text-gray-600 mr-2">💡</div>
          <div>
            <p className="text-sm font-medium text-gray-800">Booking Instructions</p>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Select a date when the coach is available</li>
              <li>• Choose from the available 2-hour time slots</li>
              <li>• Only available slots can be booked</li>
              <li>• Sessions must be booked at least 24 hours in advance</li>
              <li>• All sessions are 2 hours long</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
