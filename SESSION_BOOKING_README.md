# Session Booking Feature Implementation

This document describes the implementation of the session booking feature for enrolled programs in the cricket coaching platform.

## Overview

The session booking feature allows customers who are enrolled in coaching programs to:
- Book individual sessions with their coaches
- View available dates, time slots, and ground availability
- Reschedule or cancel their booked sessions
- View their sessions in both calendar and list formats

## Features Implemented

### 1. Session Booking Component (`SessionBooking.jsx`)
- **Location**: `Frontend/src/components/SessionBooking.jsx`
- **Features**:
  - Date selection (minimum 1 day in advance, maximum 30 days)
  - Ground selection with pricing information
  - Time slot selection (8 AM to 8 PM, 1-hour slots)
  - Real-time availability checking
  - Form validation and error handling
  - Success feedback

### 2. Session Manager Component (`SessionManager.jsx`)
- **Location**: `Frontend/src/components/SessionManager.jsx`
- **Features**:
  - Display all booked sessions for a program
  - Session status indicators (scheduled, in-progress, completed, cancelled, rescheduled)
  - Cancel sessions (if more than 2 hours in advance)
  - Reschedule sessions (if more than 24 hours in advance)
  - Integrated reschedule modal

### 3. Session Calendar Component (`SessionCalendar.jsx`)
- **Location**: `Frontend/src/components/SessionCalendar.jsx`
- **Features**:
  - Monthly calendar view with session indicators
  - List view for upcoming sessions
  - Color-coded session status
  - Navigation between months
  - Legend for status colors

### 4. Updated Profile Page
- **Location**: `Frontend/src/pages/Profile.jsx`
- **New Features**:
  - "Book Session" button for active enrollments
  - "My Sessions" button to view session manager
  - "Calendar View" button to view session calendar
  - Modal management for all session-related components

## Backend Implementation

### 1. Ground Model Updates
- **Location**: `models/Ground.js`
- **New Fields**:
  - `name`: Ground name
  - `location`: Ground location
  - `totalSlots`: Number of available slots (default: 12)
  - `facilities`: Array of available facilities
  - `equipment`: Array of available equipment
  - `isActive`: Ground availability status

### 2. Ground API
- **Routes**: `routes/groundRoutes.js`
- **Controller**: `controllers/groundController.js`
- **Endpoints**:
  - `GET /api/grounds` - Get all grounds
  - `GET /api/grounds/:id` - Get specific ground
  - `POST /api/grounds` - Create ground (admin only)
  - `PUT /api/grounds/:id` - Update ground (admin only)
  - `DELETE /api/grounds/:id` - Delete ground (admin only)

### 3. Session API Enhancements
- **Location**: `controllers/sessionController.js`
- **New Endpoint**:
  - `DELETE /api/sessions/:id/participants/:participantId` - Remove participant from session

### 4. Server Configuration
- **Location**: `server.js`
- **Added**: Ground routes registration

## API Endpoints

### Session Booking Flow
1. **Get Available Grounds**: `GET /api/grounds`
2. **Check Ground Availability**: `GET /api/sessions/ground/:groundId/availability?date=YYYY-MM-DD`
3. **Create Session**: `POST /api/sessions`
4. **Add Participant**: `POST /api/sessions/:id/participants`

### Session Management Flow
1. **Get User Sessions**: `GET /api/sessions/program/:programId`
2. **Reschedule Session**: `PUT /api/sessions/:id`
3. **Cancel Session**: `DELETE /api/sessions/:id/participants/:participantId`

## Database Schema

### Session Model
```javascript
{
  program: ObjectId, // Reference to CoachingProgram
  coach: ObjectId,   // Reference to Coach
  participants: [{
    user: ObjectId,        // Reference to User
    enrollment: ObjectId,  // Reference to Enrollment
    attended: Boolean,
    attendanceMarkedAt: Date,
    performance: {
      rating: Number,
      notes: String
    }
  }],
  title: String,
  description: String,
  sessionNumber: Number,
  week: Number,
  scheduledDate: Date,
  startTime: String,    // Format: "HH:MM"
  endTime: String,      // Format: "HH:MM"
  duration: Number,     // in minutes
  ground: ObjectId,     // Reference to Ground
  groundSlot: Number,   // 1-12
  status: String,       // scheduled, in-progress, completed, cancelled, rescheduled
  maxParticipants: Number,
  bookingDeadline: Date
}
```

