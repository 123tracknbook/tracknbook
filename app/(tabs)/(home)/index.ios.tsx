
import { WebView } from "react-native-webview";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import Purchases from "react-native-purchases";
import * as Notifications from "expo-notifications";
import { webViewRef, pendingWebViewUrl, setPendingWebViewUrl, setCurrentRcUserId } from "./webViewRef";

const webAppUrl = "https://www.tracknbook.app";

// JS injected before page content loads — intercepts SPA navigation to /plans
const injectedJavaScriptBeforeContentLoaded = `
(function() {
  console.log('[WebView-JS] injectedJavaScriptBeforeContentLoaded running (iOS)');

  function checkAndPostPlans(url) {
    if (url && url.includes('/plans')) {
      console.log('[WebView-JS] /plans URL detected (iOS), posting INTERCEPT_URL:', url);
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'INTERCEPT_URL', url: url }));
      } catch(e) {
        console.log('[WebView-JS] postMessage failed (iOS):', e);
      }
    }
  }

  // Patch history API for SPA navigation
  var _origPushState = history.pushState;
  var _origReplaceState = history.replaceState;

  history.pushState = function() {
    _origPushState.apply(this, arguments);
    console.log('[WebView-JS] history.pushState (iOS), new URL:', window.location.href);
    checkAndPostPlans(window.location.href);
  };

  history.replaceState = function() {
    _origReplaceState.apply(this, arguments);
    console.log('[WebView-JS] history.replaceState (iOS), new URL:', window.location.href);
    checkAndPostPlans(window.location.href);
  };

  window.addEventListener('popstate', function() {
    console.log('[WebView-JS] popstate (iOS), URL:', window.location.href);
    checkAndPostPlans(window.location.href);
  });

  // Polling fallback every 500ms
  var _lastUrl = window.location.href;
  setInterval(function() {
    var currentUrl = window.location.href;
    if (currentUrl !== _lastUrl) {
      console.log('[WebView-JS] URL changed (poll, iOS):', _lastUrl, '->', currentUrl);
      _lastUrl = currentUrl;
      checkAndPostPlans(currentUrl);
    }
  }, 500);

  // Intercept "Change Plan" / "Upgrade" button clicks
  function interceptPlanButtons() {
    var elements = document.querySelectorAll('a[href*="/plans"], a[href*="plan"], button');
    elements.forEach(function(el) {
      var text = (el.textContent || '').trim().toLowerCase();
      var href = el.getAttribute('href') || '';
      var isPlansLink = href.includes('/plans');
      var isPlanButton = text.includes('change plan') || text.includes('upgrade') || text.includes('get pro') || text.includes('subscribe');
      if ((isPlansLink || isPlanButton) && !el.dataset.nativeIntercepted) {
        el.dataset.nativeIntercepted = 'true';
        console.log('[WebView-JS] Intercepting plan button/link (iOS):', text || href);
        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[WebView-JS] Plan button clicked (iOS), posting OPEN_PAYWALL');
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
          } catch(err) {
            console.log('[WebView-JS] postMessage failed on click (iOS):', err);
          }
        }, true);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    console.log('[WebView-JS] DOMContentLoaded (iOS) — running interceptPlanButtons');
    interceptPlanButtons();
    var observer = new MutationObserver(function() { interceptPlanButtons(); });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  if (document.readyState !== 'loading') {
    console.log('[WebView-JS] DOM already ready (iOS) — running interceptPlanButtons immediately');
    interceptPlanButtons();
  }

  // Check current URL immediately in case we loaded directly on /plans
  checkAndPostPlans(window.location.href);
})();
true;
`;

