
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="camera-demo" name="camera-demo">
        <Icon sf="camera.fill" />
        <Label>Camera</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="notifications-demo" name="notifications-demo">
        <Icon sf="bell.fill" />
        <Label>Notifications</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="home" name="(home)" hidden>
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
