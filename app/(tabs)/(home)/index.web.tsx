
import { Stack } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { useTheme } from "@react-navigation/native";

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
    backgroundColor: '#ffffff',
  },
  iframe: {
    flex: 1,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    console.log('Web app loaded successfully');
    setIsLoading(false);
  };

  const handleError = () => {
    console.error('Failed to load web app:', webAppUrl);
    setError('Failed to load the web application');
    setIsLoading(false);
  };

  const errorDisplay = error ? error : '';

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
            <Text style={styles.errorText}>{errorDisplay}</Text>
            <Text style={styles.errorSubtext}>
              Please check your internet connection or try again later.
            </Text>
          </View>
        ) : (
          <>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            )}
            <iframe
              src={webAppUrl}
              style={styles.iframe}
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
