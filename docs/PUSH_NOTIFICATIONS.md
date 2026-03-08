
# Push Notifications Setup Guide

This app is now configured with push notifications using `expo-notifications`.

## Features Implemented

✅ **Local Notifications** - Schedule notifications that trigger at specific times
✅ **Push Notifications** - Receive remote notifications from your backend
✅ **Notification Permissions** - Request and manage notification permissions
✅ **Badge Management** - Set and clear app icon badge counts
✅ **Notification Handlers** - Listen for notification events and user interactions
✅ **Background Notifications** - Handle notifications when app is backgrounded or closed

## Testing Push Notifications

### 1. Test Local Notifications (No Backend Required)

Navigate to the demo screen to test local notifications:

```typescript
// In your app, navigate to:
router.push('/notifications-demo');
```

The demo screen allows you to:
- Schedule local notifications with custom titles and bodies
- Set delays for notifications
- Manage app badge counts
- View your Expo push token
- Cancel scheduled notifications

### 2. Test on a Physical Device

**Important:** Push notifications only work on physical devices, not simulators/emulators.

#### iOS:
1. Build the app with EAS Build or run on a physical device
2. Grant notification permissions when prompted
3. Test local notifications from the demo screen
4. For remote push notifications, you'll need to configure APNs credentials

#### Android:
1. Build the app with EAS Build or run on a physical device
2. Grant notification permissions when prompted (Android 13+)
3. Test local notifications from the demo screen
4. For remote push notifications, you'll need to configure FCM credentials

## Using Push Notifications in Your App

### 1. Get the Push Token

Use the `useNotifications` hook to get the Expo push token:

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { expoPushToken, notification, notificationResponse } = useNotifications();

  useEffect(() => {
    if (expoPushToken) {
      // Send this token to your backend
      console.log('Push token:', expoPushToken);
      // TODO: Backend Integration - POST /api/users/push-token with { token: expoPushToken }
    }
  }, [expoPushToken]);

  return <View>...</View>;
}
```

### 2. Schedule Local Notifications

```typescript
import { scheduleLocalNotification } from '@/utils/notifications';

// Schedule a notification for 5 seconds from now
await scheduleLocalNotification(
  'Reminder',
  'Time to check your bookings!',
  { customData: 'value' },
  5 // seconds
);

// Send immediately (no delay)
await scheduleLocalNotification(
  'Welcome!',
  'Thanks for using TrackNBook'
);
```

### 3. Listen for Notification Events

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { notification, notificationResponse } = useNotifications();

  // Handle notification received while app is open
  useEffect(() => {
    if (notification) {
      console.log('Notification received:', notification.request.content);
    }
  }, [notification]);

  // Handle user tapping on a notification
  useEffect(() => {
    if (notificationResponse) {
      console.log('User tapped notification');
      // Navigate to a specific screen based on notification data
      const url = notificationResponse.notification.request.content.data?.url;
      if (url) {
        router.push(url);
      }
    }
  }, [notificationResponse]);

  return <View>...</View>;
}
```

### 4. Manage Badge Count

```typescript
import { setBadgeCount, getBadgeCount } from '@/utils/notifications';

// Set badge to 5
await setBadgeCount(5);

// Clear badge
await setBadgeCount(0);

// Get current badge count
const count = await getBadgeCount();
```

## Sending Push Notifications from Your Backend

### 1. Store Push Tokens

When a user registers their device, send the Expo push token to your backend:

```typescript
// TODO: Backend Integration - Create endpoint to store push tokens
// POST /api/users/push-token
// Body: { token: string, userId: string }
```

### 2. Send Push Notifications

Use the Expo Push Notification service to send notifications:

```bash
curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
       "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
       "title": "New Booking",
       "body": "You have a new booking request!",
       "data": { "url": "/bookings/123" }
     }'
```

Or use the Expo SDK in your backend:

```javascript
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const messages = [{
  to: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  sound: 'default',
  title: 'New Booking',
  body: 'You have a new booking request!',
  data: { url: '/bookings/123' },
}];

const chunks = expo.chunkPushNotifications(messages);
for (const chunk of chunks) {
  await expo.sendPushNotificationsAsync(chunk);
}
```

## Configuration

### app.json

The app is already configured with the `expo-notifications` plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/app-icon-ptb.png",
          "color": "#000000",
          "defaultChannel": "default",
          "enableBackgroundRemoteNotifications": true
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

**Important:** Replace `"your-project-id"` with your actual EAS project ID from `eas.json` or create one with:

```bash
eas init
```

### Permissions

#### iOS
- No additional configuration needed
- Permissions are requested at runtime

#### Android
- `POST_NOTIFICATIONS` permission is already added to `app.json`
- For Android 13+, users must grant notification permission
- For exact alarm scheduling, add to AndroidManifest.xml:
  ```xml
  <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
  ```

## Background Notifications

To handle notifications when the app is closed or in the background:

```typescript
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
  if (error) {
    console.error('Background notification error:', error);
    return;
  }
  
  console.log('Background notification received:', data);
  // Handle the notification data
});

// Register the task
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
```

## Troubleshooting

### Notifications not appearing?

1. **Check device**: Push notifications only work on physical devices
2. **Check permissions**: Ensure notification permissions are granted
3. **Check Android channel**: On Android, ensure a notification channel is created
4. **Check foreground handler**: Ensure `setNotificationHandler` is configured
5. **Check logs**: Look for errors in console logs

### Token not generating?

1. **Check project ID**: Ensure `extra.eas.projectId` is set in `app.json`
2. **Check device**: Must be a physical device
3. **Check network**: Device must have internet connection
4. **Check permissions**: Notification permissions must be granted

### Badge not updating?

1. **iOS**: Ensure `allowBadge` permission is granted
2. **Android**: Not all launchers support badges
3. **Check permissions**: Badge permission must be granted

## Next Steps

1. ✅ Push notifications are set up and ready to use
2. 🔄 **TODO**: Set up backend endpoints to store push tokens
3. 🔄 **TODO**: Implement backend logic to send push notifications
4. 🔄 **TODO**: Configure APNs credentials for iOS (for production)
5. 🔄 **TODO**: Configure FCM credentials for Android (for production)

## Subscription Payments

**RevenueCat integration is coming soon!** Some users already have access. Your account will get access once the feature is fully rolled out. This will enable:

- In-app purchases
- Subscription management
- Apple App Store and Google Play Store integration
- Automatic receipt validation
- Cross-platform subscription sync

Stay tuned for updates on subscription payment capabilities!
