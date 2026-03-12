
module.exports = function (api) {
  api.cache(true);

  // Only enable editable components in development AND when plugins exist AND not on web
  const EDITABLE_COMPONENTS =
    process.env.EXPO_PUBLIC_ENABLE_EDIT_MODE === "TRUE" &&
    process.env.NODE_ENV !== "production" &&
    process.env.EXPO_PLATFORM !== "web"
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
