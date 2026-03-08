
import { WebView } from "react-native-webview";
import { Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";

const webAppUrl = "https://www.tracknbook.app";

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: 'white',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'red',
    padding: 20,
    zIndex: 11,
  },
});

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  const handleLoadEnd = () => {
    console.log('WebView finished loading (iOS)');
    setLoading(false);
  };

  const handleLoadStart = () => {
    console.log('WebView started loading (iOS)');
    setLoading(true);
    setError(null);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const errorMessage = `Failed to load: ${nativeEvent.description || nativeEvent.url || 'Unknown error'}`;
    console.error('WebView Error (iOS):', nativeEvent);
    setError(errorMessage);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const errorMessage = `HTTP Error ${nativeEvent.statusCode}: ${nativeEvent.url}`;
    console.error('WebView HTTP Error (iOS):', nativeEvent);
    setError(errorMessage);
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    console.log('WebView navigation request (iOS):', request.url);
    return true;
  };

  const loadingTextColor = colors.text;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <WebView
        source={{ uri: webAppUrl }}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        startInLoadingState={true}
        originWhitelist={['*']}
        cacheEnabled={true}
        sharedCookiesEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        allowsBackForwardNavigationGestures={true}
        allowFileAccessFromFileURLs={true}
        geolocationEnabled={true}
        allowsLinkPreview={true}
        style={styles.container}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={[styles.loadingText, { color: loadingTextColor }]}>
            Loading TrackNBook...
          </Text>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}
