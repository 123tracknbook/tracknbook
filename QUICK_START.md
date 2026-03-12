
# EAS Build Troubleshooting Guide

Your app is configured correctly, but EAS builds can fail for various reasons. Here's how to diagnose and fix the issue.

## Step 1: Check Your Configuration ✅

Your `app.json` and `eas.json` are properly configured:
- ✅ Owner: `tracknbook`
- ✅ Project ID: `66b1f7d9-c56e-4b54-bd69-1aca90734eae`
- ✅ Bundle ID (iOS): `com.tracknbook.app`
- ✅ Package (Android): `com.tracknbook.app`
- ✅ All required plugins are configured

## Step 2: Common Build Failure Causes

### Issue 1: Not Logged Into EAS
**Symptom**: Build fails immediately with authentication error

**Solution**: You need to log in to EAS CLI. Unfortunately, you cannot run terminal commands directly, but here's what needs to happen:
1. The EAS CLI needs to be authenticated with your Expo account
2. This requires running: `eas login` (which you cannot do directly)

**Workaround**: You'll need to use the Expo web dashboard to trigger builds:
1. Go to https://expo.dev/accounts/tracknbook/projects/tracknbook
2. Click "Builds" in the left sidebar
3. Click "Create a build" button
4. Select platform (iOS or Android)
5. Select profile (production, preview, or development)
6. Click "Build"

### Issue 2: Bundle Identifier Not Registered (iOS Only)
**Symptom**: iOS build fails with "No bundle identifier found" or "Invalid bundle identifier"

**Solution**: You need to register `com.tracknbook.app` in your Apple Developer account:
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click the "+" button
3. Select "App IDs" → Continue
4. Select "App" → Continue
5. Description: TrackNBook
6. Bundle ID: `com.tracknbook.app` (Explicit)
7. Enable capabilities: Push Notifications (if needed)
8. Click Register

### Issue 3: Missing Apple Developer Account (iOS Only)
**Symptom**: iOS build fails with "No Apple Developer account found"

**Solution**: You need an Apple Developer account ($99/year):
1. Go to https://developer.apple.com
2. Enroll in the Apple Developer Program
3. Wait for approval (usually 24-48 hours)
4. Once approved, try building again

### Issue 4: Native Module Compilation Errors
**Symptom**: Build fails during "Building native code" step with compilation errors

**Solution**: This is usually caused by incompatible dependencies. I've added a `.easignore` file to exclude problematic files from the build.

**What was fixed**:
- ✅ Excluded backend folder from build
- ✅ Excluded documentation files
- ✅ Excluded web-only dependencies from Metro bundler
- ✅ Removed `expo-web-browser` from plugins (not needed for WebView)

### Issue 5: Asset Loading Errors
**Symptom**: Build fails with "Unable to resolve asset" or "Image not found"

**Solution**: Verify all image assets exist:
- ✅ `./assets/icon.png` - App icon (must be 1024x1024 or larger)
- ✅ `./assets/images/natively-dark.png` - Splash screen
- ✅ `./assets/images/final_quest_240x240.png` - Web favicon

If any are missing, you'll need to add them.

## Step 3: Build Using Expo Dashboard (Recommended)

Since you cannot run terminal commands, use the Expo web dashboard:

### For iOS Build:
1. Go to https://expo.dev/accounts/tracknbook/projects/tracknbook/builds
2. Click "Create a build"
3. Select "iOS"
4. Select "production" profile
5. Click "Build"
6. EAS will prompt you to log in to your Apple Developer account (in the web interface)
7. Wait 15-30 minutes for the build to complete

### For Android Build:
1. Go to https://expo.dev/accounts/tracknbook/projects/tracknbook/builds
2. Click "Create a build"
3. Select "Android"
4. Select "production" profile
5. Click "Build"
6. Wait 10-20 minutes for the build to complete

## Step 4: View Build Logs

If the build fails:
1. Go to the build page on Expo dashboard
2. Click on the failed build
3. Click "View logs"
4. Look for the specific error message
5. The error will tell you exactly what went wrong

Common error patterns:
- `ENOENT: no such file or directory` → Missing asset file
- `No bundle identifier found` → Need to register bundle ID in Apple Developer
- `Authentication failed` → Need to log in to Apple Developer account
- `Gradle build failed` → Android compilation error (usually dependency issue)
- `Pod install failed` → iOS compilation error (usually dependency issue)

## Step 5: What I've Fixed

I've made the following changes to improve build success:

1. **Created `.easignore`** - Excludes unnecessary files from the build:
   - Backend folder
   - Documentation files
   - Test files
   - Development files

2. **Updated `metro.config.js`** - Blocks backend and docs from Metro bundler

3. **Optimized `app.json`** - Removed unnecessary plugins and ensured all required permissions are present

4. **Simplified `eas.json`** - Removed `image: "latest"` which can sometimes cause issues

## Step 6: Alternative - Use Preview Build First

If production builds keep failing, try a preview build first (it's less strict):

1. Go to https://expo.dev/accounts/tracknbook/projects/tracknbook/builds
2. Click "Create a build"
3. Select your platform
4. Select "preview" profile (instead of production)
5. Click "Build"

Preview builds:
- Don't require App Store/Play Store submission setup
- Generate installable files (IPA for iOS, APK for Android)
- Can be distributed directly to testers
- Are easier to debug

## Step 7: Next Steps After Successful Build

Once your build succeeds:

### For iOS:
- The IPA file will be automatically uploaded to App Store Connect (if you've configured submission)
- Or you can download the IPA and install it on test devices using TestFlight

### For Android:
- You'll get an APK (preview) or AAB (production) file
- APK can be installed directly on Android devices
- AAB needs to be uploaded to Google Play Console

## Still Having Issues?

If you're still getting "EAS build failed (exit code 1)", you need to:

1. **Check the build logs** on the Expo dashboard - they will show the exact error
2. **Share the specific error message** - "exit code 1" is too generic to diagnose
3. **Verify your Apple Developer account** (for iOS) - make sure it's active and in good standing
4. **Check your Expo account** - make sure you have build credits available

## Summary

The most likely causes of your build failure:
1. ❌ Not logged into EAS CLI (use Expo dashboard instead)
2. ❌ Bundle identifier not registered in Apple Developer account (iOS only)
3. ❌ No Apple Developer account (iOS only)
4. ❌ Missing or invalid assets

**Recommended action**: Use the Expo web dashboard to trigger builds and view detailed error logs.
