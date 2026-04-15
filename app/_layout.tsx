
import "react-native-reanimated";
import React, { useEffect, useRef, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, Redirect, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { isOnboardingComplete } from "@/utils/onboardingStorage";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Note: Notifications.setNotificationHandler is already called in utils/notifications.ts

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Safety net: if the WebView never fires onLoadEnd (e.g. network error, slow load),
// hide the splash screen after this many milliseconds so the app never stays stuck.
const SPLASH_SAFETY_TIMEOUT_MS = 5000;

export default function RootLayout() {
  // Default to true so the app renders immediately without blocking on SecureStore.
  // The async check below will update this if onboarding is actually incomplete.
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(true);
  const onboardingCheckedRef = useRef(false);
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Check onboarding state once on mount — non-blocking: we default to true above
  // so the app renders immediately and we only redirect to onboarding if needed.
  useEffect(() => {
    if (onboardingCheckedRef.current) return;
    onboardingCheckedRef.current = true;
    console.log('[RootLayout] Checking onboarding state (non-blocking)');
    isOnboardingComplete()
      .then((complete) => {
        console.log('[RootLayout] Onboarding complete:', complete);
        setOnboardingComplete(complete);
      })
      .catch((err) => {
        // SecureStore failure — keep default (true) so the app doesn't hang.
        console.warn('[RootLayout] isOnboardingComplete failed, keeping default true:', err);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety timeout: set up once on mount, independent of font loading state.
  // The WebView's onLoadEnd calls hideAsync() immediately — this is only a fallback.
  useEffect(() => {
    console.log('[RootLayout] mounted — starting splash safety timeout');
    const timer = setTimeout(() => {
      console.log('[RootLayout] Safety timeout reached — forcing SplashScreen.hideAsync()');
      SplashScreen.hideAsync().catch((e) =>
        console.warn('[RootLayout] SplashScreen.hideAsync (safety timeout) error:', e)
      );
    }, SPLASH_SAFETY_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // NOTE: We intentionally do NOT block on font loading or onboarding check.
  // The WebView starts loading immediately; fonts and onboarding state resolve in the background.
  console.log('[RootLayout] rendering — fonts loaded:', loaded, '| onboardingComplete:', onboardingComplete);

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
              {onboardingComplete === false && pathname !== "/auth" && pathname !== "/paywall" && pathname !== "/auth-popup" && pathname !== "/auth-callback" && <Redirect href="/onboarding" />}

              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />

                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="camera-demo" options={{ headerShown: true, title: 'Camera Demo' }} />
                <Stack.Screen name="notifications-demo" options={{ headerShown: true, title: 'Notifications Demo' }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <SystemBars style="light" />
            </GestureHandlerRootView>
          </SubscriptionProvider>
        </WidgetProvider>
      </ThemeProvider>
    </>
  );
}
