
import React from 'react';
import { Tabs } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import type { TabBarItem } from '@/components/FloatingTabBar';

const TABS: TabBarItem[] = [
  {
    name: 'home',
    route: '/(tabs)/(home)',
    icon: 'home',
    iosIcon: 'house',
    label: 'Home',
  },
  {
    name: 'profile',
    route: '/(tabs)/profile',
    icon: 'person',
    iosIcon: 'person',
    label: 'Profile',
  },
];

export default function TabLayout() {
  console.log('[TabLayout] rendering');
  return (
    <Tabs
      tabBar={() => <FloatingTabBar tabs={TABS} />}
      screenOptions={{ headerShown: false }}
    />
  );
}
