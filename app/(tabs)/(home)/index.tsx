
import { WebView } from "react-native-webview";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, View, ActivityIndicator, Platform, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Purchases from "react-native-purchases";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import { webViewRef, pendingWebViewUrl, setPendingWebViewUrl, setCurrentRcUserId } from "./webViewRef";

const webAppUrl = "https://www.tracknbook.app";

// JS injected before page content loads — intercepts SPA navigation to /plans
const injectedJavaScriptBeforeContentLoaded = `
(function() {
  console.log('[WebView-JS] injectedJavaScriptBeforeContentLoaded running');

  function checkAndPostPlans(url) {
    if (url && url.includes('/plans')) {
      console.log('[WebView-JS] /plans URL detected, posting INTERCEPT_URL message:', url);
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'INTERCEPT_URL', url: url }));
      } catch(e) {
        console.log('[WebView-JS] postMessage failed:', e);
      }
    }
  }

  function checkUrl(url) {
    checkAndPostPlans(url);
  }

  // Patch history API for SPA navigation
  var _origPushState = history.pushState;
  var _origReplaceState = history.replaceState;

  history.pushState = function() {
    _origPushState.apply(this, arguments);
    console.log('[WebView-JS] history.pushState called, new URL:', window.location.href);
    checkUrl(window.location.href);
  };

  history.replaceState = function() {
    _origReplaceState.apply(this, arguments);
    console.log('[WebView-JS] history.replaceState called, new URL:', window.location.href);
    checkUrl(window.location.href);
  };

  window.addEventListener('popstate', function() {
    console.log('[WebView-JS] popstate fired, URL:', window.location.href);
    checkUrl(window.location.href);
  });

  // Polling fallback every 500ms for frameworks that bypass history API
  var _lastUrl = window.location.href;
  setInterval(function() {
    var currentUrl = window.location.href;
    if (currentUrl !== _lastUrl) {
      console.log('[WebView-JS] URL changed (poll):', _lastUrl, '->', currentUrl);
      _lastUrl = currentUrl;
      checkUrl(currentUrl);
    }
  }, 500);

  // Intercept "Change Plan" / "Upgrade" / "Subscribe" button clicks
  function interceptPlanButtons() {
    var elements = document.querySelectorAll('a[href*="/plans"], a[href*="plan"], button');
    elements.forEach(function(el) {
      var text = (el.textContent || '').trim().toLowerCase();
      var href = el.getAttribute('href') || '';
      var isPlansLink = href.includes('/plans');
      var isPlanButton = text.includes('change plan') || text.includes('upgrade') || text.includes('get pro') || text.includes('subscribe');
      if ((isPlansLink || isPlanButton) && !el.dataset.nativeIntercepted) {
        el.dataset.nativeIntercepted = 'true';
        console.log('[WebView-JS] Intercepting button/link:', text || href);

        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[WebView-JS] Button clicked (plan / subscribe), posting INTERCEPT_URL | text:', text, '| href:', href);
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'INTERCEPT_URL', url: href }));
          } catch(err) {
            console.log('[WebView-JS] postMessage failed on click:', err);
          }
        }, true);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    console.log('[WebView-JS] DOMContentLoaded — running interceptPlanButtons');
    interceptPlanButtons();
    var observer = new MutationObserver(function() { interceptPlanButtons(); });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  if (document.readyState !== 'loading') {
    console.log('[WebView-JS] DOM already ready — running interceptPlanButtons immediately');
    interceptPlanButtons();
  }

  // Check current URL immediately in case we loaded directly on /plans
  checkUrl(window.location.href);
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
  // Extracts user.id from the Supabase localStorage token.
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

export default function HomeScreen() {
  console.log('[HomeScreen] rendering - Platform:', Platform.OS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const router = useRouter();
  // Track the last RevenueCat-logged userId so we don't call logIn redundantly
  // across WebView reloads within the same native session.
  const rcLoggedUserIdRef = useRef<string | null>(null);
  // Ensures push permission is requested exactly once, the first time /calendar is visited.
  const pushPermissionAskedRef = useRef(false);

  useEffect(() => {
    console.log('[HomeScreen] mounted - WebView URL:', webAppUrl);
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

  const handleMessage = async (event: any) => {
    const raw = event.nativeEvent.data;
    console.log('[HomeScreen] onMessage received raw:', raw);
    try {
      const data = JSON.parse(raw);
      console.log('[HomeScreen] onMessage parsed type:', data.type, data.url ? '| url: ' + data.url : '');
      if (data.type === 'DEBUG_STORAGE' || data.type === 'DEBUG_STORAGE_ERROR') {
        console.log('[Auth Debug]', JSON.stringify(data, null, 2));
        return;
      }
      if (data.type === 'INTERCEPT_URL') {
        console.log('[HomeScreen] INTERCEPT_URL — pushing subscriptions paywall');
        router.push('/paywall?offeringId=subscriptions');
        return;
      }
      if (data.type === 'REVENUECAT_LOGIN') {
        console.log('[HomeScreen] REVENUECAT_LOGIN received — userId:', data.userId);
        if (data.userId) {
          if (rcLoggedUserIdRef.current === data.userId) {
            console.log('[HomeScreen] REVENUECAT_LOGIN — skipping Purchases.logIn, already logged in as:', data.userId);
          } else {
            try {
              const result = await Purchases.logIn(data.userId);
              rcLoggedUserIdRef.current = data.userId;
              setCurrentRcUserId(data.userId);
              console.log('[RevenueCat] logIn (REVENUECAT_LOGIN) succeeded, created:', result.created, '| userId:', data.userId);
            } catch (e) {
              console.warn('[RevenueCat] logIn (REVENUECAT_LOGIN) failed (non-fatal):', e);
            }
          }
        }
        return;
      }
      if (data.type === 'AUTH_SIGNED_IN' && data.userId) {
        if (rcLoggedUserIdRef.current === data.userId) {
          console.log('[HomeScreen] AUTH_SIGNED_IN — skipping Purchases.logIn, already logged in as:', data.userId);
          return;
        }
        console.log('[HomeScreen] AUTH_SIGNED_IN — calling Purchases.logIn with userId:', data.userId);
        try {
          const result = await Purchases.logIn(data.userId);
          rcLoggedUserIdRef.current = data.userId;
          setCurrentRcUserId(data.userId);
          console.log('[RevenueCat] logIn succeeded, created:', result.created, '| userId:', data.userId);
        } catch (e) {
          console.warn('[RevenueCat] logIn failed (non-fatal):', e);
        }
        return;
      }
      if (data.type === 'AUTH_SIGNED_OUT' || data.type === 'SIGN_OUT') {
        console.log('[HomeScreen]', data.type, '— calling Purchases.logOut');
        try {
          await Purchases.logOut();
          rcLoggedUserIdRef.current = null;
          setCurrentRcUserId(null);
          console.log('[RevenueCat] logOut succeeded');
        } catch (e) {
          console.warn('[RevenueCat] logOut failed (non-fatal):', e);
        }
        return;
      }
    } catch (e) {
      console.log('[HomeScreen] onMessage JSON parse failed, raw was:', raw);
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log('[HomeScreen] onShouldStartLoadWithRequest:', url);
    if (url.includes('/plans')) {
      console.log('[HomeScreen] /plans URL intercepted via onShouldStartLoadWithRequest — pushing subscriptions paywall');
      router.push('/paywall?offeringId=subscriptions');
      return false;
    }
    if (url.includes('/calendar') && !pushPermissionAskedRef.current) {
      pushPermissionAskedRef.current = true;
      console.log('[HomeScreen] /calendar URL detected — requesting push permissions for the first time');
      registerForPushNotificationsAsync()
        .then((token) => {
          console.log('[HomeScreen] Push registration complete, token:', token ?? 'none');
        })
        .catch((err) => {
          console.warn('[HomeScreen] Push registration error:', err);
        });
    }
    return true;
  };

  const handleLoadStart = () => {
    console.log('[HomeScreen] WebView load started');
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = async () => {
    console.log('[HomeScreen] WebView load ended');
    setLoading(false);
    setError(null);
    // Inject any pending URL immediately — the web app handles polling via ?purchase=1.
    if (pendingWebViewUrl) {
      const url = pendingWebViewUrl;
      console.log('[HomeScreen] onLoadEnd — pendingWebViewUrl detected:', url, '— injecting immediately');
      setPendingWebViewUrl(null);
      webViewRef.current?.injectJavaScript(`window.location.href = '${url}'; true;`);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[HomeScreen] WebView error:', JSON.stringify(nativeEvent, null, 2));
    const errorMessage = nativeEvent.description || nativeEvent.code || 'Unknown error';
    setError(`Failed to load: ${errorMessage}`);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[HomeScreen] WebView HTTP error:', nativeEvent.statusCode, nativeEvent.url);
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
            ref={webViewRef as React.RefObject<WebView>}
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
