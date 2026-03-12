
# EAS Build Troubleshooting Guide

## Common Build Failures and Solutions

### Issue: "EAS build failed (exit code 1)"

This is a generic error that can have multiple causes. Follow these steps:

#### 1. Web-Only Dependencies Causing Native Build Failures ✅ FIXED

**Problem:** Web-only packages like `react-router-dom`, `leaflet`, `react-leaflet`, and `workbox-*` were in the main `dependencies` section, causing native builds to fail.

**Solution:** These packages have been moved to `devDependencies` since they're only used for web builds. The native builds use platform-specific files (`.ios.tsx`, `.android.tsx`, `.web.tsx`) to handle platform differences.

**What was changed:**
- Moved `react-router-dom`, `leaflet`, `react-leaflet`, `workbox-*`, `difflib`, and `eas` to `devDependencies`
- Updated `metro.config.js` to block these packages from being bundled in native builds
- Updated `.easignore` to exclude unnecessary files from EAS builds

#### 2. Verify EAS Configuration

Ensure your `app.json` has:
```json
{
  "expo": {
    "owner": "tracknbook",
    "extra": {
      "eas": {
        "projectId": "66b1f7d9-c56e-4b54-bd69-1aca90734eae"
      }
    }
  }
}
```

#### 3. Check Build Logs

When a build fails, check the detailed logs in the EAS dashboard:
1. Go to https://expo.dev/accounts/tracknbook/projects/tracknbook/builds
2. Click on the failed build
3. Look for specific error messages in the logs

Common errors:
- **Missing dependencies:** Install them using the install_dependencies tool
- **Native module issues:** May require `npx expo prebuild` (but you can't run this - contact support)
- **Code signing issues (iOS):** Verify your Apple Developer account is properly configured
- **Gradle errors (Android):** Usually related to dependencies or Android SDK versions

#### 4. Platform-Specific Files

This project uses platform-specific files for different platforms:
- `.ios.tsx` - iOS-specific code
- `.android.tsx` - Android-specific code  
- `.web.tsx` - Web-specific code
- `.tsx` - Fallback for all platforms

When you see imports of web-only packages (like `leaflet`), they should ONLY be in `.web.tsx` files.

#### 5. Clean Build

If builds continue to fail:
1. The dependencies have been cleaned up
2. The `.easignore` excludes problematic files
3. Try building again - the web dependencies are now properly isolated

## Build Configuration

### Resource Classes
- Using `m-medium` for faster builds
- Configured in `eas.json` for both iOS and Android

### Runtime Version
- Using `appVersion` policy for consistent builds
- Configured in `app.json`

### Excluded Files
The following are excluded from EAS builds via `.easignore`:
- Documentation files (*.md, docs/)
- Backend code (backend/)
- Test files
- Development tools (babel-plugins/)
- Web-specific build files (workbox-config.js)

## Next Steps After Successful Build

Once your build succeeds:

### For iOS:
1. Build will be available in EAS dashboard
2. Download the `.ipa` file or submit directly to App Store Connect
3. For App Store submission, you'll need:
   - Apple Developer account ($99/year)
   - App Store Connect app created
   - Proper code signing certificates

### For Android:
1. Build will produce an `.aab` (app bundle) for production
2. Download and upload to Google Play Console
3. For Play Store submission, you'll need:
   - Google Play Developer account ($25 one-time)
   - App created in Play Console
   - Proper signing configuration

## Getting Help

If you continue to experience build failures:
1. Check the EAS build logs for specific errors
2. Verify all configuration files match this guide
3. Ensure your Expo account has proper permissions for the project
4. Contact Expo support with your build ID

## Summary of Recent Fixes

✅ Moved web-only dependencies to devDependencies
✅ Updated metro.config.js to block web packages from native builds
✅ Updated .easignore to exclude unnecessary files
✅ Verified platform-specific file structure is correct
✅ Confirmed EAS configuration (owner, projectId) is correct

The build should now succeed. If it still fails, check the EAS build logs for the specific error message.
