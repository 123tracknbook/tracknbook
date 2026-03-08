
import React, { useState } from "react";
import { StyleSheet, View, ActivityIndicator, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";

export default function HomeScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  // Replace this URL with your Lovable web app URL
  const webAppUrl = "https://your-lovable-app.lovable.app";

  const handleLoadEnd = () => {
    console.log("WebView finished loading");
    setLoading(false);
  };

  const handleLoadStart = () => {
    console.log("WebView started loading");
    setLoading(true);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log("WebView error:", nativeEvent);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <WebView
          source={{ uri: webAppUrl }}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
