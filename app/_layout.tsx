
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, View } from "react-native";
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
// Note: Notifications.setNotificationHandler is already called in utils/notifications.ts

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    console.log('RootLayout mounted, fonts loaded:', loaded);
    // Splash screen is kept visible until the WebView fires onLoadEnd.
    // Nothing to do here — SplashScreen.hideAsync() is called by the home screen.
  }, [loaded]);

  if (!loaded) {
    console.log('Fonts not loaded yet, showing splash screen');
    return (
      <View
        style={{
          flex: 1,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#1a2332',
        }}
      />
    );
  }

  console.log('RootLayout rendering with color scheme:', colorScheme);

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
              <SystemBars style="light" />
            </GestureHandlerRootView>
          </SubscriptionProvider>
        </WidgetProvider>
      </ThemeProvider>
    </>
  );
}
