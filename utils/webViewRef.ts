import React from "react";
import { WebView } from "react-native-webview";

// Shared WebView ref — used by other screens to inject JS into the main WebView
export const webViewRef = React.createRef<WebView>();

// Pending URL to navigate to once the WebView is visible and loaded
export let pendingWebViewUrl: string | null = null;
export function setPendingWebViewUrl(url: string | null) {
  pendingWebViewUrl = url;
}
