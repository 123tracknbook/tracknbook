
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  console.log('TabLayout rendering');
  
  // Empty tabs array - no camera or notification buttons
  const tabs: TabBarItem[] = [];

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
      {tabs.length > 0 && <FloatingTabBar tabs={tabs} />}
    </>
  );
}
