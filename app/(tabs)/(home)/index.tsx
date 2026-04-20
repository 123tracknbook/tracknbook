
import { WebView } from "react-native-webview";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, View, Platform, Text, Linking, Image, Animated } from "react-native";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addNotificationResponseReceivedListener,
} from "@/utils/notifications";
import { webViewRef, pendingWebViewUrl, setPendingWebViewUrl } from "@/utils/webViewRef";
import * as Clipboard from 'expo-clipboard';

SplashScreen.preventAutoHideAsync();

const PUSH_TOKEN_STORAGE_KEY = '@push_token';

/**
 * Request notification permissions and fetch the Expo push token.
 * - Skips on web (unsupported) and simulators (no APNs/FCM registration).
 * - Requests permissions before attempting to fetch the token.
 * - Uses the EAS projectId from app.json → extra.eas.projectId via expo-constants.
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  console.log('[registerForPushNotificationsAsync] starting');

  if (Platform.OS === 'web') {
    console.log('[registerForPushNotificationsAsync] web platform — skipping');
    return null;
  }

  // Android: ensure a notification channel exists before requesting permissions
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('[registerForPushNotificationsAsync] Android notification channel set');
    } catch (e) {
      console.warn('[registerForPushNotificationsAsync] Android channel creation failed (non-fatal):', e);
    }
  }

  // Step 1: request permissions
  let finalStatus: string;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    console.log('[registerForPushNotificationsAsync] existing permission status:', existing);
    if (existing === 'granted') {
      finalStatus = existing;
    } else {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      console.log('[registerForPushNotificationsAsync] permission request result:', requested);
      finalStatus = requested;
    }
  } catch (e) {
    console.error('[registerForPushNotificationsAsync] permission check/request failed:', e);
    return null;
  }

  if (finalStatus !== 'granted') {
    console.warn('[registerForPushNotificationsAsync] permission not granted — cannot fetch token');
    return null;
  }

  // Step 2: fetch token — only possible on a physical device
  if (!Device.isDevice) {
    console.warn('[registerForPushNotificationsAsync] simulator detected — push token unavailable');
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn('[registerForPushNotificationsAsync] EAS projectId not found in app config');
    } else {
      console.log('[registerForPushNotificationsAsync] using projectId:', projectId);
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });
    console.log('[registerForPushNotificationsAsync] token obtained:', token);

    // Cache the token in AsyncStorage for fast injection on next app open
    try {
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      console.log('[registerForPushNotificationsAsync] token cached in AsyncStorage');
    } catch (storageErr) {
      console.warn('[registerForPushNotificationsAsync] failed to cache token:', storageErr);
    }

    return token;
  } catch (e) {
    console.error('[registerForPushNotificationsAsync] failed to get Expo push token:', e);
    return null;
  }
}

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

  // 2. Poll localStorage every 1000ms as a reliable fallback
  // (covers cases where the Supabase client is not exposed on window)
  setInterval(checkAuthState, 1000);

  // Run once immediately in case user is already signed in
  checkAuthState();
})();
true;
`;

// Logo asset — resolved once at module level
const logoSource = require('../../../assets/images/c994c889-170f-4fe5-a60b-b4b3e4f6b18d.png');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Skeleton overlay — covers the WebView while it loads
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a1f2e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  skeletonLogo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  // Error overlay — rendered on top of the WebView (absolute) so WebView stays mounted
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0a1f2e',
    zIndex: 20,
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

// Android-only cache mode prop — served from disk before hitting network
const androidCacheProps = Platform.OS === 'android' ? { cacheMode: 'LOAD_CACHE_ELSE_NETWORK' as const } : {};

export default function HomeScreen() {
  console.log('[HomeScreen] rendering - Platform:', Platform.OS);
  const router = useRouter();
  const splashHiddenRef = useRef(false);
  const webViewReadyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  // Ensures push permission is requested exactly once per sign-in event.
  const pushPermissionAskedRef = useRef(false);

  // Skeleton state — shown instantly, faded out on loadEnd
  const [skeletonMounted, setSkeletonMounted] = useState(true);
  const skeletonOpacity = useRef(new Animated.Value(1)).current;

  // Pulse animation for the logo while skeleton is visible
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const hideSplash = useCallback(() => {
    if (!splashHiddenRef.current) {
      splashHiddenRef.current = true;
      console.log('[HomeScreen] Hiding splash screen');
      SplashScreen.hideAsync().catch(e => console.warn('[HomeScreen] SplashScreen.hideAsync error:', e));
    }
  }, []);

  // Fade out and unmount the skeleton overlay
  const dismissSkeleton = useCallback(() => {
    Animated.timing(skeletonOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSkeletonMounted(false);
    });
  }, [skeletonOpacity]);

  useEffect(() => {
    console.log('[HomeScreen] mounted - WebView URL:', webAppUrl);

    // Safety timeout — hide splash after 8s in case APP_READY never arrives
    const splashTimeoutId = setTimeout(() => {
      console.log('[HomeScreen] Safety timeout fired — hiding splash screen');
      hideSplash();
    }, 8000);

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
      clearTimeout(splashTimeoutId);
      responseListener.remove();
    };
  }, [hideSplash]);

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

  // Helper: dispatch expoPushToken CustomEvent to the WebView
  const sendPushTokenToWebView = useCallback((token: string | null | undefined) => {
    const tokenValue = token ?? null;
    console.log('[HomeScreen] sendPushTokenToWebView — token:', tokenValue);
    const js = `window.dispatchEvent(new CustomEvent('expoPushToken', { detail: { token: ${JSON.stringify(tokenValue)} } })); true;`;
    webViewRef.current?.injectJavaScript(js);
  }, []);

  const handleMessage = useCallback(async (event: any) => {
    const raw = event.nativeEvent.data;
    console.log('[HomeScreen] onMessage received raw:', raw);
    try {
      const data = JSON.parse(raw);
      console.log('[HomeScreen] onMessage parsed type:', data.type, data.url ? '| url: ' + data.url : '');

      if (data.type === 'APP_READY') {
        console.log('[HomeScreen] APP_READY received — hiding splash screen');
        hideSplash();
        return;
      }

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

      if (data.type === 'GET_PUSH_TOKEN' || data.type === 'REGISTER_PUSH_NOTIFICATIONS') {
        console.log('[HomeScreen]', data.type, 'received — requesting permissions and fetching token');
        try {
          const token = await registerForPushNotificationsAsync();
          console.log('[HomeScreen]', data.type, 'token:', token);
          sendPushTokenToWebView(token);
        } catch (e) {
          console.warn('[HomeScreen]', data.type, 'error:', e);
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

      if (
        data.type === 'readClipboard' ||
        data.name === 'readClipboard' ||
        data.handler === 'readClipboard'
      ) {
        console.log('[HomeScreen] readClipboard handler received — reading clipboard via Clipboard.getStringAsync');
        try {
          const text = await Clipboard.getStringAsync();
          console.log('[HomeScreen] readClipboard success, text length:', text.length);
          webViewRef.current?.injectJavaScript(
            `window.nativelyOnClipboardRead({text: ${JSON.stringify(text)}});true;`
          );
        } catch (e) {
          console.warn('[HomeScreen] readClipboard failed:', e);
          webViewRef.current?.injectJavaScript(
            `window.nativelyOnClipboardRead({text: ""});true;`
          );
        }
        return;
      }

      if (
        data.type === 'OPEN_PAYWALL' ||
        data.type === 'SHOW_PAYWALL' ||
        data.type === 'OPEN_PLANS' ||
        data.type === 'UPGRADE' ||
        data.type === 'CHOOSE_PLAN' ||
        data.type === 'CHANGE_PLAN'
      ) {
        console.log('[HomeScreen] Paywall trigger received type:', data.type, '— navigating to paywall');
        router.push('/paywall');
        return;
      }

      if (data.type === 'AUTH_SIGNED_OUT' || data.type === 'SIGN_OUT') {
        console.log('[HomeScreen]', data.type, '— user signed out');
        // Reset push permission flag so next sign-in re-registers
        pushPermissionAskedRef.current = false;
        return;
      }

      // Debug: log any unhandled message type so we can see what the web app is sending
      console.log('[HomeScreen] UNHANDLED message type:', data.type, '| full data:', JSON.stringify(data));
    } catch (e) {
      console.log('[HomeScreen] onMessage JSON parse failed, raw was:', raw);
    }
  }, [router, sendPushTokenToWebView, hideSplash]);

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

  const handleLoadStart = useCallback(() => {
    console.log('[HomeScreen] WebView load started');
    setError(null);
  }, []);

  const handleLoadEnd = useCallback(() => {
    console.log('[HomeScreen] WebView load ended');
    webViewReadyRef.current = true;
    hideSplash();
    setError(null);
    dismissSkeleton();

    // Inject any pending URL — deferred to next tick so the page is fully interactive
    if (pendingWebViewUrl) {
      const url = pendingWebViewUrl;
      console.log('[HomeScreen] onLoadEnd — pendingWebViewUrl detected:', url, '— injecting immediately');
      setPendingWebViewUrl(null);
      webViewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`);
    }

    // 1. Immediately inject cached token (zero-latency)
    AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY)
      .then((cachedToken) => {
        if (cachedToken) {
          console.log('[HomeScreen] onLoadEnd — injecting cached push token:', cachedToken);
          sendPushTokenToWebView(cachedToken);
        }
      })
      .catch((e) => console.warn('[HomeScreen] onLoadEnd — failed to read cached token:', e));

    // 2. Live fetch in background — update WebView if token changed
    console.log('[HomeScreen] onLoadEnd — background-fetching live push token');
    registerForPushNotificationsAsync()
      .then((liveToken) => {
        console.log('[HomeScreen] onLoadEnd — live push token ready:', liveToken);
        if (liveToken) {
          // registerForPushNotificationsAsync already caches the token
          sendPushTokenToWebView(liveToken);
        }
      })
      .catch((e) => {
        console.warn('[HomeScreen] onLoadEnd — live push token fetch failed:', e);
      });
  }, [hideSplash, dismissSkeleton, sendPushTokenToWebView]);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    // Ignore unsupported URL scheme errors (we handle these via onShouldStartLoadWithRequest)
    if (nativeEvent.code === -1002) return;
    console.warn('WebView error:', nativeEvent);
    const errorMessage = nativeEvent.description || nativeEvent.code || 'Unknown error';
    setError(`Failed to load: ${errorMessage}`);
    hideSplash();
    dismissSkeleton();
  }, [hideSplash, dismissSkeleton]);

  const handleHttpError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[HomeScreen] WebView HTTP error:', nativeEvent.statusCode, nativeEvent.url);
    hideSplash();
  }, [hideSplash]);

  const errorTextColor = colors.text;

  return (
    <View style={[styles.container, { backgroundColor: '#0a1f2e' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* WebView is ALWAYS mounted — never unmounted between tab switches or on error */}
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
        {...androidCacheProps}
      />

      {/* Error overlay — absolute so WebView stays mounted underneath */}
      {error !== null && (
        <View style={styles.errorOverlay}>
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
      )}

      {/* Skeleton overlay — shown instantly, fades out on loadEnd */}
      {skeletonMounted && (
        <Animated.View style={[styles.skeletonOverlay, { opacity: skeletonOpacity }]}>
          <Animated.Image
            source={logoSource}
            style={[styles.skeletonLogo, { opacity: pulseAnim }]}
          />
        </Animated.View>
      )}
    </View>
  );
}
