import React, { useState, useRef, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";

const injectedJavaScript = `
  (function() {
    if (window.__nativeAppleInterceptInstalled) return;
    window.__nativeAppleInterceptInstalled = true;

    // Override window.open — intercept ALL popups and report them
    var _orig = window.open;
    window.open = function(url, target, features) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WINDOW_OPEN', url: (url || '') }));
      }
      return { closed: false, close: function(){}, focus: function(){}, postMessage: function(){}, location: { href: '' } };
    };

    // Replay pending credential
    if (window.__pendingNativeAppleSignIn) {
      var detail = window.__pendingNativeAppleSignIn;
      window.__pendingNativeAppleSignIn = null;
      window.dispatchEvent(new CustomEvent('nativeAppleSignIn', { detail: detail }));
    }

    true;
  })();
`;

export default function HomeScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const appleSignInInProgress = useRef(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const webAppUrl = "https://www.tracknbook.app";

  const clearLoading = useCallback(() => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => setLoading(false), 300);
  }, []);

  const triggerNativeAppleSignIn = useCallback(async () => {
    if (appleSignInInProgress.current) return;
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) return;
      appleSignInInProgress.current = true;

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const detail = {
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      };

      const js = `
        (function() {
          var detail = ${JSON.stringify(detail)};
          window.__pendingNativeAppleSignIn = detail;
          window.dispatchEvent(new CustomEvent('nativeAppleSignIn', { detail: detail }));
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    } catch (err: any) {
      if (err.code !== 'ERR_CANCELED') {
        console.error('[HomeScreen] Apple Sign In error:', err);
      }
      clearLoading();
    } finally {
      appleSignInInProgress.current = false;
    }
  }, [clearLoading]);

  const handleMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[HomeScreen] WebView message:', JSON.stringify(data));
      if (Platform.OS === 'ios') {
        if (data.type === 'APPLE_SIGN_IN' || data.type === 'WINDOW_OPEN') {
          await triggerNativeAppleSignIn();
        }
      }
    } catch (e) {}
  }, [triggerNativeAppleSignIn]);

  // onOpenWindow fires when the WebView tries to open a new window (target="_blank", window.open, etc.)
  // This is the most reliable intercept point — fires before any black screen appears
  const handleOpenWindow = useCallback((syntheticEvent: any) => {
    const url = syntheticEvent?.nativeEvent?.targetUrl || '';
    console.log('[HomeScreen] onOpenWindow fired, url:', url);
    if (Platform.OS === 'ios') {
      triggerNativeAppleSignIn();
    }
  }, [triggerNativeAppleSignIn]);

  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    const url = (request.url || '').toLowerCase();
    if (url.includes('appleid.apple.com') || url.includes('idmsa.apple.com')) {
      console.log('[HomeScreen] Blocked Apple OAuth main-frame navigation');
      if (Platform.OS === 'ios') {
        setTimeout(() => triggerNativeAppleSignIn(), 0);
      }
      return false;
    }
    return true;
  }, [triggerNativeAppleSignIn]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Connection Error</Text>
            <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
            <Text style={[styles.errorHint, { color: theme.colors.text, opacity: 0.7 }]}>
              Please check your internet connection and try again.
            </Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: webAppUrl }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => clearLoading()}
            onError={(e) => {
              const msg = e.nativeEvent.description || e.nativeEvent.code || 'Unknown error';
              setError(`Failed to load: ${msg}`);
              setLoading(false);
            }}
            onHttpError={() => clearLoading()}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onOpenWindow={handleOpenWindow}
            injectedJavaScript={injectedJavaScript}
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
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
  loadingContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#000',
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#fff' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: 8 },
  errorHint: { fontSize: 14, textAlign: 'center', marginTop: 8 },
});
