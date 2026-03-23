import React from "react";
import { WebView } from "react-native-webview";

// Shared WebView ref — used by paywall.tsx to inject JS after purchase
export const webViewRef = React.createRef<WebView>();

// Pending URL to navigate to once the WebView is visible and loaded
export let pendingWebViewUrl: string | null = null;
export function setPendingWebViewUrl(url: string | null) {
  pendingWebViewUrl = url;
}
