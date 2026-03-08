
import React, { useState } from "react";
import { StyleSheet, View, ActivityIndicator, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";

export default function HomeScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const webAppUrl = "https://www.tracknbook.app";

  const handleLoadEnd = () => {
    console.log("WebView finished loading TrackNBook");
    setLoading(false);
    setError(null);
  };

  const handleLoadStart = () => {
    console.log("WebView started loading TrackNBook");
    setLoading(true);
    setError(null);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error occurred:", JSON.stringify(nativeEvent, null, 2));
    const errorMessage = nativeEvent.description || nativeEvent.code || "Unknown error";
    setError(`Failed to load: ${errorMessage}`);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView HTTP error:", JSON.stringify(nativeEvent, null, 2));
    setLoading(false);
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    console.log("WebView loading request:", request.url);
    return true;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
              Connection Error
            </Text>
            <Text style={[styles.errorText, { color: theme.colors.text }]}>
              {error}
            </Text>
            <Text style={[styles.errorHint, { color: theme.colors.text, opacity: 0.7 }]}>
              Please check your internet connection and try again.
            </Text>
          </View>
        ) : (
          <WebView
            source={{ uri: webAppUrl }}
            style={styles.webview}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleHttpError}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            cacheEnabled={true}
            cacheMode="LOAD_DEFAULT"
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            originWhitelist={['*']}
            setSupportMultipleWindows={false}
          />
        )}
        {loading && !error && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading TrackNBook...
            </Text>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
