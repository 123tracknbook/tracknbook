
import { WebView } from "react-native-webview";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, View, Platform, Text, Linking } from "react-native";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import {
  registerForPushNotificationsAsync,
  addNotificationResponseReceivedListener,
} from "@/utils/notifications";
import { webViewRef, pendingWebViewUrl, setPendingWebViewUrl } from "@/utils/webViewRef";
import * as Clipboard from 'expo-clipboard';

const webAppUrl = "https://www.tracknbook.app";

// JS injected before page content loads — tags inputs for autofill
const injectedJavaScriptBeforeContentLoaded = `
(function() {
  console.log('[WebView-JS] injectedJavaScriptBeforeContentLoaded running');
})();
true;
`;

// JS injected after page loads — tag inputs for autofill + Supabase auth bridge
// NOTE: debugStorageDump is intentionally removed (was noisy, ran every 2s).
// Auth state polling via localStorage is kept as the reliable fallback.
const injectedJavaScript = `
(function() {
  // --- Input autofill tagging ---
  function tagInputs() {
    var emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email" i]');
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
  var _inputObserver = new MutationObserver(tagInputs);
  _inputObserver.observe(document.body, { childList: true, subtree: true });

  // --- Supabase auth bridge ---
  // Extracts user.id from the Supabase localStorage token.
  // Token shape: { access_token, refresh_token, user: { id } }
  // or sometimes: { session: { user: { id } } }

  function getSupabaseUserId() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          var raw = localStorage.getItem(key);
          if (!raw) continue;
          var parsed = JSON.parse(raw);
          // Shape 1: { user: { id } }
          if (parsed && parsed.user && parsed.user.id) {
            return parsed.user.id;
          }
          // Shape 2: { session: { user: { id } } }
          if (parsed && parsed.session && parsed.session.user && parsed.session.user.id) {
            return parsed.session.user.id;
          }
        }
      }
    } catch(e) {
      console.log('[WebView-JS] getSupabaseUserId error:', e);
    }
    return null;
  }

  var _lastAuthUserId = null;

  function checkAuthState() {
    var userId = getSupabaseUserId();
    if (userId !== _lastAuthUserId) {
      console.log('[WebView-JS] Auth state changed — prev:', _lastAuthUserId, '| next:', userId);
      try {
        if (userId) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTH_SIGNED_IN', userId: userId }));
        } else if (_lastAuthUserId) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTH_SIGNED_OUT' }));
        }
      } catch(e) {}
      _lastAuthUserId = userId;
    }
  }

  // 1. Hook window.supabase.auth.onAuthStateChange if the app exposes the client
  (function trySupabaseHook() {
    try {
      var sb = window.supabase || window.__supabase || null;
      if (sb && sb.auth && typeof sb.auth.onAuthStateChange === 'function') {
        console.log('[WebView-JS] Hooking window.supabase.auth.onAuthStateChange');
        sb.auth.onAuthStateChange(function(event, session) {
          console.log('[WebView-JS] onAuthStateChange event:', event, '| userId:', session && session.user ? session.user.id : 'none');
          try {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session && session.user && session.user.id) {
              _lastAuthUserId = session.user.id;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTH_SIGNED_IN', userId: session.user.id }));
            } else if (event === 'SIGNED_OUT') {
              _lastAuthUserId = null;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTH_SIGNED_OUT' }));
            }
          } catch(e) {}
        });
        return;
      }
    } catch(e) {}
    // Supabase client not yet available — will rely on localStorage polling below
    console.log('[WebView-JS] window.supabase not found, falling back to localStorage polling');
  })();

  // 2. Poll localStorage every 500ms as a reliable fallback
  // (covers cases where the Supabase client is not exposed on window)
  setInterval(checkAuthState, 500);

  // Run once immediately in case user is already signed in
  checkAuthState();
})();
true;
`;

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
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
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
    opacity: 0.7,
  },
});

// Stable WebView source — defined outside component so the prop reference never changes.
const webViewSource = { uri: webAppUrl };

