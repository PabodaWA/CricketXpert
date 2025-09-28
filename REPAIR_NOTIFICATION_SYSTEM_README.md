# Repair Notification System

## Overview
The Repair Notification System has been successfully implemented to provide real-time notifications for repair request submissions and status updates. This system is completely separate from the existing order/enrollment notification system and maintains full isolation to prevent any conflicts.

## Features

### 🔔 Notification Types
- **Repair Submitted**: When a customer submits a new repair request
- **Repair Approved**: When service manager approves a repair request
- **Repair Rejected**: When service manager rejects a repair request
- **Repair In Progress**: When repair status changes to in-progress
- **Repair Completed**: When repair is completed and ready for pickup

### 📍 Display Locations
1. **Header Bell Icon**: Shows repair notifications in a dedicated dropdown
2. **Customer Sidebar**: Dedicated "Repair Notifications" section
3. **Customer Notifications Page**: Tabbed interface showing all notification types

### 🎯 Key Features
- **Real-time Updates**: Notifications are created automatically when repair requests are submitted or status changes
- **Unread Indicators**: Red badges show unread notification counts
- **Persistent Storage**: Notifications are saved in the database and persist across sessions
- **Mark as Read**: Users can mark individual notifications as read
- **Clear All**: Users can clear all repair notifications
- **Responsive Design**: Works on both desktop and mobile devices

## Implementation Details

### Backend Components

#### 1. Database Model (`models/RepairNotification.js`)
```javascript
{
  customerId: ObjectId,           // Reference to User
  repairRequestId: ObjectId,      // Reference to RepairRequest
  type: String,                   // Notification type
  title: String,                  // Notification title
  message: String,                // Notification message
  isRead: Boolean,                // Read status
  metadata: Object,               // Additional data
  createdAt: Date,                // Creation timestamp
  updatedAt: Date                 // Last update timestamp
}
```

#### 2. Controller (`controllers/repairNotificationController.js`)
- `createRepairNotification`: Create new notification
- `getCustomerRepairNotifications`: Get notifications for a customer
- `markNotificationAsRead`: Mark notification as read
- `markAllNotificationsAsRead`: Mark all notifications as read
- `deleteNotification`: Delete specific notification
- `clearAllNotifications`: Clear all notifications for customer
- `getNotificationCount`: Get notification counts
- `createRepairSubmissionNotification`: Helper for repair submission
- `createRepairStatusNotification`: Helper for status changes

#### 3. Routes (`routes/repairNotificationRoutes.js`)
- `GET /api/repair-notifications/customer/:customerId` - Get customer notifications
- `GET /api/repair-notifications/customer/:customerId/count` - Get notification count
- `PUT /api/repair-notifications/:notificationId/read` - Mark as read
- `PUT /api/repair-notifications/customer/:customerId/read-all` - Mark all as read
- `DELETE /api/repair-notifications/:notificationId` - Delete notification
- `DELETE /api/repair-notifications/customer/:customerId/clear-all` - Clear all
- `POST /api/repair-notifications` - Create notification

#### 4. Integration with Repair Request Controller
The repair request controller has been updated to automatically create notifications when:
- A new repair request is submitted
- Repair request status changes (approve/reject)
- Repair progress reaches milestones (25%, 50%, 75%, 100%)

### Frontend Components

#### 1. RepairNotificationDropdown (`components/RepairNotificationDropdown.jsx`)
- Dedicated dropdown component for repair notifications
- Shows latest 5 notifications
- Displays unread count badge
- Allows marking notifications as read
- Provides "View all notifications" link

#### 2. Updated Header (`components/Header.jsx`)
- Added RepairNotificationDropdown alongside existing NotificationDropdown
- Both notification systems work independently
- Maintains existing order/enrollment notification functionality

#### 3. Updated CustomerLayout (`components/CustomerLayout.jsx`)
- Added "Repair Notifications" section in sidebar
- Shows repair notification dropdown
- Checks for unread repair notifications on load

#### 4. Enhanced CustomerNotifications Page (`pages/CustomerNotifications.jsx`)
- Added tabbed interface: All, Orders, Repairs
- Shows both order/enrollment and repair notifications
- Separate clear buttons for each notification type
- Enhanced help section with repair-specific links

## API Endpoints

### Get Customer Notifications
```http
GET /api/repair-notifications/customer/:customerId?limit=50&offset=0&unreadOnly=false
Authorization: Bearer <token>
```

