
import React from 'react';
import { Slot } from 'expo-router';

// Minimal passthrough layout — the parent (tabs)/_layout.tsx already
// provides a Stack navigator. Adding another Stack here causes double-nesting
// which crashes on iOS with expo-router v6 + React 19.
export default function HomeLayout() {
  console.log('HomeLayout rendering (Slot passthrough)');
  return <Slot />;
}