### Ground Model
```javascript
{
  name: String,
  location: String,
  pricePerSlot: Number,
  description: String,
  totalSlots: Number,    // 1-12, default: 12
  facilities: [String],  // e.g., ['parking', 'changing_room']
  equipment: [String],   // e.g., ['nets', 'balls', 'bats']
  isActive: Boolean
}
```

## Usage Instructions

### For Customers
1. **Navigate to Profile**: Go to your profile page
2. **Find Active Enrollment**: Look for programs with "active" status
3. **Book Session**: Click "📅 Book Session" button
4. **Select Details**: Choose date, ground, slot, and time
5. **Confirm Booking**: Review and confirm your session
6. **Manage Sessions**: Use "📋 My Sessions" to view, reschedule, or cancel
7. **Calendar View**: Use "📊 Calendar View" for visual session overview

### For Administrators
1. **Add Grounds**: Use the ground API to add new grounds
2. **Manage Grounds**: Update ground information, pricing, and availability
3. **Monitor Sessions**: View all sessions and participant management

## Sample Data

### Ground Seeding
Run the `seedGrounds.js` script to populate sample ground data:

```bash
node seedGrounds.js
```

This will create 4 sample grounds with different pricing and facilities.

## Error Handling

### Frontend
- Form validation for required fields
- Date validation (minimum 1 day advance booking)
- Time slot validation (end time must be after start time)
- API error handling with user-friendly messages
- Loading states for all async operations

### Backend
- Ground slot availability checking
- Session conflict detection
- Participant limit validation
- Booking deadline enforcement
- Comprehensive error responses

## Security Considerations

- Authentication required for all session operations
- User can only book sessions for their own enrollments
- Ground slot conflict prevention
- Booking deadline enforcement (2 hours before session)
- Cancellation deadline enforcement (2 hours before session)
- Rescheduling deadline enforcement (24 hours before session)

## Future Enhancements

1. **Recurring Sessions**: Support for weekly/bi-weekly recurring sessions
2. **Waitlist**: Allow users to join waitlist for full sessions
3. **Notifications**: Email/SMS notifications for session reminders
4. **Payment Integration**: Session-specific payment processing
5. **Coach Availability**: Integration with coach availability calendar
6. **Weather Integration**: Automatic rescheduling for weather conditions
7. **Mobile App**: Native mobile app support
8. **Analytics**: Session booking and attendance analytics

## Testing

### Manual Testing Checklist
- [ ] Book a new session with valid data
- [ ] Try to book with invalid data (should show errors)
- [ ] Check ground availability for different dates
- [ ] Reschedule an existing session
- [ ] Cancel a session
- [ ] View sessions in calendar format
- [ ] View sessions in list format
- [ ] Test with different enrollment statuses

### API Testing
Use tools like Postman or curl to test the API endpoints:

```bash
# Get all grounds
curl -X GET http://localhost:5000/api/grounds

# Check ground availability
curl -X GET "http://localhost:5000/api/sessions/ground/GROUND_ID/availability?date=2024-01-15"

# Create a session (requires authentication)
curl -X POST http://localhost:5000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "program": "PROGRAM_ID",
    "coach": "COACH_ID",
    "title": "Test Session",
    "scheduledDate": "2024-01-15",
    "startTime": "10:00",
    "endTime": "11:00",
    "ground": "GROUND_ID",
    "groundSlot": 1
  }'
```

## Troubleshooting

### Common Issues
1. **No grounds available**: Run the ground seeding script
2. **Session booking fails**: Check if user is enrolled in the program
3. **Time slots not showing**: Verify ground availability API is working
4. **Modal not closing**: Check for JavaScript errors in browser console
5. **API errors**: Verify authentication token is valid

### Debug Mode
Enable debug logging by adding console.log statements in the components or checking browser developer tools for network requests and responses.

## Conclusion

The session booking feature provides a comprehensive solution for managing coaching sessions with proper validation, error handling, and user experience considerations. The implementation follows best practices for both frontend and backend development, ensuring scalability and maintainability.

