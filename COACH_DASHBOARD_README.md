# Coach Dashboard

A comprehensive dashboard for cricket coaches to manage their assigned programs, view upcoming sessions, and provide feedback to enrolled players.

## Features

### 🏏 Coach Dashboard (`/coach-dashboard`)
- **Route**: `/coach-dashboard`
- **Access**: Authenticated coaches only
- **Features**:
  - View assigned coaching programs
  - Display upcoming sessions for each program
  - Submit feedback/reviews for enrolled players
  - Clean, responsive UI with Tailwind CSS

### 📊 Dashboard Components

#### 1. Header Section
- Welcome message with coach's name
- Display coach specializations as tags
- Statistics cards showing total programs and upcoming sessions
- Beautiful gradient background

#### 2. Assigned Programs Section
- List of all programs assigned to the coach
- Program details including:
  - Title and description
  - Current enrollments vs max participants
  - Duration and difficulty level
  - Category tags
- "View Sessions" button to see all sessions for a program

#### 3. Upcoming Sessions Section
- List of upcoming sessions across all programs
- Session details including:
  - Session title and program name
  - Date and time
  - Ground location
  - Participant count
  - Session status (scheduled, in-progress, completed, cancelled)
- Quick feedback buttons for each participant

#### 4. Program Sessions Modal
- Detailed view of all sessions for a selected program
- Same session information as the sidebar
- Ability to give feedback to participants

#### 5. Feedback Modal
- Star rating system (1-5 stars)
- Text comment field
- Submit feedback for specific players
- Form validation and error handling

## API Endpoints

### Coach Management
- `GET /api/coaches/user/:userId` - Get coach by user ID
- `GET /api/coaches/:id` - Get coach by ID

### Programs
- `GET /api/programs/coach/:coachId` - Get programs assigned to a coach

### Sessions
- `GET /api/sessions/program/:programId` - Get sessions for a program
- `GET /api/sessions/coach/:coachId` - Get sessions for a coach

### Player Feedback
- `POST /api/player-feedback` - Submit feedback for a player
- `GET /api/player-feedback/coach/:coachId` - Get feedbacks submitted by coach
- `GET /api/player-feedback/player/:playerId` - Get feedbacks for a player
- `PUT /api/player-feedback/:id/visibility` - Update feedback visibility
- `GET /api/player-feedback/coach/:coachId/stats` - Get coach feedback statistics

## Database Models

### PlayerFeedback Model
```javascript
{
  coach: ObjectId (ref: Coach),
  player: ObjectId (ref: User),
  session: ObjectId (ref: Session),
  program: ObjectId (ref: CoachingProgram),
  rating: Number (1-5),
  comment: String,
  categories: [String],
  isVisibleToPlayer: Boolean,
  status: String (draft/submitted/archived)
}
```

## Authentication & Authorization

- Route is protected using `ProtectedRoute` component
- Only users with `role: 'coach'` can access the dashboard
- Automatic redirect to login if not authenticated
- Redirect to profile if user doesn't have coach role

## Styling

- Built with **Tailwind CSS** for responsive design
- Clean card-based layout
- Hover effects and smooth transitions
- Color-coded status indicators
- Mobile-responsive design
- Beautiful gradient header
- Consistent spacing and typography

## Usage

1. **Login as a Coach**: Ensure you're logged in with a user account that has `role: 'coach'`
2. **Navigate to Dashboard**: Go to `/coach-dashboard`
3. **View Programs**: See all your assigned coaching programs
4. **Check Sessions**: View upcoming sessions in the right sidebar
5. **Give Feedback**: Click on participant names to open the feedback modal
6. **Rate Players**: Use the star rating system and add comments
7. **Submit Feedback**: Click "Submit Feedback" to save your review

## Error Handling

- Loading states with spinners
- Error messages for failed API calls
- Form validation for feedback submission
- Graceful handling of empty states
- Network error recovery

## Future Enhancements

- Real-time notifications for new sessions
- Calendar view for sessions
- Bulk feedback submission
- Feedback templates
- Performance analytics
- Session attendance tracking
- Player progress reports

## Dependencies

### Frontend
- React 19.1.1
- React Router DOM 7.8.2
- Axios 1.11.0
- Lucide React (icons)
- Tailwind CSS 3.3.2

### Backend
- Express.js
- MongoDB with Mongoose
- Custom middleware for authentication

## File Structure

```
Frontend/src/pages/CoachDashboard.jsx    # Main dashboard component
models/PlayerFeedback.js                 # Player feedback model
controllers/playerFeedbackController.js  # Feedback API controller
routes/playerFeedbackRoutes.js          # Feedback API routes
controllers/coachController.js          # Coach API controller (updated)
routes/coaches.js                       # Coach API routes (updated)
```

## Setup Instructions

1. Ensure all dependencies are installed
2. Make sure the backend server is running
3. Ensure MongoDB is connected
4. Create coach user accounts with proper role
5. Assign programs to coaches
6. Create sessions for programs
7. Access the dashboard at `/coach-dashboard`

The Coach Dashboard provides a comprehensive interface for coaches to manage their programs and provide valuable feedback to their players, enhancing the overall coaching experience.
