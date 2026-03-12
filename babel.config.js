
module.exports = function (api) {
  api.cache(true);

  // Detect if we're running on web platform - check multiple indicators
  const isWeb = 
    process.env.EXPO_PLATFORM === "web" || 
    process.env.EXPO_PUBLIC_PLATFORM === "web" ||
    process.platform === "browser" ||
    api.caller(caller => caller?.platform === "web");
  
  const isEASBuild = process.env.EAS_BUILD === "true";
  const isProduction = process.env.NODE_ENV === "production";
  const editModeEnabled = process.env.EXPO_PUBLIC_ENABLE_EDIT_MODE === "TRUE";

  // CRITICAL: NEVER enable editable components on web - they inject __sourceLocation props 
  // that React doesn't recognize on DOM elements, causing runtime errors
  // Only enable in development, on native platforms (iOS/Android), and when not doing EAS builds
  const shouldEnableEditableComponents = 
    editModeEnabled &&
    !isProduction &&
    !isWeb &&
    !isEASBuild;

  console.log('[Babel Config] Platform detection:', {
    isWeb,
    isEASBuild,
    isProduction,
    editModeEnabled,
    shouldEnableEditableComponents,
    EXPO_PLATFORM: process.env.EXPO_PLATFORM,
  });

  const EDITABLE_COMPONENTS = shouldEnableEditableComponents
    ? [
        ["./babel-plugins/editable-elements.js", {}],
        ["./babel-plugins/inject-source-location.js", {}],
      ]
    : [];

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [
            ".ios.ts",
            ".android.ts",
            ".ts",
            ".ios.tsx",
            ".android.tsx",
            ".tsx",
            ".jsx",
            ".js",
            ".json",
          ],
          alias: {
            "@": "./",
            "@components": "./components",
            "@style": "./style",
            "@hooks": "./hooks",
            "@types": "./types",
            "@contexts": "./contexts",
            "@lib": "./lib",
          },
        },
      ],
      ...EDITABLE_COMPONENTS,
      "@babel/plugin-proposal-export-namespace-from",
      "react-native-reanimated/plugin",
    ],
  };
};
