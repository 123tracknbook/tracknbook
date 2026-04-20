
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Set the notification handler to control how notifications are displayed when the app is in the foreground
// Guard for web — Notifications.setNotificationHandler is not supported on web
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Register for push notifications and get the Expo push token
 * This token can be sent to your backend to send push notifications to this device
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  console.log('registerForPushNotificationsAsync — starting');

  try {
    // Web doesn't support Expo push notifications
    if (Platform.OS === 'web') {
      console.warn('registerForPushNotificationsAsync — web platform, skipping');
      return undefined;
    }

    let token: string | undefined;

    // Android requires a notification channel before requesting permissions
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        console.log('registerForPushNotificationsAsync — Android notification channel created');
      } catch (channelError) {
        console.error('registerForPushNotificationsAsync — Android channel creation failed:', channelError);
        // Non-fatal: continue to permission request
      }
    }

    // Check existing permission status
    let finalStatus: string;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      finalStatus = existingStatus;
      console.log('registerForPushNotificationsAsync — existing permission status:', existingStatus);

      if (existingStatus !== 'granted') {
        console.log('registerForPushNotificationsAsync — requesting permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('registerForPushNotificationsAsync — permission request result:', status);
      }
    } catch (permError) {
      console.error('registerForPushNotificationsAsync — permission check/request failed:', permError);
      return undefined;
    }

    if (finalStatus !== 'granted') {
      console.warn('registerForPushNotificationsAsync — permissions not granted, skipping token fetch');
      return undefined;
    }

    // Push token can only be obtained on a physical device
    if (Device.isDevice) {
      console.log('registerForPushNotificationsAsync — physical device, fetching Expo push token...');
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          console.warn('registerForPushNotificationsAsync — projectId not found in app config (extra.eas.projectId)');
        }

        const pushToken = await Notifications.getExpoPushTokenAsync({
          projectId: projectId || undefined,
        });

        token = pushToken.data;
        console.log('registerForPushNotificationsAsync — Expo push token obtained:', token);
      } catch (tokenError) {
        console.error('registerForPushNotificationsAsync — failed to get Expo push token:', tokenError);
      }
    } else {
      console.warn('registerForPushNotificationsAsync — simulator detected, push token unavailable (permissions still requested)');
    }

    return token;
  } catch (e) {
    console.error('registerForPushNotificationsAsync — unexpected top-level error:', e);
    return undefined;
  }
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
  // Web doesn't support scheduled notifications
  if (Platform.OS === 'web') {
    console.warn('Scheduled notifications are not supported on web');
    return undefined;
  }
  
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
  if (Platform.OS === 'web') {
    console.warn('Cancel notification is not supported on web');
    return;
  }
  
  console.log('Canceling notification:', identifier);
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  if (Platform.OS === 'web') {
    console.warn('Cancel all notifications is not supported on web');
    return;
  }
  
  console.log('Canceling all scheduled notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  if (Platform.OS === 'web') {
    console.warn('Get scheduled notifications is not supported on web');
    return [];
  }
  
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  console.log('Scheduled notifications:', notifications.length);
  return notifications;
}

/**
 * Dismiss a notification from the notification tray
 */
export async function dismissNotification(notificationId: string) {
  if (Platform.OS === 'web') {
    console.warn('Dismiss notification is not supported on web');
    return;
  }
  
  console.log('Dismissing notification:', notificationId);
  await Notifications.dismissNotificationAsync(notificationId);
}

/**
 * Dismiss all notifications from the notification tray
 */
export async function dismissAllNotifications() {
  if (Platform.OS === 'web') {
    console.warn('Dismiss all notifications is not supported on web');
    return;
  }
  
  console.log('Dismissing all notifications');
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Set the app badge count (the number shown on the app icon)
 */
export async function setBadgeCount(count: number) {
  if (Platform.OS === 'web') {
    console.warn('Badge count is not supported on web');
    return;
  }
  
  console.log('Setting badge count to:', count);
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Get the current badge count
 */
export async function getBadgeCount() {
  if (Platform.OS === 'web') {
    console.warn('Badge count is not supported on web');
    return 0;
  }
  
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
