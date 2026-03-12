
# EAS Build Troubleshooting Guide

## Latest Fixes Applied (Generation 21)

### ✅ Fix 1: Critical - Fixed tsconfig.json Trailing Comma
**Problem:** The `tsconfig.json` file had a trailing comma in the `include` array after `"workbox-config.js",` which causes JSON parsing errors during EAS builds. This is the most common cause of "exit code 1" build failures.

**Solution:** Removed the trailing comma from the `include` array in `tsconfig.json`.

```json
"include": [
  "**/*.ts",
  "**/*.tsx",
  ".expo/types/**/*.ts",
  "expo-env.d.ts",
  "workbox-config.js"
]
```

### ✅ Fix 2: Added EAS_BUILD Environment Check
**Problem:** Development-only code (custom Metro middleware, editable components) could interfere with production builds.

**Solution:** Added `process.env.EAS_BUILD !== "true"` checks to both `metro.config.js` and `babel.config.js` to ensure development features are completely disabled during EAS builds.

### ✅ Fix 3: Updated eas.json with EAS_BUILD Flag
**Problem:** The build environment wasn't explicitly marked as an EAS build.

**Solution:** Added `"EAS_BUILD": "true"` to all build profiles in `eas.json` to ensure proper environment detection.

## Previous Fixes (Generation 20 - Still Applied)

### ✅ Fix 1: EAS.json Environment Variables
**Problem:** The `env` configuration in `eas.json` was at the wrong nesting level, which could cause the production environment to not be set correctly.

**Solution:** Moved `NODE_ENV: "production"` inside both the `ios` and `android` sections of the production profile.

```json
"production": {
  "ios": {
    "env": { "NODE_ENV": "production" }
  },
  "android": {
    "env": { "NODE_ENV": "production" }
  }
}
```

### ✅ Fix 2: Removed New Architecture Flag
**Problem:** The `newArchEnabled: true` flag in `app.json` can cause build issues if not all dependencies support the new architecture.

**Solution:** Removed the `newArchEnabled` flag from `app.json` to use the stable architecture.

### ✅ Fix 3: Updated .easignore
**Problem:** Some development files might have been included in builds unnecessarily.

**Solution:** Updated `.easignore` to explicitly exclude `.npmrc`, `.hotreload`, and other development-only files.

### ✅ Fix 4: Babel Config Production Check
**Problem:** Babel plugins for editable components should only run in development, not during production builds.

**Solution:** Changed the condition from `process.env.NODE_ENV === "development"` to `process.env.NODE_ENV !== "production"` to be more explicit.

## Previous Fixes (Still Applied)

### ✅ Babel Plugins Configuration
- Removed `babel-plugins/` from `.easignore` so plugins are included in builds
- Fixed typo: `react-native-worklets/plugin` → `react-native-reanimated/plugin`
- Made editable components plugins conditional (development only)

### ✅ Android Adaptive Icon
- Changed to use `./assets/icon.png` (standard app icon)

### ✅ Package.json Cleanup
- Moved web-only dependencies to `devDependencies`
- Ensured native dependencies are in `dependencies`

## How to Verify Your Build

### Step 1: Check Your EAS Configuration
Ensure your `app.json` has the correct owner and project ID:
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

### Step 2: Verify eas.json Structure
Your `eas.json` should have `env` variables inside platform-specific sections:
```json
{
  "build": {
    "production": {
      "ios": {
        "env": { 
          "NODE_ENV": "production",
          "EAS_BUILD": "true"
        }
      },
      "android": {
        "env": { 
          "NODE_ENV": "production",
          "EAS_BUILD": "true"
        }
      }
    }
  }
}
```

### Step 3: Check Build Logs
When a build fails:
1. Go to https://expo.dev/accounts/tracknbook/projects/tracknbook/builds
2. Click on the failed build
3. Look for specific error messages

