import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function WeeklySessionBooking({ coachId, onSessionSelect, enrollmentDate, programDuration, existingSessions = [] }) {
  const [weeklyStructure, setWeeklyStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableGrounds, setAvailableGrounds] = useState([]);
  const [selectedGround, setSelectedGround] = useState(null);
  const [selectedGroundSlot, setSelectedGroundSlot] = useState(null);

  useEffect(() => {
    if (coachId && enrollmentDate && programDuration) {
      fetchWeeklyStructure();
    }
  }, [coachId, enrollmentDate, programDuration]);

  useEffect(() => {
    if (coachId && selectedWeek) {
      fetchWeekAvailability();
    }
  }, [coachId, selectedWeek]);

  const fetchWeeklyStructure = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`http://localhost:5000/api/coaches/${coachId}/weekly-sessions?enrollmentDate=${enrollmentDate}&programDuration=${programDuration}`);
      
      if (response.data.success) {
        setWeeklyStructure(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching weekly structure:', err);
      setError('Failed to load weekly session structure');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekAvailability = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching availability for week:', selectedWeek);
      
      // First, get coach's general availability to know which days they're available
      const coachResponse = await axios.get(`http://localhost:5000/api/coaches/${coachId}/availability`);
      
      if (!coachResponse.data.success) {
        throw new Error('Failed to get coach availability');
      }
      
      const coachAvailability = coachResponse.data.data.generalAvailability || [];
      const availableDays = coachAvailability.map(avail => avail.day.toLowerCase());
      
      console.log('Coach available days:', availableDays);
      
      // Generate dates in the selected week, but only for coach's available days
      const weekDates = [];
      const startDate = new Date(selectedWeek.weekStartDate);
      const endDate = new Date(selectedWeek.weekEndDate);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = dayNames[dayOfWeek].toLowerCase();
        
        // Only include dates where the coach is available
        if (availableDays.includes(currentDayName)) {
          weekDates.push(new Date(date).toISOString().split('T')[0]);
        }
      }
      
      console.log('Available week dates (coach available days only):', weekDates);
      
      // Fetch availability for each available date
      const allSlots = [];
      for (const date of weekDates) {
        try {
          const params = new URLSearchParams({
            date: date,
            enrollmentDate: enrollmentDate,
            programDuration: programDuration,
            sessionNumber: selectedWeek.sessionNumber
          });
          
          console.log(`Fetching availability for ${date} with params:`, params.toString());
          
          const response = await axios.get(`http://localhost:5000/api/coaches/${coachId}/availability?${params}`);
          
          console.log(`Response for ${date}:`, response.data);
          
          if (response.data.success && response.data.data.availableSlots) {
            // Add date information to each slot
            const slotsWithDate = response.data.data.availableSlots.map(slot => ({
              ...slot,
              date: date,
              dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
            }));
            allSlots.push(...slotsWithDate);
            console.log(`Found ${slotsWithDate.length} slots for ${date}`);
          } else {
            console.log(`No slots found for ${date}`);
          }
        } catch (dateError) {
          console.warn(`Error fetching availability for ${date}:`, dateError.message);
        }
      }
      
      console.log('Total slots found:', allSlots.length);
      setAvailableSlots(allSlots);
    } catch (err) {
      console.error('Error fetching week availability:', err);
      setError('Failed to load available time slots for this week');
    } finally {
      setLoading(false);
    }
  };

  const handleWeekSelect = (week) => {
    setSelectedWeek(week);
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const fetchAvailableGrounds = async (date, startTime, endTime) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        date: date,
        duration: 120,
        startTime: startTime,
        endTime: endTime
      });
      
      const response = await axios.get(`http://localhost:5000/api/grounds/availability?${params}`);
      
      if (response.data.success) {
        // Filter to show only Practice Ground A
        const filteredGrounds = response.data.data.availableGrounds.filter(ground => 
          ground.name === 'Practice Ground A'
        );
        
        // Transform the ground slots to show generic slot numbers for the selected time
        const transformedGrounds = filteredGrounds.map(ground => ({
          ...ground,
          availableSlots: ground.availableSlots.map((slot, index) => ({
            slotNumber: index + 1,
            startTime: startTime,
            endTime: endTime,
            duration: 120,
            available: true,
            timeSlot: `${startTime} - ${endTime}` // Show the customer's selected time
          }))
        }));
        
        setAvailableGrounds(transformedGrounds);
      }
    } catch (err) {
      console.error('Error fetching available grounds:', err);
      setError('Failed to load available grounds');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setSelectedGround(null);
    setSelectedGroundSlot(null);
    setAvailableGrounds([]);
    
    // Fetch available grounds for this date and time
    fetchAvailableGrounds(slot.date, slot.startTime, slot.endTime);
  };

  const handleGroundSelect = (ground) => {
    setSelectedGround(ground);
    setSelectedGroundSlot(null);
  };

  const handleGroundSlotSelect = (groundSlot) => {
    setSelectedGroundSlot(groundSlot);
    
    if (onSessionSelect) {
      onSessionSelect({
        week: selectedWeek.week,
        sessionNumber: selectedWeek.sessionNumber,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        duration: selectedSlot.duration,
        dayName: selectedSlot.dayName,
        ground: selectedGround,
        groundSlot: groundSlot
      });
    }
  };

  const isWeekBooked = (week) => {
    return existingSessions.some(session => session.sessionNumber === week.sessionNumber);
  };

  const getWeekStatus = (week) => {
    if (isWeekBooked(week)) {
      return 'booked';
    }
    const today = new Date();
    const weekStart = new Date(week.weekStartDate);
    const weekEnd = new Date(week.weekEndDate);
    
    if (today < weekStart) {
      return 'upcoming';
    } else if (today >= weekStart && today <= weekEnd) {
      return 'current';
    } else {
      return 'past';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return 'bg-green-100 text-green-800 border-green-200';
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'past': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'booked': return '✓ Booked';
      case 'current': return '📅 Current Week';
      case 'upcoming': return '⏳ Upcoming';
      case 'past': return '❌ Past Week';
      default: return 'Unknown';
    }
  };

  if (loading && !weeklyStructure) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weekly session structure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!weeklyStructure) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="text-center">
          <div className="text-gray-400 text-2xl mb-2">📅</div>
          <p className="text-gray-600">Weekly session structure not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Weekly Session Booking
      </h3>
      
      {/* Program Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Program Duration:</strong> {weeklyStructure.programDuration} weeks
        </p>
        <p className="text-sm text-blue-700 mt-1">
          <strong>Total Sessions:</strong> {weeklyStructure.totalSessions}
        </p>
        <p className="text-sm text-blue-700 mt-1">
          <strong>Enrollment Date:</strong> {new Date(weeklyStructure.enrollmentDate).toLocaleDateString()}
        </p>
      </div>

      {/* Weekly Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {weeklyStructure.weeklySessions.map((week) => {
          const status = getWeekStatus(week);
          const isBooked = isWeekBooked(week);
          
          return (
            <div
              key={week.week}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedWeek?.week === week.week
                  ? 'border-blue-500 bg-blue-50'
                  : getStatusColor(status)
              } ${isBooked ? 'cursor-not-allowed opacity-75' : 'hover:shadow-md'}`}
              onClick={() => !isBooked && handleWeekSelect(week)}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{week.sessionLabel}</h4>
                <span className="text-xs px-2 py-1 rounded-full bg-white">
                  {getStatusText(status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{week.weekLabel}</p>
              <p className="text-xs text-gray-500">
                {new Date(week.weekStartDate).toLocaleDateString()} - {new Date(week.weekEndDate).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Week Details */}
      {selectedWeek && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedWeek.sessionLabel} - {selectedWeek.weekLabel}
          </h4>
          
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>📅 Week Period:</strong> {new Date(selectedWeek.weekStartDate).toLocaleDateString()} to {new Date(selectedWeek.weekEndDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              <strong>⏰ Session Duration:</strong> 2 hours
            </p>
          </div>

          {/* Coach Available Days Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📅 Coach Available Days:</strong> The coach is available on specific days of the week. Only those days will show available time slots.
            </p>
          </div>

          {/* Available Time Slots */}
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading available time slots...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time Slots for {selectedWeek.weekLabel}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlotSelect(slot)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedSlot === slot
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="font-medium text-lg">{slot.startTime} - {slot.endTime}</div>
                    <div className="text-sm text-gray-600 mb-1">{slot.dayName}</div>
                    <div className="text-xs text-gray-500">{new Date(slot.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500 mt-1">2 hours</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">No available time slots for this week</p>
              <p className="text-sm text-gray-500 mt-2">
                The coach may not have availability set for this week, or all slots may be booked.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ground Selection */}
      {selectedSlot && availableGrounds.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Select Ground and Slot
          </h4>
          
          <div className="space-y-4">
            {/* Ground Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Grounds
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableGrounds.map((ground) => (
                  <button
                    key={ground._id}
                    onClick={() => handleGroundSelect(ground)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedGround?._id === ground._id
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="font-medium text-lg">{ground.name}</div>
                    <div className="text-sm text-gray-600 mb-1">{ground.location}</div>
                    <div className="text-xs text-gray-500">
                      {ground.availableSlots.length} slots available
                    </div>
                    {ground.facilities && ground.facilities.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Facilities: {ground.facilities.join(', ')}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Ground Slot Selection */}
            {selectedGround && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Slots for {selectedGround.name} - {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : ''}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedGround.availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleGroundSlotSelect(slot)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedGroundSlot === slot
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <div className="font-bold text-lg">Slot {slot.slotNumber}</div>
                      <div className="text-sm text-gray-600 mt-1">Available</div>
                      <div className="text-xs text-gray-500 mt-1">{slot.timeSlot}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Time:</strong> {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : ''} 
                    <br />
                    <strong>Duration:</strong> 2 hours
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Slot Summary */}
      {selectedSlot && selectedGround && selectedGroundSlot && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="font-medium text-green-900 mb-2">✅ Selected Session:</h5>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>Session:</strong> {selectedWeek.sessionLabel} - {selectedWeek.weekLabel}</p>
            <p><strong>Date:</strong> {selectedSlot.dayName}, {new Date(selectedSlot.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
            <p><strong>Duration:</strong> 2 hours</p>
            <p><strong>Ground:</strong> {selectedGround.name} - {selectedGround.location}</p>
            <p><strong>Ground Slot:</strong> Slot {selectedGroundSlot.slotNumber} ({selectedGroundSlot.startTime} - {selectedGroundSlot.endTime})</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">📋 Booking Instructions:</h5>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Each session must be booked in its corresponding week</li>
          <li>• Session 1 must be booked in Week 1, Session 2 in Week 2, etc.</li>
          <li>• All sessions are 2 hours long</li>
          <li>• You can only book one session per week</li>
        </ul>
      </div>
    </div>
  );
}
