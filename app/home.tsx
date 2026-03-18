
import React, { useState, useRef, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";

// Injected into the WebView on every page load.
// Intercepts clicks on Apple Sign In buttons ONLY and posts a message to native.
// Does NOT override window.open — that caused the black screen.
const injectedJavaScript = `
  (function() {
    if (window.__nativeAppleInterceptInstalled) return;
    window.__nativeAppleInterceptInstalled = true;

    function isAppleButton(el) {
      if (!el) return false;
      var text = (el.innerText || el.textContent || '').toLowerCase().trim();
      var aria = (el.getAttribute('aria-label') || '').toLowerCase();
      var cls = (el.className || '').toLowerCase();
      var id = (el.id || '').toLowerCase();
      return (
        text === 'continue with apple' ||
        text === 'sign in with apple' ||
        text === 'sign up with apple' ||
        aria.includes('sign in with apple') ||
        aria.includes('continue with apple') ||
        cls.includes('apple-signin') ||
        cls.includes('apple-auth') ||
        id.includes('apple-signin') ||
        id.includes('apple-auth')
      );
    }

    document.addEventListener('click', function(e) {
      var el = e.target;
      for (var i = 0; i < 6; i++) {
        if (!el || el === document.body) break;
        if (isAppleButton(el)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'APPLE_SIGN_IN' }));
          return;
        }
        el = el.parentElement;
      }
    }, true);

    // Also check for pending credential on mount (in case event fired before listener)
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

  const webAppUrl = "https://www.tracknbook.app";

  const triggerNativeAppleSignIn = useCallback(async () => {
    if (appleSignInInProgress.current) return;
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) return;
      appleSignInInProgress.current = true;
      console.log('[HomeScreen] Native Apple Sign In triggered');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('[HomeScreen] Apple Sign In succeeded, passing credential back to WebView');

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
      } else {
        console.log('[HomeScreen] Apple Sign In cancelled by user');
      }
    } finally {
      appleSignInInProgress.current = false;
    }
  }, []);

  const handleMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'APPLE_SIGN_IN' && Platform.OS === 'ios') {
        console.log('[HomeScreen] APPLE_SIGN_IN message received from WebView');
        await triggerNativeAppleSignIn();
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [triggerNativeAppleSignIn]);

  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    const url = request.url || '';
    console.log('[HomeScreen] WebView loading request:', url);
    // Block navigation to Apple OAuth pages and trigger native flow instead
    if (
      url.includes('appleid.apple.com') ||
      url.includes('idmsa.apple.com')
    ) {
      console.log('[HomeScreen] Blocking Apple OAuth navigation, triggering native sign in:', url);
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
      <View style={[styles.container, { backgroundColor: '#000' }]}>
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
            onLoadStart={() => { console.log('[HomeScreen] WebView started loading'); setLoading(true); }}
            onLoadEnd={() => { console.log('[HomeScreen] WebView finished loading'); setLoading(false); setError(null); }}
            onError={(e) => {
              const msg = e.nativeEvent.description || e.nativeEvent.code || 'Unknown error';
              console.error('[HomeScreen] WebView error:', msg);
              setError(`Failed to load: ${msg}`);
              setLoading(false);
            }}
            onHttpError={() => setLoading(false)}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onMessage={handleMessage}
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
            setSupportMultipleWindows={true}
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
