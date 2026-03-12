
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude backend and docs from Metro bundler
config.resolver.blockList = [
  /backend\/.*/,
  /docs\/.*/,
  /node_modules\/react-router-dom\/.*/,
  /node_modules\/leaflet\/.*/,
  /node_modules\/react-leaflet\/.*/,
  /node_modules\/workbox-.*/,
];

// Add support for worklets
config.resolver.sourceExts.push('cjs');

module.exports = config;
