
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define the tabs configuration with Camera and Notifications
  const tabs: TabBarItem[] = [
    {
      name: 'camera',
      route: '/camera-demo',
      icon: 'camera',
      label: 'Camera',
    },
    {
      name: 'notifications',
      route: '/notifications-demo',
      icon: 'notifications',
      label: 'Notifications',
    },
  ];

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Remove fade animation to prevent black screen flash
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