export default function HomeScreen() {
  console.log('[HomeScreen] rendering - Platform:', Platform.OS);
  const router = useRouter();
  const splashHiddenRef = useRef(false);
  const webViewReadyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  // Ensures push permission is requested exactly once per sign-in event.
  const pushPermissionAskedRef = useRef(false);

  useEffect(() => {
    console.log('[HomeScreen] mounted - WebView URL:', webAppUrl);

    // Forward notification-tap events to the WebView so the web app can deep-link.
    // We wait until the WebView is ready (onLoadEnd) before injecting.
    const responseListener = addNotificationResponseReceivedListener((response) => {
      const notifData = response.notification.request.content.data;
      console.log('[HomeScreen] Notification response received, forwarding to WebView:', JSON.stringify(notifData));
      const js = `window.onNotificationResponse && window.onNotificationResponse(${JSON.stringify(notifData)}); true;`;
      if (webViewReadyRef.current) {
        webViewRef.current?.injectJavaScript(js);
      } else {
        // WebView not ready yet — retry once it loads
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(js);
        }, 1000);
      }
    });

    return () => {
      responseListener.remove();
    };
  }, []);

  // When the home screen comes into focus (e.g. after returning from paywall),
  // inject the pending URL immediately — the web app handles polling via ?purchase=1.
  useFocusEffect(
    useCallback(() => {
      if (pendingWebViewUrl) {
        const url = pendingWebViewUrl;
        console.log('[HomeScreen] useFocusEffect — pendingWebViewUrl detected:', url, '— injecting immediately');
        setPendingWebViewUrl(null);
        webViewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`);
      }
    }, [])
  );

  // Helper: post a PUSH_TOKEN message back to the WebView (spec-compliant format)
  const sendPushTokenToWebView = useCallback((token: string | null | undefined) => {
    const tokenValue = token ?? null;
    console.log('[HomeScreen] sendPushTokenToWebView — token:', tokenValue);
    const js = `window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PUSH_TOKEN', token: ${JSON.stringify(tokenValue)} })); true;`;
    webViewRef.current?.injectJavaScript(js);
  }, []);

  const handleMessage = useCallback(async (event: any) => {
    const raw = event.nativeEvent.data;
    console.log('[HomeScreen] onMessage received raw:', raw);
    try {
      const data = JSON.parse(raw);
      console.log('[HomeScreen] onMessage parsed type:', data.type, data.url ? '| url: ' + data.url : '');

      // Silently drop debug storage dumps — no longer logged to reduce noise
      if (data.type === 'DEBUG_STORAGE' || data.type === 'DEBUG_STORAGE_ERROR') {
        return;
      }

      if (data.type === 'AUTH_SIGNED_IN' && data.userId) {
        console.log('[HomeScreen] AUTH_SIGNED_IN — userId:', data.userId);
        // Register for push notifications on sign-in and send token back to WebView
        if (!pushPermissionAskedRef.current) {
          pushPermissionAskedRef.current = true;
          try {
            const token = await registerForPushNotificationsAsync();
            sendPushTokenToWebView(token);
          } catch (err) {
            console.error('[HomeScreen] Push registration error on AUTH_SIGNED_IN:', err);
            sendPushTokenToWebView(null);
          }
        }
        return;
      }

      if (data.type === 'REGISTER_PUSH_NOTIFICATIONS') {
        console.log('[HomeScreen] REGISTER_PUSH_NOTIFICATIONS received — registering and fetching token');
        try {
          const token = await registerForPushNotificationsAsync();
          console.log('[HomeScreen] REGISTER_PUSH_NOTIFICATIONS token:', token);
          sendPushTokenToWebView(token);
        } catch (e) {
          console.warn('[HomeScreen] REGISTER_PUSH_NOTIFICATIONS error:', e);
          sendPushTokenToWebView(null);
        }
        return;
      }

      if (data.type === 'READ_CLIPBOARD') {
        console.log('[HomeScreen] READ_CLIPBOARD received — reading clipboard');
        try {
          const text = await Clipboard.getStringAsync();
          console.log('[HomeScreen] READ_CLIPBOARD success, text length:', text.length);
          webViewRef.current?.injectJavaScript(`window.postMessage({ type: 'CLIPBOARD_RESULT', text: ${JSON.stringify(text)} }, '*'); true;`);
        } catch (e) {
          console.warn('[HomeScreen] READ_CLIPBOARD failed:', e);
          webViewRef.current?.injectJavaScript(`window.postMessage({ type: 'CLIPBOARD_ERROR', message: 'Failed to read clipboard' }, '*'); true;`);
        }
        return;
      }

      if (data.type === 'OPEN_PAYWALL') {
        console.log('[HomeScreen] OPEN_PAYWALL received — navigating to paywall');
        router.push('/paywall');
        return;
      }

      if (data.type === 'AUTH_SIGNED_OUT' || data.type === 'SIGN_OUT') {
        console.log('[HomeScreen]', data.type, '— user signed out');
        // Reset push permission flag so next sign-in re-registers
        pushPermissionAskedRef.current = false;
        return;
      }
    } catch (e) {
      console.log('[HomeScreen] onMessage JSON parse failed, raw was:', raw);
    }
  }, [router, sendPushTokenToWebView]);

  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    const url = request.url;
    console.log('[HomeScreen] onShouldStartLoadWithRequest:', url);
    // Hand off non-http(s) schemes to the OS instead of letting the WebView load them
    // (avoids NSURLErrorDomain -1002 for mailto:, tel:, sms:, facetime:, etc.)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.log('[HomeScreen] Non-http(s) scheme detected, opening externally via Linking:', url);
      Linking.openURL(url).catch(e =>
        console.warn('[HomeScreen] Linking.openURL failed for:', url, e)
      );
      return false;
    }
    return true;
  }, []);

  const hideSplash = useCallback(() => {
    if (!splashHiddenRef.current) {
      splashHiddenRef.current = true;
      console.log('[HomeScreen] Hiding splash screen');
      SplashScreen.hideAsync().catch(e => console.warn('[HomeScreen] SplashScreen.hideAsync error:', e));
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    console.log('[HomeScreen] WebView load started');
    setError(null);
  }, []);

  const handleLoadEnd = useCallback(() => {
    console.log('[HomeScreen] WebView load ended');
    webViewReadyRef.current = true;
    hideSplash();
    setError(null);
    // Inject any pending URL — deferred to next tick so the page is fully interactive
    if (pendingWebViewUrl) {
      const url = pendingWebViewUrl;
      console.log('[HomeScreen] onLoadEnd — pendingWebViewUrl detected:', url, '— injecting immediately');
      setPendingWebViewUrl(null);
      webViewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`);
    }
  }, [hideSplash]);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    // Ignore unsupported URL scheme errors (we handle these via onShouldStartLoadWithRequest)
    if (nativeEvent.code === -1002) return;
    console.warn('WebView error:', nativeEvent);
    const errorMessage = nativeEvent.description || nativeEvent.code || 'Unknown error';
    setError(`Failed to load: ${errorMessage}`);
    hideSplash();
  }, [hideSplash]);

  const handleHttpError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[HomeScreen] WebView HTTP error:', nativeEvent.statusCode, nativeEvent.url);
    hideSplash();
  }, [hideSplash]);

  const errorTextColor = colors.text;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: errorTextColor }]}>
            Connection Error
          </Text>
          <Text style={[styles.errorText, { color: errorTextColor }]}>
            {error}
          </Text>
          <Text style={[styles.errorHint, { color: errorTextColor }]}>
            Please check your internet connection and try again.
          </Text>
        </View>
      ) : (
        <>
          <WebView
            ref={webViewRef as React.RefObject<WebView>}
            source={webViewSource}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleHttpError}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onMessage={handleMessage}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
            injectedJavaScript={injectedJavaScript}
            startInLoadingState={false}
            originWhitelist={['*']}
            cacheEnabled={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            allowsFullscreenVideo={true}
            allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
            geolocationEnabled={true}
            style={styles.container}
            setSupportMultipleWindows={false}
            autoManageStatusBarEnabled={false}
            textZoom={100}
            dataDetectorTypes={'none'}
            contentMode="mobile"
          />
        </>
      )}
    </View>
  );
}
