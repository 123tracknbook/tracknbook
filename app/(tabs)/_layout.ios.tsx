
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="camera" name="camera">
        <Icon sf="camera.fill" />
        <Label>Camera</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="notifications" name="notifications">
        <Icon sf="bell.fill" />
        <Label>Notifications</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