### Get Notification Count
```http
GET /api/repair-notifications/customer/:customerId/count
Authorization: Bearer <token>
```

### Mark Notification as Read
```http
PUT /api/repair-notifications/:notificationId/read
Authorization: Bearer <token>
```

### Clear All Notifications
```http
DELETE /api/repair-notifications/customer/:customerId/clear-all
Authorization: Bearer <token>
```

## Database Schema

### RepairNotification Collection
```javascript
{
  _id: ObjectId,
  customerId: ObjectId,           // Reference to User
  repairRequestId: ObjectId,      // Reference to RepairRequest
  type: String,                   // 'repair_submitted', 'repair_approved', etc.
  title: String,                  // Display title
  message: String,                // Display message
  isRead: Boolean,                // Default: false
  metadata: {
    equipmentType: String,
    damageType: String,
    status: String,
    repairProgress: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `{ customerId: 1, createdAt: -1 }` - For efficient customer notification queries
- `{ customerId: 1, isRead: 1 }` - For unread notification queries

## Usage Examples

### Creating a Repair Submission Notification
```javascript
await repairNotificationController.createRepairSubmissionNotification(
  customerId,
  repairRequestId,
  {
    equipmentType: 'cricket_bat',
    damageType: 'Handle Damage',
    status: 'Pending'
  }
);
```

### Creating a Status Change Notification
```javascript
await repairNotificationController.createRepairStatusNotification(
  customerId,
  repairRequestId,
  'Approved',
  {
    equipmentType: 'cricket_bat',
    damageType: 'Handle Damage',
    status: 'Approved',
    costEstimate: 150,
    timeEstimate: '3-5 days'
  }
);
```

## Testing

### Test Script
Run the test script to verify the system:
```bash
node test-repair-notifications.js
```

### Manual Testing Steps
1. Submit a repair request
2. Check header bell icon for repair notification
3. Check customer sidebar for repair notifications
4. Visit customer notifications page
5. Test marking notifications as read
6. Test clearing notifications

## Security

### Authentication
- All API endpoints require authentication via Bearer token
- Users can only access their own notifications
- Proper authorization checks in place

### Data Validation
- Input validation on all endpoints
- Sanitization of user input
- Proper error handling

## Performance Considerations

### Database Optimization
- Indexed queries for efficient retrieval
- Pagination support for large notification lists
- Automatic cleanup of old notifications (can be implemented)

### Frontend Optimization
- Lazy loading of notifications
- Efficient state management
- Minimal API calls

## Future Enhancements

### Potential Improvements
1. **Real-time Updates**: WebSocket integration for instant notifications
2. **Email Integration**: Send email notifications alongside in-app notifications
3. **Push Notifications**: Browser push notifications for important updates
4. **Notification Preferences**: Allow users to customize notification types
5. **Auto-cleanup**: Automatic deletion of old notifications
6. **Rich Notifications**: Support for images and action buttons

### Scalability
- The system is designed to handle high volumes of notifications
- Database indexes ensure efficient queries even with large datasets
- Pagination prevents memory issues with large notification lists

## Troubleshooting

### Common Issues

#### Notifications Not Appearing
1. Check if user is authenticated
2. Verify customer ID is correct
3. Check database connection
4. Verify notification creation in repair request controller

#### Unread Count Not Updating
1. Check if notification is being marked as read
2. Verify API endpoint is working
3. Check frontend state management

#### Performance Issues
1. Check database indexes
2. Verify pagination is working
3. Monitor API response times

### Debug Commands
```javascript
// Check notification count
db.repairnotifications.countDocuments({ customerId: ObjectId("...") })

// Check unread notifications
db.repairnotifications.countDocuments({ customerId: ObjectId("..."), isRead: false })

// Get recent notifications
db.repairnotifications.find({ customerId: ObjectId("...") }).sort({ createdAt: -1 }).limit(10)
```

## Conclusion

The Repair Notification System has been successfully implemented with complete isolation from the existing notification system. It provides a comprehensive solution for repair request notifications with:

- ✅ Separate database model and API endpoints
- ✅ Independent frontend components
- ✅ Real-time notification creation
- ✅ Persistent storage and retrieval
- ✅ User-friendly interface
- ✅ Proper authentication and security
- ✅ Scalable architecture

The system is ready for production use and can be easily extended with additional features as needed.

