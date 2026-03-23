
import { WebView } from "react-native-webview";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, View, ActivityIndicator, Platform, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import React, { useState, useEffect, useRef } from "react";

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
  console.log('[HomeScreen] rendering - Platform:', Platform.OS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    console.log('[HomeScreen] mounted - WebView URL:', webAppUrl);
  }, []);

  const handleMessage = (event: any) => {
    const raw = event.nativeEvent.data;
    console.log('[HomeScreen] onMessage received raw:', raw);
    try {
      const data = JSON.parse(raw);
      console.log('[HomeScreen] onMessage parsed type:', data.type, data.url ? '| url: ' + data.url : '');
      if (data.type === 'INTERCEPT_URL') {
        console.log('[HomeScreen] INTERCEPT_URL — pushing subscriptions paywall');
        router.push('/paywall?offeringId=subscriptions');
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
    return true;
  };

  const handleLoadStart = () => {
    console.log('[HomeScreen] WebView load started');
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    console.log('[HomeScreen] WebView load ended');
    setLoading(false);
    setError(null);
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
