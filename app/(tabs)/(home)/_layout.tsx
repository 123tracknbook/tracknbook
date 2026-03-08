
import React from 'react';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  console.log('HomeLayout rendering');
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
