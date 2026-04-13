
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
  console.log('[TabLayout] rendering');
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
        {/* href: null is expo-router's built-in way to hide a tab:
            it sets tabBarItemStyle: { display: 'none' } AND returns null
            from tabBarButton, so no button or space is rendered. */}
        <Tabs.Screen name="(home)" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
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