Common error patterns:
- **"Cannot find module"** → Missing dependency or incorrect import
- **"Duplicate module"** → Conflicting dependencies
- **"Gradle build failed"** (Android) → Native module or SDK issue
- **"Pod install failed"** (iOS) → CocoaPods or native module issue
- **"Metro bundler error"** → JavaScript bundling issue
- **"JSON parse error"** → Syntax error in JSON config files (check for trailing commas!)

## Common Build Failures and Solutions

### Issue: JSON Parse Errors / Exit Code 1
**Symptoms:** Build fails immediately with "exit code 1" or JSON parsing errors
**Solutions:**
- Check `tsconfig.json` for trailing commas (MOST COMMON)
- Check `app.json` for syntax errors
- Check `eas.json` for syntax errors
- Verify all JSON files are valid (no trailing commas, proper quotes)

### Issue: Metro Bundler Errors
**Symptoms:** Errors during JavaScript bundling phase
**Solutions:**
- Ensure all imports are correct
- Check that platform-specific files (.ios.tsx, .android.tsx) exist
- Verify no web-only imports in native code

### Issue: Native Module Compilation Errors
**Symptoms:** Errors during native code compilation (Gradle/Xcode)
**Solutions:**
- Check that all native dependencies are compatible with Expo SDK 54
- Verify plugin configuration in `app.json`
- Ensure no conflicting native module versions

### Issue: Asset Loading Errors
**Symptoms:** Cannot find images or fonts
**Solutions:**
- Verify all asset paths in `app.json` are correct
- Check that `assetBundlePatterns` includes all necessary files
- Ensure icon files exist at specified paths

## Platform-Specific Notes

### iOS Builds
- Requires valid Apple Developer account
- Code signing is handled automatically by EAS
- Build time: typically 15-25 minutes

### Android Builds
- Produces `.aab` (app bundle) for production
- Build time: typically 10-20 minutes
- Signing is handled automatically by EAS

## What Changed in This Fix (Generation 21)

1. **tsconfig.json**: Removed trailing comma in `include` array (CRITICAL FIX)
2. **metro.config.js**: Added `EAS_BUILD !== "true"` check to disable dev middleware during builds
3. **babel.config.js**: Added `EAS_BUILD !== "true"` check to disable editable components during builds
4. **eas.json**: Added `"EAS_BUILD": "true"` environment variable to all build profiles

## Next Steps

After applying these fixes:
1. Commit all changes to your repository
2. Trigger a new EAS build
3. Monitor the build logs for any errors
4. If the build still fails, check the specific error message in the logs

## Getting More Help

If builds continue to fail:
1. **Check the exact error message** in the EAS build logs
2. **Verify your Expo account** has proper permissions
3. **Ensure your project is properly linked** to your EAS account
4. **Look for platform-specific errors** (iOS vs Android)

The error message will tell you exactly what's wrong. Common issues:
- Missing or incorrect credentials
- Incompatible dependencies
- Incorrect configuration
- Asset loading problems
- JSON syntax errors (trailing commas!)

## Summary of All Applied Fixes

✅ **CRITICAL**: Fixed trailing comma in tsconfig.json (Generation 21)
✅ Added EAS_BUILD environment checks to metro.config.js (Generation 21)
✅ Added EAS_BUILD environment checks to babel.config.js (Generation 21)
✅ Added EAS_BUILD flag to eas.json build profiles (Generation 21)
✅ Fixed eas.json env variable placement (ios/android specific)
✅ Removed newArchEnabled flag from app.json
✅ Updated .easignore to exclude more dev files
✅ Improved babel.config.js production check
✅ Fixed babel plugin typo (react-native-reanimated)
✅ Ensured babel-plugins are included in builds
✅ Fixed Android adaptive icon path
✅ Moved web-only dependencies to devDependencies
✅ Added explicit NODE_ENV=production to build profiles

Your build configuration is now optimized for EAS. The trailing comma fix should resolve the "exit code 1" error. If you're still experiencing issues, please share the specific error message from the build logs.
