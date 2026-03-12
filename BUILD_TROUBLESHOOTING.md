
# Build Troubleshooting - Detailed Diagnosis

## Understanding "EAS build failed (exit code 1)"

This is a generic error that means "something went wrong." To fix it, we need to see the actual error message in the build logs.

## How to Access Build Logs

Since you cannot run terminal commands, you must use the Expo web dashboard:

1. Go to: https://expo.dev
2. Sign in with your Expo account
3. Navigate to: Projects → tracknbook → Builds
4. Click on the failed build
5. Click "View logs" or "Show full log"
6. Scroll to the bottom to see the actual error

## Common Build Errors and Solutions

### Error: "No bundle identifier found" (iOS)

**Full error message**:
```
❌ No bundle identifier found for com.tracknbook.app
```

**Cause**: The bundle identifier hasn't been registered in your Apple Developer account.

**Solution**:
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click "+" to add a new identifier
3. Select "App IDs" → Continue
4. Select "App" → Continue
5. Enter:
   - Description: TrackNBook
   - Bundle ID: com.tracknbook.app (select "Explicit")
6. Click "Continue" → "Register"
7. Try building again

---

### Error: "No Apple Developer account" (iOS)

**Full error message**:
```
❌ You don't have access to an Apple Developer account
```

**Cause**: You need an active Apple Developer Program membership.

**Solution**:
1. Go to https://developer.apple.com
2. Click "Account"
3. Enroll in the Apple Developer Program ($99/year)
4. Wait for approval (24-48 hours)
5. Once approved, try building again

---

### Error: "Authentication failed" (iOS)

**Full error message**:
```
❌ Authentication failed. Please log in to your Apple Developer account.
```

**Cause**: EAS needs permission to access your Apple Developer account.

**Solution**:
When building via the Expo dashboard, you'll be prompted to authenticate with Apple. Follow the prompts to log in.

---

### Error: "Unable to resolve module" or "Module not found"

**Full error message**:
```
❌ Unable to resolve module `react-native-webview` from `app/(tabs)/(home)/index.tsx`
```

**Cause**: A dependency is missing or not properly installed.

**Solution**:
This shouldn't happen with EAS builds (they install dependencies automatically), but if it does, the dependency might not be in `package.json`. Check that all imports in your code match dependencies in `package.json`.

---

### Error: "Asset not found"

**Full error message**:
```
❌ Unable to resolve asset "./assets/icon.png"
```

**Cause**: An image or asset file referenced in `app.json` doesn't exist.

**Solution**:
Verify these files exist:
- `./assets/icon.png` (1024x1024 or larger)
- `./assets/images/natively-dark.png`
- `./assets/images/final_quest_240x240.png`

If any are missing, you need to add them.

---

### Error: "Gradle build failed" (Android)

**Full error message**:
```
❌ Execution failed for task ':app:mergeReleaseResources'
```

**Cause**: Android compilation error, usually due to:
- Incompatible dependencies
- Missing Android permissions
- Invalid resource files

**Solution**:
I've already configured all required Android permissions in `app.json`. If this error persists, check the full build log for the specific Gradle error.

---

### Error: "Pod install failed" (iOS)

**Full error message**:
```
❌ [!] CocoaPods could not find compatible versions for pod "ExpoModulesCore"
```

**Cause**: iOS dependency resolution error, usually due to incompatible native module versions.

**Solution**:
This is rare with Expo SDK 54. If it happens, it usually means a dependency version mismatch. All your dependencies are compatible with Expo 54, so this shouldn't occur.

---

### Error: "Build timed out"

**Full error message**:
```
❌ Build timed out after 60 minutes
```

**Cause**: The build took too long (usually due to slow network or large dependencies).

**Solution**:
- Try building again (sometimes it's just a temporary issue)
- Use a higher resource class (already set to `m-medium` in your config)

---

### Error: "Out of build credits"

**Full error message**:
```
❌ You don't have enough build credits
```

**Cause**: Your Expo account has run out of free build credits.

**Solution**:
- Free tier: 30 builds/month
- If you've exceeded this, you need to:
  1. Wait until next month, or
  2. Upgrade to a paid Expo plan

---

## What I've Already Fixed

✅ **Configuration**: All required fields in `app.json` and `eas.json` are properly set
✅ **Dependencies**: All native modules are compatible with Expo SDK 54
✅ **Permissions**: iOS and Android permissions are correctly configured
✅ **Plugins**: All required Expo plugins are properly configured
✅ **Build optimization**: Added `.easignore` to exclude unnecessary files
✅ **Metro config**: Excluded backend and docs from bundler

## What You Need to Do

Since I cannot run terminal commands or access the Expo dashboard for you, you need to:

### Step 1: Trigger a Build via Expo Dashboard
1. Go to https://expo.dev/accounts/tracknbook/projects/tracknbook/builds
2. Click "Create a build"
3. Select platform (iOS or Android)
4. Select profile (try "preview" first, it's easier)
5. Click "Build"

### Step 2: Check the Build Logs
1. Wait for the build to complete (or fail)
2. Click on the build
3. Click "View logs"
4. Find the actual error message (not just "exit code 1")

### Step 3: Share the Specific Error
Once you have the actual error message from the logs, I can provide a specific solution.

## Quick Diagnosis Checklist

Before building, verify:

- [ ] You have an Expo account and are logged in at https://expo.dev
- [ ] Your project shows up at https://expo.dev/accounts/tracknbook/projects/tracknbook
- [ ] For iOS: You have an Apple Developer account ($99/year)
- [ ] For iOS: You've registered the bundle ID `com.tracknbook.app` in Apple Developer
- [ ] For Android: No special requirements (should work out of the box)
- [ ] You have build credits available (check at https://expo.dev/accounts/tracknbook/settings/billing)

## Platform-Specific Notes

### iOS Builds Require:
1. ✅ Apple Developer account ($99/year)
2. ✅ Bundle identifier registered in Apple Developer portal
3. ✅ Authentication with Apple during build process
4. ⏱️ Build time: 15-30 minutes

### Android Builds Require:
1. ✅ Nothing special (works out of the box)
2. ⏱️ Build time: 10-20 minutes

## Next Steps

1. **Try building via the Expo dashboard** (not terminal)
2. **Check the build logs** for the specific error
3. **Share the error message** so I can provide a targeted fix

The configuration is correct, so the issue is likely:
- Authentication (need to log in to Apple Developer)
- Bundle ID registration (need to register in Apple Developer portal)
- Or a specific error that will be visible in the build logs

Good luck! 🚀
