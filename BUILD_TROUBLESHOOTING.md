
# EAS Build Troubleshooting Guide

## Recent Fixes Applied

### ✅ Fix 1: Babel Plugins Configuration
**Problem:** The `.easignore` was excluding `babel-plugins/` directory, but `babel.config.js` was trying to use those plugins, causing build failures.

**Solution:** 
- Removed `babel-plugins/` from `.easignore` so the plugins are included in EAS builds
- Fixed typo in `babel.config.js`: changed `react-native-worklets/plugin` to `react-native-reanimated/plugin`
- Made editable components plugins conditional (only in development mode)

### ✅ Fix 2: Android Adaptive Icon
**Problem:** Android adaptive icon was pointing to `natively-dark.png` which might not be the correct format.

**Solution:** Changed to use `./assets/icon.png` which is the standard app icon.

### ✅ Fix 3: Production Environment Variable
**Problem:** Build might not be setting NODE_ENV=production correctly.

**Solution:** Added explicit `NODE_ENV: "production"` to the production build profile in `eas.json`.

## Common Build Failures and Solutions

### Issue: "EAS build failed (exit code 1)"

This is a generic error that can have multiple causes. Follow these steps:

#### 1. Check Build Logs
When a build fails, check the detailed logs in the EAS dashboard:
1. Go to https://expo.dev/accounts/tracknbook/projects/tracknbook/builds
2. Click on the failed build
3. Look for specific error messages in the logs

Common errors:
- **Babel plugin errors:** Make sure babel-plugins directory is not excluded
- **Missing dependencies:** Install them using the install_dependencies tool
- **Native module issues:** May require native rebuild
- **Code signing issues (iOS):** Verify your Apple Developer account is properly configured
- **Gradle errors (Android):** Usually related to dependencies or Android SDK versions

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

#### 3. Platform-Specific Files

This project uses platform-specific files for different platforms:
- `.ios.tsx` - iOS-specific code
- `.android.tsx` - Android-specific code  
- `.web.tsx` - Web-specific code
- `.tsx` - Fallback for all platforms

When you see imports of web-only packages (like `leaflet`), they should ONLY be in `.web.tsx` files.

#### 4. Clean Build

If builds continue to fail after applying the fixes above:
1. The babel configuration has been fixed
2. The `.easignore` now includes necessary files
3. The production environment is properly configured
4. Try building again with the updated configuration

## Build Configuration

### Resource Classes
- Using `m-medium` for faster builds
- Configured in `eas.json` for both iOS and Android

### Runtime Version
- Using `1.0.0` for consistent builds
- Configured in `app.json`

### Excluded Files
The following are excluded from EAS builds via `.easignore`:
- Documentation files (*.md, docs/)
- Backend code (backend/)
- Test files
- Development tools (chat_history.json, .vscode, .idea)
- Web-specific build files (workbox-config.js, dist/)
- Git files
- ESLint config files

### Included Files (Important!)
The following are INCLUDED in builds (not in .easignore):
- `babel-plugins/` - Required for babel configuration
- `assets/` - All app assets (icons, images, fonts)
- `components/`, `hooks/`, `contexts/`, `utils/` - All app code
- `app/` - All screens and routing

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
4. The most recent error message will help identify the specific issue

## Summary of All Fixes Applied

✅ Fixed babel.config.js typo (react-native-worklets → react-native-reanimated)
✅ Removed babel-plugins/ from .easignore (plugins are needed for builds)
✅ Fixed Android adaptive icon to use correct icon.png file
✅ Added NODE_ENV=production to production build profile
✅ Verified platform-specific file structure is correct
✅ Confirmed EAS configuration (owner, projectId) is correct
✅ Ensured all necessary files are included in builds

The build should now succeed. If it still fails, check the EAS build logs for the specific error message and look for:
- Babel/Metro bundler errors
- Native module compilation errors
- Asset loading errors
- Code signing errors (iOS)
- Gradle build errors (Android)
