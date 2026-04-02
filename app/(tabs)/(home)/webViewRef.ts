import React from "react";
import { WebView } from "react-native-webview";

// Shared WebView ref — used by paywall.tsx to inject JS after purchase
export const webViewRef = React.createRef<WebView>();

// Pending URL to navigate to once the WebView is visible and loaded
export let pendingWebViewUrl: string | null = null;
// Default post-purchase destination — web app polls for subscription status via ?purchase=1
export function setPendingWebViewUrl(url: string | null) {
  pendingWebViewUrl = url;
}

// Last known Supabase user ID that has been logged in to RevenueCat.
// Shared so paywall.tsx can re-associate the subscriber after a purchase.
export let currentRcUserId: string | null = null;
export function setCurrentRcUserId(userId: string | null) {
  currentRcUserId = userId;
}
