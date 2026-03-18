
import React, { useState, useRef, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";

// Injected JS: dispatch pending credential on mount, nothing else
const injectedJavaScript = `
  (function() {
    if (window.__nativeAppleInterceptInstalled) return;
    window.__nativeAppleInterceptInstalled = true;
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
  const [showAppleButton, setShowAppleButton] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const appleSignInInProgress = useRef(false);

  const webAppUrl = "https://www.tracknbook.app";

  const triggerNativeAppleSignIn = useCallback(async () => {
    if (appleSignInInProgress.current) return;
    console.log('[HomeScreen] Native Apple Sign In button pressed');
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
      console.log('[HomeScreen] Message from WebView:', data.type);
      if (data.type === 'SHOW_APPLE_BUTTON' && Platform.OS === 'ios') {
        setShowAppleButton(true);
      } else if (data.type === 'HIDE_APPLE_BUTTON') {
        setShowAppleButton(false);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

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
            onLoadStart={() => { console.log('[HomeScreen] WebView started loading'); setLoading(true); }}
            onLoadEnd={() => { console.log('[HomeScreen] WebView finished loading'); setLoading(false); setError(null); }}
            onError={(e) => {
              const msg = e.nativeEvent.description || e.nativeEvent.code || 'Unknown error';
              console.error('[HomeScreen] WebView error:', msg);
              setError(`Failed to load: ${msg}`);
              setLoading(false);
            }}
            onHttpError={() => setLoading(false)}
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
            setSupportMultipleWindows={false}
          />
        )}

        {/* Native Apple Sign-In button overlay — shown when web app requests it */}
        {Platform.OS === 'ios' && showAppleButton && !error && (
          <View style={styles.appleButtonContainer}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={styles.appleButton}
              onPress={triggerNativeAppleSignIn}
            />
          </View>
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
  appleButtonContainer: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 50,
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
