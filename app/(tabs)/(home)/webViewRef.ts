import React from "react";
import { WebView } from "react-native-webview";

// Shared WebView ref — used by paywall.tsx to inject JS after purchase
export const webViewRef = React.createRef<WebView>();
