
import { Stack } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { useTheme } from "@react-navigation/native";

const webAppUrl = "https://www.tracknbook.app";

// Web-only iframe style — kept outside StyleSheet.create to allow CSS-only properties
const iframeStyle = {
  flex: 1,
  width: '100%',
  height: '100%',
  border: 'none',
} as React.CSSProperties;

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
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    opacity: 0.7,
  },
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    console.log('Web app loaded successfully');
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    console.error('Failed to load web app:', webAppUrl);
    setError('Failed to load the web application');
    setIsLoading(false);
  };

  const errorDisplay = error ? error : '';
  const loadingTextColor = colors.text;
  const errorTextColor = colors.text;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Track n Book",
          headerShown: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: errorTextColor }]}>
              Connection Error
            </Text>
            <Text style={[styles.errorText, { color: errorTextColor }]}>
              {errorDisplay}
            </Text>
            <Text style={[styles.errorHint, { color: errorTextColor }]}>
              Please check your internet connection and try again.
            </Text>
          </View>
        ) : (
          <>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[{ marginTop: 10, fontSize: 16 }, { color: loadingTextColor }]}>
                  Loading TrackNBook...
                </Text>
              </View>
            )}
            <iframe
              src={webAppUrl}
              style={iframeStyle}
              onLoad={handleLoad}
              onError={handleError}
              title="Track n Book"
              allow="camera; microphone; geolocation"
            />
          </>
        )}
      </View>
    </>
  );
}
