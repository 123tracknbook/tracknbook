
# Quick Start Guide - TrackNBook App

## What This App Does

This is a WebView wrapper for https://www.tracknbook.app with native iOS and Android functionality:
- Push notifications
- Camera access
- Photo library access
- Native navigation

## Project Structure

```
app/
  (tabs)/           # Tab-based navigation
    (home)/         # Home screen with WebView
    profile.tsx     # Profile screen
  _layout.tsx       # Root layout
  index.tsx         # Entry point (redirects to home)

components/         # Reusable components
  FloatingTabBar.tsx
  Map.tsx / Map.web.tsx  # Platform-specific map components

hooks/              # Custom React hooks
  useCamera.ts      # Camera functionality
  useNotifications.ts  # Push notifications
```

## Recent Fixes

### Build Failure Resolution

**Problem:** EAS builds were failing with exit code 1 due to web-only dependencies being included in native builds.

**Solution:** 
- Moved `react-router-dom`, `leaflet`, `react-leaflet`, and `workbox-*` to `devDependencies`
- Updated `metro.config.js` to block these packages from native bundles
- Updated `.easignore` to exclude unnecessary files

### Key Changes Made:
1. ✅ `package.json` - Web dependencies moved to devDependencies
2. ✅ `metro.config.js` - Added blocklist for web-only packages
3. ✅ `.easignore` - Excludes backend/, docs/, babel-plugins/, tests/
4. ✅ `eas.json` - Proper build configuration with m-medium resources

## Building the App

### Prerequisites
- Expo account (you're using: tracknbook)
- EAS CLI configured
- Project ID: 66b1f7d9-c56e-4b54-bd69-1aca90734eae

### Build Commands

The builds are triggered through the EAS dashboard or CLI. You cannot run these commands directly in this environment, but here's what happens:

**iOS Production Build:**
```bash
eas build --platform ios --profile production
```

**Android Production Build:**
```bash
eas build --platform android --profile production
```

**Both Platforms:**
```bash
eas build --platform all --profile production
```

## Configuration Files

### app.json
- Bundle ID (iOS): `com.tracknbook.app`
- Package name (Android): `com.tracknbook.app`
- Owner: `tracknbook`
- Project ID: `66b1f7d9-c56e-4b54-bd69-1aca90734eae`

### eas.json
- Build profiles: development, preview, production
- Resource class: m-medium (faster builds)
- iOS: Produces .ipa file
- Android: Produces .aab (app bundle) for production

## Platform-Specific Code

This project uses platform-specific files:

- `index.tsx` - Default (all platforms)
- `index.ios.tsx` - iOS-specific
- `index.android.tsx` - Android-specific
- `index.web.tsx` - Web-specific

Example: The Map component has `Map.tsx` (native, uses WebView) and `Map.web.tsx` (web, uses Leaflet).

## Permissions

### iOS (Info.plist)
- Camera access
- Photo library access
- Microphone access (for video recording)
- Background notifications

### Android (AndroidManifest.xml)
- Camera
- Read/Write external storage
- Record audio
- Internet access
- Notifications

## Next Steps

1. **Build Status:** Check https://expo.dev/accounts/tracknbook/projects/tracknbook/builds
2. **If Build Succeeds:**
   - iOS: Download .ipa or submit to App Store Connect
   - Android: Download .aab and upload to Google Play Console
3. **If Build Fails:** Check BUILD_TROUBLESHOOTING.md

## App Store Submission

### iOS (App Store)
Requirements:
- Apple Developer account ($99/year)
- App created in App Store Connect
- Screenshots, description, privacy policy
- Review process (typically 1-3 days)

### Android (Google Play)
Requirements:
- Google Play Developer account ($25 one-time)
- App created in Play Console
- Screenshots, description, privacy policy
- Review process (typically 1-3 days)

## Development

To run locally:
- iOS: Use Expo Go app or development build
- Android: Use Expo Go app or development build
- Web: Runs in browser

## Support

- EAS Build Dashboard: https://expo.dev/accounts/tracknbook/projects/tracknbook
- Expo Documentation: https://docs.expo.dev
- Build Troubleshooting: See BUILD_TROUBLESHOOTING.md
