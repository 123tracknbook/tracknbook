
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
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
    <View style={styles.container}>
      <Slot />
      <FloatingTabBar tabs={TABS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
