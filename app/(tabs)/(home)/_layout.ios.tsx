
import React from 'react';
import { Slot } from 'expo-router';

export default function HomeLayout() {
  console.log('[HomeLayout] rendering (iOS, Slot passthrough)');
  return <Slot />;
}
