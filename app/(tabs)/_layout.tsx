
import React from 'react';
import { Tabs } from 'expo-router';
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";

export default function TabLayout() {
  useSubscriptionGuard();

  console.log('[TabLayout] rendering');
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
