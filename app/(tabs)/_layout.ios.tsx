
import React from 'react';
import { View, StyleSheet } from 'react-native';
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
  console.log('[TabLayout] rendering (iOS)');
  return (
    <View style={styles.root}>
      <Tabs
        tabBar={() => null}
        screenOptions={{
          headerShown: false,
          // Collapse the tab bar container so it takes zero layout space.
          tabBarStyle: {
            position: 'absolute',
            height: 0,
            minHeight: 0,
            maxHeight: 0,
            overflow: 'hidden',
            opacity: 0,
          },
        }}
      >
        <Tabs.Screen name="(home)" options={{ tabBarButton: () => null }} />
        <Tabs.Screen name="profile" options={{ tabBarButton: () => null }} />
      </Tabs>
      <FloatingTabBar tabs={TABS} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
