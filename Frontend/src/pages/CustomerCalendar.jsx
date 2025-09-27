import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomerCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Get days in month
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

    // Navigate months
    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    // Format month and year
    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Check if date has events
    const hasEvents = (date) => {
        if (!date) return false;
        const dateStr = date.toISOString().split('T')[0];
        return events.some(event => {
            const eventDate = new Date(event.date).toISOString().split('T')[0];
            return eventDate === dateStr;
        });
    };

    // Get events for selected date
    const getEventsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(event => {
            const eventDate = new Date(event.date).toISOString().split('T')[0];
            return eventDate === dateStr;
        });
    };

    // Check if date is today
    const isToday = (date) => {
        if (!date) return false;
        return date.toDateString() === new Date().toDateString();
    };

    // Check if date is selected
    const isSelected = (date) => {
        if (!date || !selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    // Handle date selection
    const handleDateClick = (date) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    // Load events (placeholder for now)
    useEffect(() => {
        // TODO: Load actual events from API
        setEvents([
            {
                id: 1,
                title: 'Cricket Session',
                date: new Date(),
                type: 'session',
                time: '10:00 AM'
            },
            {
                id: 2,
                title: 'Ground Booking',
                date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                type: 'booking',
                time: '2:00 PM'
            }
        ]);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Calendar</h1>
                    <p className="text-gray-600">View your sessions, bookings, and events</p>
                </div>

                {/* Calendar Container */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Calendar Header */}
                    <div className="bg-blue-600 text-white p-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">
                                {formatMonthYear(currentDate)}
                            </h2>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => navigateMonth(-1)}
                                    className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setCurrentDate(new Date())}
                                    className="px-4 py-2 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => navigateMonth(1)}
                                    className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-6">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-100 rounded-lg">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {getDaysInMonth(currentDate).map((date, index) => {
                                const dayEvents = getEventsForDate(date);
                                const hasEvent = hasEvents(date);
                                const isCurrentDay = isToday(date);
                                const isSelectedDay = isSelected(date);

                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleDateClick(date)}
                                        className={`
                                            min-h-[100px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-all
                                            ${date ? 'hover:bg-gray-50' : 'bg-gray-50'}
                                            ${isCurrentDay ? 'bg-blue-100 border-blue-300' : ''}
                                            ${isSelectedDay ? 'bg-blue-200 border-blue-400 ring-2 ring-blue-300' : ''}
                                            ${hasEvent ? 'bg-green-50 border-green-200' : ''}
                                        `}
                                    >
                                        {date && (
                                            <>
                                                <div className={`
                                                    text-sm font-medium mb-1
                                                    ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}
                                                    ${isSelectedDay ? 'text-blue-800' : ''}
                                                `}>
                                                    {date.getDate()}
                                                </div>
                                                {dayEvents.length > 0 && (
                                                    <div className="space-y-1">
                                                        {dayEvents.slice(0, 2).map(event => (
                                                            <div
                                                                key={event.id}
                                                                className={`
                                                                    text-xs p-1 rounded truncate
                                                                    ${event.type === 'session' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                                                                `}
                                                            >
                                                                {event.title}
                                                            </div>
                                                        ))}
                                                        {dayEvents.length > 2 && (
                                                            <div className="text-xs text-gray-500">
                                                                +{dayEvents.length - 2} more
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
                    </div>
                </div>

                {/* Selected Date Events */}
                {selectedDate && (
                    <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Events for {selectedDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </h3>
                        {getEventsForDate(selectedDate).length > 0 ? (
                            <div className="space-y-3">
                                {getEventsForDate(selectedDate).map(event => (
                                    <div key={event.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <div className={`
                                            w-3 h-3 rounded-full mr-3
                                            ${event.type === 'session' ? 'bg-blue-500' : 'bg-green-500'}
                                        `}></div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                                            <p className="text-sm text-gray-600">{event.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No events scheduled for this date.</p>
                        )}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                            <div className="text-blue-600 font-medium">Book Session</div>
                            <div className="text-sm text-gray-600">Schedule a new coaching session</div>
                        </button>
                        <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                            <div className="text-green-600 font-medium">Book Ground</div>
                            <div className="text-sm text-gray-600">Reserve a ground for practice</div>
                        </button>
                        <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                            <div className="text-purple-600 font-medium">View Programs</div>
                            <div className="text-sm text-gray-600">Browse available programs</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
