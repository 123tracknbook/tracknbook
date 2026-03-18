
import React, { useState, useRef } from "react";
import { StyleSheet, View, ActivityIndicator, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";

const injectedJavaScript = `
  (function() {
    // Intercept window.open for Apple OAuth
    var originalOpen = window.open;
    window.open = function(url, target, features) {
      if (url && (url.includes('apple') || url.includes('oauth') || url.includes('auth'))) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'APPLE_SIGN_IN' }));
        return null;
      }
      return originalOpen.apply(this, arguments);
    };

    // Listen for clicks on Apple Sign In buttons
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target !== document.body) {
        var text = (target.innerText || target.textContent || '').toLowerCase();
        var ariaLabel = (target.getAttribute('aria-label') || '').toLowerCase();
        var className = (target.className || '').toLowerCase();
        var id = (target.id || '').toLowerCase();
        if (
          text.includes('sign in with apple') ||
          text.includes('continue with apple') ||
          text.includes('sign up with apple') ||
          ariaLabel.includes('apple') ||
          className.includes('apple') ||
          id.includes('apple')
        ) {
          e.preventDefault();
          e.stopPropagation();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'APPLE_SIGN_IN' }));
          return false;
        }
        target = target.parentElement;
      }
    }, true);
    true;
  })();
`;

export default function HomeScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const webAppUrl = "https://www.tracknbook.app";

  const handleLoadEnd = () => {
    console.log("WebView finished loading TrackNBook");
    setLoading(false);
    setError(null);
  };

  const handleLoadStart = () => {
    console.log("WebView started loading TrackNBook");
    setLoading(true);
    setError(null);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error occurred:", JSON.stringify(nativeEvent, null, 2));
    const errorMessage = nativeEvent.description || nativeEvent.code || "Unknown error";
    setError(`Failed to load: ${errorMessage}`);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView HTTP error:", JSON.stringify(nativeEvent, null, 2));
    setLoading(false);
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    console.log("WebView loading request:", request.url);
    return true;
  };

  const triggerNativeAppleSignIn = async () => {
    try {
      console.log('Native Apple Sign In triggered');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log('Apple Sign In succeeded, passing credential back to WebView');
      const js = `
        window.dispatchEvent(new CustomEvent('nativeAppleSignIn', {
          detail: ${JSON.stringify({
            identityToken: credential.identityToken,
            authorizationCode: credential.authorizationCode,
            user: credential.user,
            email: credential.email,
            fullName: credential.fullName,
          })}
        }));
        true;
      `;
      webViewRef.current?.injectJavaScript(js);
    } catch (err: any) {
      if (err.code !== 'ERR_CANCELED') {
        console.error('Apple Sign In error:', err);
      } else {
        console.log('Apple Sign In cancelled by user');
      }
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'APPLE_SIGN_IN' && Platform.OS === 'ios') {
        console.log('Native Apple Sign In triggered from WebView message');
        await triggerNativeAppleSignIn();
      }
    } catch (error: any) {
      console.error('handleMessage parse error:', error);
    }
  };

  const handleOpenWindow = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const url = nativeEvent.targetUrl || '';
    console.log('WebView onOpenWindow:', url);

    // If it's an Apple OAuth URL, trigger native Apple Sign In instead
    if (url.includes('apple') || url.includes('appleid.apple.com') || url.includes('oauth') || url.includes('auth')) {
      console.log('Blocking OAuth popup, triggering native Apple Sign In');
      if (Platform.OS === 'ios') {
        triggerNativeAppleSignIn();
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleHttpError}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onMessage={handleMessage}
            onOpenWindow={handleOpenWindow}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            cacheEnabled={true}
            cacheMode="LOAD_DEFAULT"
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            originWhitelist={['*']}
            setSupportMultipleWindows={false}
          />
        )}
        {loading && !error && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading TrackNBook...
            </Text>
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
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
