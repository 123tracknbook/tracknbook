
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '@/hooks/useNotifications';
import {
  scheduleLocalNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  setBadgeCount,
  getBadgeCount,
} from '@/utils/notifications';

export default function NotificationsDemoScreen() {
  const { colors } = useTheme();
  const { expoPushToken, notification, notificationResponse } = useNotifications();
  
  const [notificationTitle, setNotificationTitle] = useState('Test Notification');
  const [notificationBody, setNotificationBody] = useState('This is a test notification');
  const [delaySeconds, setDelaySeconds] = useState('5');
  const [scheduledCount, setScheduledCount] = useState(0);
  const [badgeCount, setBadgeCountState] = useState(0);

  // Update scheduled notifications count
  const updateScheduledCount = async () => {
    const notifications = await getScheduledNotifications();
    setScheduledCount(notifications.length);
  };

  // Update badge count
  const updateBadgeCount = async () => {
    const count = await getBadgeCount();
    setBadgeCountState(count);
  };

  useEffect(() => {
    updateScheduledCount();
    updateBadgeCount();
  }, []);

  // Handle notification received while app is open
  useEffect(() => {
    if (notification) {
      const title = notification.request.content.title || 'Notification';
      const body = notification.request.content.body || '';
      console.log('Notification received in app:', { title, body });
    }
  }, [notification]);

  // Handle notification tap
  useEffect(() => {
    if (notificationResponse) {
      const title = notificationResponse.notification.request.content.title || 'Notification';
      console.log('User tapped notification:', title);
    }
  }, [notificationResponse]);

  const handleScheduleNotification = async () => {
    const delay = parseInt(delaySeconds, 10);
    if (isNaN(delay) || delay < 0) {
      Alert.alert('Invalid Delay', 'Please enter a valid number of seconds');
      return;
    }

    try {
      await scheduleLocalNotification(
        notificationTitle,
        notificationBody,
        { customData: 'test' },
        delay > 0 ? delay : undefined
      );
      
      const message = delay > 0 
        ? `Notification scheduled for ${delay} seconds from now`
        : 'Notification sent immediately';
      
      Alert.alert('Success', message);
      await updateScheduledCount();
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  const handleCancelAll = async () => {
    try {
      await cancelAllNotifications();
      Alert.alert('Success', 'All scheduled notifications canceled');
      await updateScheduledCount();
    } catch (error) {
      console.error('Error canceling notifications:', error);
      Alert.alert('Error', 'Failed to cancel notifications');
    }
  };

  const handleSetBadge = async (count: number) => {
    try {
      await setBadgeCount(count);
      await updateBadgeCount();
    } catch (error) {
      console.error('Error setting badge count:', error);
      Alert.alert('Error', 'Failed to set badge count');
    }
  };

  const tokenDisplay = expoPushToken || 'Loading...';
  const scheduledText = `${scheduledCount} scheduled`;
  const badgeText = `Badge: ${badgeCount}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Push Notifications Demo',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Push Token Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Expo Push Token</Text>
          <Text style={[styles.tokenText, { color: colors.text }]} selectable>
            {tokenDisplay}
          </Text>
          <Text style={[styles.helperText, { color: colors.text, opacity: 0.6 }]}>
            Send this token to your backend to enable push notifications
          </Text>
        </View>

        {/* Schedule Notification Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule Local Notification</Text>
          
          <Text style={[styles.label, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={notificationTitle}
            onChangeText={setNotificationTitle}
            placeholder="Notification title"
            placeholderTextColor={colors.text + '80'}
          />

          <Text style={[styles.label, { color: colors.text }]}>Body</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={notificationBody}
            onChangeText={setNotificationBody}
            placeholder="Notification body"
            placeholderTextColor={colors.text + '80'}
            multiline
          />

          <Text style={[styles.label, { color: colors.text }]}>Delay (seconds, 0 for immediate)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={delaySeconds}
            onChangeText={setDelaySeconds}
            placeholder="5"
            placeholderTextColor={colors.text + '80'}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#007AFF' }]}
            onPress={handleScheduleNotification}
          >
            <Text style={styles.buttonText}>Schedule Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Scheduled Notifications Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Scheduled Notifications</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>{scheduledText}</Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#FF3B30' }]}
            onPress={handleCancelAll}
          >
            <Text style={styles.buttonText}>Cancel All Scheduled</Text>
          </TouchableOpacity>
        </View>

        {/* Badge Count Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Badge</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>{badgeText}</Text>
          
          <View style={styles.badgeButtons}>
            <TouchableOpacity
              style={[styles.badgeButton, { backgroundColor: '#34C759' }]}
              onPress={() => handleSetBadge(1)}
            >
              <Text style={styles.buttonText}>Set to 1</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.badgeButton, { backgroundColor: '#FF9500' }]}
              onPress={() => handleSetBadge(5)}
            >
              <Text style={styles.buttonText}>Set to 5</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.badgeButton, { backgroundColor: '#8E8E93' }]}
              onPress={() => handleSetBadge(0)}
            >
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Last Notification Section */}
        {notification && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Last Received</Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              {notification.request.content.title}
            </Text>
            <Text style={[styles.helperText, { color: colors.text, opacity: 0.6 }]}>
              {notification.request.content.body}
            </Text>
          </View>
        )}

        {/* Instructions Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How to Test</Text>
          <Text style={[styles.instructionText, { color: colors.text }]}>
            1. Schedule a notification with a delay{'\n'}
            2. Close or background the app{'\n'}
            3. Wait for the notification to appear{'\n'}
            4. Tap the notification to open the app{'\n\n'}
            Note: Push notifications only work on physical devices, not simulators.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  badgeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badgeButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
