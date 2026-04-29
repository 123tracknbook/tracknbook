import "react-native-reanimated";
import React, { useEffect } from "react";
import { useColorScheme, Platform } from "react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {});
}, 5000);

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const SPLASH_SAFETY_TIMEOUT_MS = 5000;

// Lazily load native-only modules so web doesn't crash
const TrackingTransparency = Platform.OS !== 'web'
  ? require('expo-tracking-transparency')
  : null;

const SystemBars = Platform.OS !== 'web'
  ? require('react-native-edge-to-edge').SystemBars
  : null;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (TrackingTransparency) {
      TrackingTransparency.requestTrackingPermissionsAsync().catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log('[RootLayout] mounted — starting splash safety timeout');
    const timer = setTimeout(() => {
      console.log('[RootLayout] Safety timeout reached — forcing SplashScreen.hideAsync()');
      SplashScreen.hideAsync().catch((e) =>
        console.warn('[RootLayout] SplashScreen.hideAsync (safety timeout) error:', e)
      );
    }, SPLASH_SAFETY_TIMEOUT_MS);
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  console.log('[RootLayout] rendering — fonts loaded:', loaded);

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)",
      background: "rgb(242, 242, 247)",
      card: "rgb(255, 255, 255)",
      text: "rgb(0, 0, 0)",
      border: "rgb(216, 216, 220)",
      notification: "rgb(255, 59, 48)",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)",
      background: "rgb(1, 1, 1)",
      card: "rgb(28, 28, 30)",
      text: "rgb(255, 255, 255)",
      border: "rgb(44, 44, 46)",
      notification: "rgb(255, 69, 58)",
    },
  };

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <WidgetProvider>
          <SubscriptionProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="camera-demo" options={{ headerShown: true, title: 'Camera Demo' }} />
                <Stack.Screen name="notifications-demo" options={{ headerShown: true, title: 'Notifications Demo' }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              {SystemBars ? <SystemBars style="light" /> : null}
            </GestureHandlerRootView>
          </SubscriptionProvider>
        </WidgetProvider>
      </ThemeProvider>
    </>
  );
}
