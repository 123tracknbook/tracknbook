
import { WebView } from "react-native-webview";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";

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

// JS injected after page loads — tag inputs for autofill
const injectedJavaScript = `
(function() {
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
  var observer = new MutationObserver(tagInputs);
  observer.observe(document.body, { childList: true, subtree: true });
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
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    console.log('[HomeScreen] mounted (iOS) - WebView URL:', webAppUrl);
  }, []);

  const handleMessage = (event: any) => {
    const raw = event.nativeEvent.data;
    console.log('[HomeScreen] onMessage received (iOS) raw:', raw);
    try {
      const data = JSON.parse(raw);
      console.log('[HomeScreen] onMessage parsed (iOS) type:', data.type, data.url ? '| url: ' + data.url : '');
      if (data.type === 'INTERCEPT_URL' || data.type === 'OPEN_PAYWALL') {
        console.log('[HomeScreen] Paywall trigger (iOS) — calling router.push("/paywall")');
        router.push('/paywall');
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

  const handleLoadEnd = () => {
    console.log('[HomeScreen] WebView load ended (iOS)');
    setLoading(false);
    setError(null);
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
