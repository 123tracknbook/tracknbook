
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  console.log('TabLayout rendering (iOS)');
  
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

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { flex: 1 },
        }}
      >
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
