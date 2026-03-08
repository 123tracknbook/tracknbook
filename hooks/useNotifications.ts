
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '@/utils/notifications';

/**
 * Hook to manage push notifications in your app
 * 
 * Usage:
 * ```tsx
 * const { expoPushToken, notification, notificationResponse } = useNotifications();
 * 
 * // Send expoPushToken to your backend to enable push notifications
 * useEffect(() => {
 *   if (expoPushToken) {
 *     // TODO: Send token to backend
 *     console.log('Push token:', expoPushToken);
 *   }
 * }, [expoPushToken]);
 * ```
 */
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const [notificationResponse, setNotificationResponse] = useState<
    Notifications.NotificationResponse | undefined
  >();

  useEffect(() => {
    console.log('useNotifications: Initializing...');
    
    // Register for push notifications and get the token
    registerForPushNotificationsAsync()
      .then((token) => {
        console.log('useNotifications: Token received:', token);
        setExpoPushToken(token);
      })
      .catch((error) => {
        console.error('useNotifications: Error registering for push notifications:', error);
      });

    // Listen for notifications received while the app is running
    const notificationListener = addNotificationReceivedListener((notification) => {
      console.log('useNotifications: Notification received:', notification);
      setNotification(notification);
    });

    // Listen for when the user taps on a notification
    const responseListener = addNotificationResponseReceivedListener((response) => {
      console.log('useNotifications: Notification response received:', response);
      setNotificationResponse(response);
    });

    // Cleanup listeners on unmount
    return () => {
      console.log('useNotifications: Cleaning up listeners');
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return {
    expoPushToken,
    notification,
    notificationResponse,
  };
}
