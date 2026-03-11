
# Quick Start - Fix EAS Build Error

Your EAS build is failing because some required configuration values are missing. Here's what you need to do:

## Critical: Fill in These Values

### 1. In `app.json`:

Find and replace:
```json
"owner": "YOUR_EXPO_USERNAME"
```
With your actual Expo username (find it at https://expo.dev after logging in).

Example: `"owner": "johnsmith"`

---

The `projectId` will be automatically generated on your first build, so you can leave it as:
```json
"projectId": "YOUR_EAS_PROJECT_ID"
```

### 2. In `eas.json` (only needed for submission, not for building):

These values are only needed when you're ready to submit to the App Store. For now, you can leave them as placeholders.

## Try Building Again

After updating your Expo username in `app.json`, try building again. The build should now work.

If you're building for iOS:
- EAS will prompt you to log in to your Apple Developer account
- It will automatically handle certificates and provisioning profiles

If you're building for Android:
- EAS will automatically create a keystore for signing

## Still Getting Errors?

If you're still seeing "EAS build failed (exit code 1)", the error message should now be more specific. Look for:

1. **Missing native modules**: Make sure all plugins in `app.json` match your installed dependencies
2. **Invalid bundle identifier**: Make sure `com.tracknbook.app` is registered in your Apple Developer account (iOS only)
3. **Expo account issues**: Make sure you're logged in with `eas login`

## What Changed?

I've updated your configuration files to include:

✅ Native module plugins (`expo-notifications`, `expo-image-picker`)  
✅ iOS permissions for camera, photos, and notifications  
✅ Android permissions  
✅ Proper bundle identifiers  
✅ Runtime version policy  
✅ Build resource classes for faster builds  

Your app is now properly configured for EAS builds!
