
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Set the notification handler to control how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get the Expo push token
 * This token can be sent to your backend to send push notifications to this device
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  console.log('Registering for push notifications...');
  
  let token: string | undefined;

  // Android requires a notification channel to be created before requesting permissions
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    console.log('Android notification channel created');
  }

  // Push notifications only work on physical devices
  if (Device.isDevice) {
    console.log('Device detected, checking permissions...');
    
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    console.log('Existing permission status:', existingStatus);

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Permission request result:', status);
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return undefined;
    }

    // Get the Expo push token
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? 
        Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('Project ID not found in app config. Add it to app.json under extra.eas.projectId');
        // For development, we can still get a token without projectId
      }

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || undefined,
      });
      
      token = pushToken.data;
      console.log('Expo push token obtained:', token);
    } catch (error) {
      console.error('Error getting Expo push token:', error);
    }
  } else {
    console.warn('Push notifications require a physical device');
  }

  return token;
}

/**
 * Schedule a local notification (does not require backend)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  triggerSeconds?: number
) {
  console.log('Scheduling local notification:', { title, body, triggerSeconds });
  
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: triggerSeconds
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerSeconds,
        }
      : null, // null means deliver immediately
  });

  console.log('Local notification scheduled with identifier:', identifier);
  return identifier;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(identifier: string) {
  console.log('Canceling notification:', identifier);
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  console.log('Canceling all scheduled notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  console.log('Scheduled notifications:', notifications.length);
  return notifications;
}

/**
 * Dismiss a notification from the notification tray
 */
export async function dismissNotification(notificationId: string) {
  console.log('Dismissing notification:', notificationId);
  await Notifications.dismissNotificationAsync(notificationId);
}

/**
 * Dismiss all notifications from the notification tray
 */
export async function dismissAllNotifications() {
  console.log('Dismissing all notifications');
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Set the app badge count (the number shown on the app icon)
 */
export async function setBadgeCount(count: number) {
  console.log('Setting badge count to:', count);
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Get the current badge count
 */
export async function getBadgeCount() {
  const count = await Notifications.getBadgeCountAsync();
  console.log('Current badge count:', count);
  return count;
}

/**
 * Add a listener for when notifications are received while the app is running
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  console.log('Adding notification received listener');
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when the user taps on a notification
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  console.log('Adding notification response listener');
  return Notifications.addNotificationResponseReceivedListener(callback);
}
