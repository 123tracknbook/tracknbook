import React, { useState, useRef } from "react";
import { StyleSheet, View, ActivityIndicator, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";

export default function HomeScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const webAppUrl = "https://www.tracknbook.app";

  const injectedJavaScript = `
  (function() {
    function tagInputs() {
      var emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email" i], input[placeholder*="Email" i]');
      var passwordInputs = document.querySelectorAll('input[type="password"]');
      emailInputs.forEach(function(el) {
        el.setAttribute('autocomplete', 'username');
        el.setAttribute('name', el.getAttribute('name') || 'username');
      });
      passwordInputs.forEach(function(el) {
        el.setAttribute('autocomplete', 'current-password');
        el.setAttribute('name', el.getAttribute('name') || 'password');
      });
    }
    tagInputs();
    var observer = new MutationObserver(tagInputs);
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  true;
`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
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
            ref={webViewRef}
            source={{ uri: webAppUrl }}
            style={styles.webview}
            onLoadStart={() => {
              console.log('[WebView] Load started:', webAppUrl);
              setLoading(true);
            }}
            onLoadEnd={() => {
              console.log('[WebView] Load ended');
              setLoading(false);
              setError(null);
            }}
            onError={(e) => {
              const msg = e.nativeEvent.description || e.nativeEvent.code || 'Unknown error';
              console.log('[WebView] Error:', msg);
              setError(`Failed to load: ${msg}`);
              setLoading(false);
            }}
            onHttpError={(e) => {
              console.log('[WebView] HTTP error:', e.nativeEvent.statusCode);
              setLoading(false);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={false}
            allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            cacheEnabled={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            originWhitelist={['*']}
            setSupportMultipleWindows={false}
            autoManageStatusBarEnabled={false}
            keyboardDisplayRequiresUserAction={false}
            autoComplete="on"
            contentMode="mobile"
            allowsLinkPreview={false}
            injectedJavaScript={injectedJavaScript}
            dataDetectorTypes={'none'}
            textZoom={100}
          />
        )}
        {loading && !error && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading TrackNBook...</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
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