// JS injected after page loads — tag inputs for autofill + Supabase auth bridge
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
  // Token shape: { access_token, refresh_token, user: { id } }
  // or sometimes: { session: { user: { id } } }

  function debugStorageDump() {
    try {
      // 1. localStorage
      var lsKeys = [];
      for (var i = 0; i < localStorage.length; i++) { lsKeys.push(localStorage.key(i)); }

      // 2. sessionStorage
      var ssKeys = [];
      for (var i = 0; i < sessionStorage.length; i++) { ssKeys.push(sessionStorage.key(i)); }

      // 3. cookies
      var cookies = document.cookie;

      // 4. Check if window.supabase exists
      var hasSupabase = !!(window.supabase || window.__supabase || window._supabase);

      // 5. Check for any global variable that might be the supabase client
      var globalKeys = Object.keys(window).filter(function(k) {
        try { return k.toLowerCase().includes('supa') || k.toLowerCase().includes('auth'); } catch(e) { return false; }
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'DEBUG_STORAGE',
        localStorage: lsKeys,
        sessionStorage: ssKeys,
        cookies: cookies.substring(0, 500),
        hasSupabase: hasSupabase,
        supabaseGlobals: globalKeys,
        url: window.location.href
      }));
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DEBUG_STORAGE_ERROR', error: String(e) }));
    }
  }

  debugStorageDump();
  setTimeout(debugStorageDump, 2000);

  function getSupabaseUserId() {
    try {
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
      console.log('[WebView-JS] getSupabaseUserId error (iOS):', e);
    }
    return null;
  }

  var _lastAuthUserId = null;

  function checkAuthState() {
    var userId = getSupabaseUserId();
    if (userId !== _lastAuthUserId) {
      console.log('[WebView-JS] Auth state changed (iOS) — prev:', _lastAuthUserId, '| next:', userId);
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
        console.log('[WebView-JS] Hooking window.supabase.auth.onAuthStateChange (iOS)');
        sb.auth.onAuthStateChange(function(event, session) {
          console.log('[WebView-JS] onAuthStateChange (iOS) event:', event, '| userId:', session && session.user ? session.user.id : 'none');
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
    console.log('[WebView-JS] window.supabase not found (iOS), falling back to localStorage polling');
  })();

  // 2. Poll localStorage every 500ms as a reliable fallback
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

export default function HomeScreen() {
  console.log('[HomeScreen] rendering (iOS)');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const router = useRouter();
  // Track the last RevenueCat-logged userId so we don't call logIn redundantly
  // across WebView reloads within the same native session.
  const rcLoggedUserIdRef = useRef<string | null>(null);
  // Track whether we've already dispatched the push permission result to the WebView
  const pushPermissionInjectedRef = useRef(false);

  useEffect(() => {
    console.log('[HomeScreen] mounted (iOS) - WebView URL:', webAppUrl);
  }, []);

  // Request push notification permissions on mount — completely decoupled from
  // the WebView load cycle so it fires reliably on iOS.
  useEffect(() => {
    let cancelled = false;
    async function requestPushPermissions() {
      console.log('[HomeScreen] requestPushPermissions called (iOS)');
      console.log('[HomeScreen] useEffect push permissions — starting (iOS)');
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('[HomeScreen] useEffect push permissions — current status (iOS):', existingStatus);
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          console.log('[HomeScreen] useEffect push permissions — status not granted, calling requestPermissionsAsync (iOS)');
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
          finalStatus = status;
          console.log('[HomeScreen] useEffect push permissions — requestPermissionsAsync result (iOS):', finalStatus);
        } else {
          console.log('[HomeScreen] useEffect push permissions — already granted (iOS):', existingStatus, '— skipping prompt');
        }
        if (cancelled) {
          console.log('[HomeScreen] useEffect push permissions — component unmounted, skipping WebView inject (iOS)');
          return;
        }
        const resultStatus = finalStatus === 'granted' ? 'granted' : 'denied';
        console.log('[HomeScreen] useEffect push permissions — injecting nativePushPermissionResult into WebView (iOS), status:', resultStatus);
        pushPermissionInjectedRef.current = true;
        webViewRef.current?.injectJavaScript(
          `window.dispatchEvent(new CustomEvent('nativePushPermissionResult', { detail: { status: '${resultStatus}' } })); true;`
        );
      } catch (e) {
        console.warn('[HomeScreen] useEffect push permissions — error (iOS):', e);
      }
    }
    requestPushPermissions();
    return () => { cancelled = true; };
  }, []);

  // When the home screen comes into focus (e.g. after returning from paywall),
  // inject the pending URL immediately — the web app handles polling via ?purchase=1.
  useFocusEffect(
    useCallback(() => {
      if (pendingWebViewUrl) {
        const url = pendingWebViewUrl;
        console.log('[HomeScreen] useFocusEffect (iOS) — pendingWebViewUrl detected:', url, '— injecting immediately');
        setPendingWebViewUrl(null);
        webViewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`);
      }
    }, [])
  );

  const handleMessage = async (event: any) => {
    const raw = event.nativeEvent.data;
    console.log('[HomeScreen] onMessage received (iOS) raw:', raw);
    try {
      const data = JSON.parse(raw);
      console.log('[HomeScreen] onMessage parsed (iOS) type:', data.type, data.url ? '| url: ' + data.url : '');
      if (data.type === 'DEBUG_STORAGE' || data.type === 'DEBUG_STORAGE_ERROR') {
        console.log('[Auth Debug]', JSON.stringify(data, null, 2));
        return;
      }
      if (data.type === 'INTERCEPT_URL' || data.type === 'OPEN_PAYWALL') {
        console.log('[HomeScreen] Paywall trigger (iOS) — calling router.push("/paywall")');
        router.push('/paywall');
        return;
      }
      if (data.type === 'REVENUECAT_LOGIN') {
        console.log('[HomeScreen] REVENUECAT_LOGIN received (iOS) — userId:', data.userId);
        if (data.userId) {
          if (rcLoggedUserIdRef.current === data.userId) {
            console.log('[HomeScreen] REVENUECAT_LOGIN (iOS) — skipping Purchases.logIn, already logged in as:', data.userId);
          } else {
            try {
              const result = await Purchases.logIn(data.userId);
              rcLoggedUserIdRef.current = data.userId;
              setCurrentRcUserId(data.userId);
              console.log('[RevenueCat] logIn (REVENUECAT_LOGIN) succeeded (iOS), created:', result.created, '| userId:', data.userId);
            } catch (e) {
              console.warn('[RevenueCat] logIn (REVENUECAT_LOGIN) failed (non-fatal, iOS):', e);
            }
          }
        }
        return;
      }
      if (data.type === 'AUTH_SIGNED_IN' && data.userId) {
        if (rcLoggedUserIdRef.current === data.userId) {
          console.log('[HomeScreen] AUTH_SIGNED_IN (iOS) — skipping Purchases.logIn, already logged in as:', data.userId);
          return;
        }
        console.log('[HomeScreen] AUTH_SIGNED_IN (iOS) — calling Purchases.logIn with userId:', data.userId);
        try {
          const result = await Purchases.logIn(data.userId);
          rcLoggedUserIdRef.current = data.userId;
          setCurrentRcUserId(data.userId);
          console.log('[RevenueCat] logIn succeeded (iOS), created:', result.created, '| userId:', data.userId);
        } catch (e) {
          console.warn('[RevenueCat] logIn failed (non-fatal, iOS):', e);
        }
        return;
      }
      if (data.type === 'REQUEST_PUSH_PERMISSION') {
        console.log('[HomeScreen] REQUEST_PUSH_PERMISSION received (iOS) — requesting permissions');
        try {
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
          const granted = status === 'granted';
          console.log('[HomeScreen] Push permission result (iOS):', status);
          const resultStatus = granted ? 'granted' : 'denied';
          const js = `window.dispatchEvent(new CustomEvent('nativePushPermissionResult', { detail: { status: '${resultStatus}' } })); true;`;
          webViewRef.current?.injectJavaScript(js);
        } catch (e) {
          console.warn('[HomeScreen] REQUEST_PUSH_PERMISSION error (iOS):', e);
          const js = `window.dispatchEvent(new CustomEvent('nativePushPermissionResult', { detail: { status: 'denied' } })); true;`;
          webViewRef.current?.injectJavaScript(js);
        }
        return;
      }
      if (data.type === 'AUTH_SIGNED_OUT' || data.type === 'SIGN_OUT') {
        console.log('[HomeScreen]', data.type, '(iOS) — calling Purchases.logOut');
        try {
          await Purchases.logOut();
          rcLoggedUserIdRef.current = null;
          setCurrentRcUserId(null);
          console.log('[RevenueCat] logOut succeeded (iOS)');
        } catch (e) {
          console.warn('[RevenueCat] logOut failed (non-fatal, iOS):', e);
        }
        return;
      }
    } catch (e) {
      console.log('[HomeScreen] onMessage JSON parse failed (iOS), raw was:', raw);
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log('[HomeScreen] onShouldStartLoadWithRequest (iOS):', url);
    if (url.includes('/plans')) {
      console.log('[HomeScreen] /plans URL intercepted via onShouldStartLoadWithRequest (iOS) — pushing paywall');
      router.push('/paywall');
      return false;
    }
    return true;
  };

  const handleLoadStart = () => {
    console.log('[HomeScreen] WebView load started (iOS)');
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = async () => {
    console.log('[HomeScreen] WebView load ended (iOS)');
    setLoading(false);
    setError(null);
    // Inject any pending URL immediately — the web app handles polling via ?purchase=1.
    if (pendingWebViewUrl) {
      const url = pendingWebViewUrl;
      console.log('[HomeScreen] onLoadEnd (iOS) — pendingWebViewUrl detected:', url, '— injecting immediately');
      setPendingWebViewUrl(null);
      webViewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`);
    }
    // Re-inject the push permission result on subsequent WebView loads (e.g. SPA navigation,
    // page refresh). The initial request is handled by the useEffect on mount.
    // If the useEffect hasn't fired yet (WebView loaded very fast), skip — it will inject shortly.
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('[HomeScreen] onLoadEnd (iOS) — push permission status:', existingStatus);
      if (existingStatus !== 'undetermined') {
        const resultStatus = existingStatus === 'granted' ? 'granted' : 'denied';
        console.log('[HomeScreen] onLoadEnd (iOS) — re-injecting nativePushPermissionResult into WebView, status:', resultStatus);
        webViewRef.current?.injectJavaScript(
          `window.dispatchEvent(new CustomEvent('nativePushPermissionResult', { detail: { status: '${resultStatus}' } })); true;`
        );
      } else {
        console.log('[HomeScreen] onLoadEnd (iOS) — status still undetermined, useEffect will handle the prompt');
      }
    } catch (e) {
      console.warn('[HomeScreen] onLoadEnd (iOS) — push permission status check error:', e);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[HomeScreen] WebView error (iOS):', JSON.stringify(nativeEvent, null, 2));
    const errorMessage = nativeEvent.description || nativeEvent.code || 'Unknown error';
    setError(`Failed to load: ${errorMessage}`);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[HomeScreen] WebView HTTP error (iOS):', nativeEvent.statusCode, nativeEvent.url);
    setLoading(false);
  };

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
            ref={webViewRef}
            source={{ uri: webAppUrl }}
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
            sharedCookiesEnabled={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            allowsFullscreenVideo={true}
            allowsBackForwardNavigationGestures={true}
            geolocationEnabled={true}
            style={styles.container}
            setSupportMultipleWindows={false}
            autoManageStatusBarEnabled={false}
            textZoom={100}
            dataDetectorTypes={'none'}
            contentMode="mobile"
          />

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5B5BFF" />
              <Text style={styles.loadingText}>
                Loading TrackNBook...
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
