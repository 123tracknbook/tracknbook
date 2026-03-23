
import { WebView } from "react-native-webview";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, View, ActivityIndicator, Platform, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import React, { useState, useEffect, useRef } from "react";

const webAppUrl = "https://www.tracknbook.app";

// JS injected before page content loads — intercepts SPA navigation to /plans and vehicle check bolt-on
const injectedJavaScriptBeforeContentLoaded = `
(function() {
  console.log('[WebView-JS] injectedJavaScriptBeforeContentLoaded running');

  function shouldInterceptUrl(url) {
    if (!url) return false;
    return url.includes('/plans') || url.includes('vehicle-check') || url.includes('bolt-on') || url.includes('addon');
  }

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

  function checkAndPostVehicleCheck(url) {
    if (url && (url.includes('vehicle-check') || url.includes('bolt-on') || url.includes('addon'))) {
      console.log('[WebView-JS] Vehicle check / bolt-on URL detected, posting OPEN_PAYWALL message:', url);
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL', url: url }));
      } catch(e) {
        console.log('[WebView-JS] postMessage failed:', e);
      }
    }
  }

  function checkUrl(url) {
    checkAndPostPlans(url);
    checkAndPostVehicleCheck(url);
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

  function isVehicleCheckElement(el) {
    var text = (el.textContent || '').trim().toLowerCase();
    var href = (el.getAttribute && el.getAttribute('href')) || '';
    var className = (el.className && typeof el.className === 'string' ? el.className : '').toLowerCase();
    var id = (el.id || '').toLowerCase();
    var textMatch = text.includes('vehicle check') || text.includes('vehicle-check') || text.includes('bolt-on') || /\bbolt on\b/.test(text) || text.includes('addon') || text.includes('add-on') || /\+[\s\d,]+checks?/.test(text);
    var hrefMatch = href.includes('vehicle-check') || href.includes('bolt-on') || href.includes('addon');
    var attrMatch = className.includes('vehicle') || className.includes('bolt') || id.includes('vehicle') || id.includes('bolt');
    return textMatch || hrefMatch || attrMatch;
  }

  // Intercept "Change Plan" / "Upgrade" / "Vehicle Check" button clicks
  function interceptPlanButtons() {
    var elements = document.querySelectorAll('a[href*="/plans"], a[href*="plan"], a[href*="vehicle-check"], a[href*="bolt-on"], a[href*="addon"], button');
    elements.forEach(function(el) {
      var text = (el.textContent || '').trim().toLowerCase();
      var href = el.getAttribute('href') || '';
      var isPlansLink = href.includes('/plans');
      var isPlanButton = text.includes('change plan') || text.includes('upgrade') || text.includes('get pro') || text.includes('subscribe');
      var isVehicleCheck = isVehicleCheckElement(el);
      if ((isPlansLink || isPlanButton || isVehicleCheck) && !el.dataset.nativeIntercepted) {
        el.dataset.nativeIntercepted = 'true';
        console.log('[WebView-JS] Intercepting button/link:', text || href, '| vehicleCheck:', isVehicleCheck);

        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (isVehicleCheck) {
            console.log('[WebView-JS] Button clicked (vehicle check / bolt-on), posting OPEN_PAYWALL | text:', text, '| href:', href);
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
            } catch(err) {
              console.log('[WebView-JS] postMessage failed on click:', err);
            }
          } else {
            console.log('[WebView-JS] Button clicked (plan / subscribe), posting INTERCEPT_URL | text:', text, '| href:', href);
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'INTERCEPT_URL', url: href }));
            } catch(err) {
              console.log('[WebView-JS] postMessage failed on click:', err);
            }
          }
        }, true);
      }
    });
  }

  // Event delegation on document for vehicle check bolt-on clicks (catches dynamically rendered buttons)
  document.addEventListener('click', function(e) {
    var target = e.target;
    // Walk up to 10 ancestors to find a matching element
    for (var i = 0; i < 10; i++) {
      if (!target || target === document.body) break;
      if (isVehicleCheckElement(target)) {
        var text = (target.textContent || '').trim().toLowerCase();
        var href = (target.getAttribute && target.getAttribute('href')) || '';
        console.log('[WebView-JS] Vehicle check element clicked via delegation | text:', text, '| href:', href);
        e.preventDefault();
        e.stopPropagation();
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
        } catch(err) {
          console.log('[WebView-JS] postMessage failed on delegation click:', err);
        }
        return;
      }
      target = target.parentElement;
    }
  }, true);

  // Mousedown backup for frameworks that suppress click events
  document.addEventListener('mousedown', function(e) {
    var target = e.target;
    for (var i = 0; i < 10; i++) {
      if (!target || target === document.body) break;
      if (isVehicleCheckElement(target)) {
        var text = (target.textContent || '').trim().toLowerCase();
        console.log('[WebView-JS] Vehicle check element mousedown via delegation | text:', text);
        // Don't preventDefault here — just post the message; let the click also fire
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
        } catch(err) {}
        return;
      }
      target = target.parentElement;
    }
  }, true);

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

  // Check current URL immediately in case we loaded directly on /plans or vehicle-check
  checkUrl(window.location.href);

  // Intercept fetch calls that redirect to Stripe
  var _origFetch = window.fetch;
  window.fetch = function() {
    var args = arguments;
    var url = (args[0] && typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url) ? args[0].url : '';
    return _origFetch.apply(this, args).then(function(response) {
      // If the response redirected to Stripe, intercept it
      if (response.url && response.url.includes('stripe.com')) {
        console.log('[WebView-JS] fetch response redirected to Stripe:', response.url);
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
        } catch(e) {}
      }
      return response;
    });
  };

  // Intercept XMLHttpRequest responses that redirect to Stripe
  var _origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._nativeUrl = url;
    return _origXHROpen.apply(this, arguments);
  };
  var _origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function() {
    var xhr = this;
    xhr.addEventListener('load', function() {
      try {
        var data = JSON.parse(xhr.responseText);
        if (data && data.url && data.url.includes('stripe.com')) {
          console.log('[WebView-JS] XHR response contains Stripe URL:', data.url);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
        }
        if (data && data.checkoutUrl && data.checkoutUrl.includes('stripe.com')) {
          console.log('[WebView-JS] XHR response contains Stripe checkoutUrl:', data.checkoutUrl);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
        }
      } catch(e) {}
    });
    return _origXHRSend.apply(this, arguments);
  };

  // Intercept form submissions that go to Stripe
  document.addEventListener('submit', function(e) {
    var form = e.target;
    var action = (form && form.action) || '';
    if (action.includes('stripe.com')) {
      console.log('[WebView-JS] Form submit to Stripe intercepted:', action);
      e.preventDefault();
      e.stopPropagation();
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
      } catch(err) {}
    }
  }, true);

  // Intercept window.location assignments to Stripe
  try {
    var _locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
    if (!_locationDescriptor || _locationDescriptor.configurable) {
      var _origAssign = window.location.assign.bind(window.location);
      window.location.assign = function(url) {
        if (url && url.includes('stripe.com')) {
          console.log('[WebView-JS] window.location.assign to Stripe intercepted:', url);
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
          } catch(e) {}
          return;
        }
        return _origAssign(url);
      };
    }
  } catch(e) {
    console.log('[WebView-JS] Could not patch window.location.assign:', e);
  }

  // Intercept window.open calls to Stripe
  var _origWindowOpen = window.open;
  window.open = function(url) {
    if (url && url.toString().includes('stripe.com')) {
      console.log('[WebView-JS] window.open to Stripe intercepted:', url);
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
      } catch(e) {}
      return null;
    }
    return _origWindowOpen.apply(this, arguments);
  };

  // Intercept window.location.href = 'stripe...' assignments
  try {
    var _loc = window.location;
    var _hrefDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(_loc), 'href');
    if (_hrefDescriptor && _hrefDescriptor.set) {
      var _origHrefSet = _hrefDescriptor.set.bind(_loc);
      Object.defineProperty(_loc, 'href', {
        set: function(val) {
          if (val && val.toString().includes('stripe.com')) {
            console.log('[WebView-JS] window.location.href set to Stripe intercepted:', val);
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
            } catch(e) {}
            return;
          }
          _origHrefSet(val);
        },
        get: function() {
          return _loc.href;
        },
        configurable: true,
      });
    }
  } catch(e) {
    console.log('[WebView-JS] Could not patch window.location.href setter:', e);
  }

  // Intercept window.location.replace calls to Stripe
  try {
    var _origReplace = window.location.replace.bind(window.location);
    window.location.replace = function(url) {
      if (url && url.toString().includes('stripe.com')) {
        console.log('[WebView-JS] window.location.replace to Stripe intercepted:', url);
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
        } catch(e) {}
        return;
      }
      return _origReplace(url);
    };
  } catch(e) {
    console.log('[WebView-JS] Could not patch window.location.replace:', e);
  }

  // Intercept fetch — also check request URL itself (not just response) for Stripe
  // (already patched above for response.url, this catches direct fetch to stripe)
  var _origFetch2 = window.fetch;
  window.fetch = function() {
    var args = arguments;
    var reqUrl = '';
    if (args[0] && typeof args[0] === 'string') reqUrl = args[0];
    else if (args[0] && args[0].url) reqUrl = args[0].url;
    if (reqUrl && reqUrl.includes('stripe.com')) {
      console.log('[WebView-JS] fetch to Stripe intercepted:', reqUrl);
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_PAYWALL' }));
      } catch(e) {}
      return Promise.resolve(new Response('{}', { status: 200 }));
    }
    return _origFetch2.apply(this, args);
  };
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
      } else if (data.type === 'OPEN_PAYWALL') {
        console.log('[HomeScreen] OPEN_PAYWALL — pushing Bolt ons paywall');
        router.push('/paywall?offeringId=Bolt%20ons');
      }
    } catch (e) {
      console.log('[HomeScreen] onMessage JSON parse failed, raw was:', raw);
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url;
    console.log('[HomeScreen] onShouldStartLoadWithRequest:', url);
    if (url.includes('stripe.com')) {
      console.log('[HomeScreen] Stripe checkout URL intercepted — pushing Bolt ons paywall:', url);
      router.push('/paywall?offeringId=Bolt%20ons');
      return false;
    }
    if (url.includes('/plans')) {
      console.log('[HomeScreen] /plans URL intercepted via onShouldStartLoadWithRequest — pushing subscriptions paywall');
      router.push('/paywall?offeringId=subscriptions');
      return false;
    }
    if (url.includes('vehicle-check') || url.includes('bolt-on') || url.includes('addon')) {
      console.log('[HomeScreen] Vehicle check / bolt-on URL intercepted via onShouldStartLoadWithRequest — pushing Bolt ons paywall:', url);
      router.push('/paywall?offeringId=Bolt%20ons');
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

  const handleOpenWindow = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const url = nativeEvent?.targetUrl || '';
    console.log('[HomeScreen] onOpenWindow:', url);
    if (url.includes('stripe.com')) {
      console.log('[HomeScreen] onOpenWindow Stripe URL intercepted — pushing Bolt ons paywall');
      router.push('/paywall?offeringId=Bolt%20ons');
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const url = navState?.url || '';
    console.log('[HomeScreen] onNavigationStateChange:', url);
    if (url.includes('stripe.com')) {
      console.log('[HomeScreen] Stripe URL in navigation state — pushing Bolt ons paywall and going back');
      router.push('/paywall?offeringId=Bolt%20ons');
      webViewRef.current?.goBack();
    }
  };

  const loadingTextColor = colors.text;
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
            onOpenWindow={handleOpenWindow}
            onNavigationStateChange={handleNavigationStateChange}
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
