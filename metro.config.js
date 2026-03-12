
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude backend and docs from Metro bundler
config.resolver.blockList = [
  /backend\/.*/,
  /docs\/.*/,
];

// Add support for worklets
config.resolver.sourceExts.push('cjs');

module.exports = config;
