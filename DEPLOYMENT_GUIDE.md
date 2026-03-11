
# TrackNBook - App Store Deployment Guide

This guide will walk you through the steps to deploy your TrackNBook app to the Apple App Store and Google Play Store.

## Prerequisites

Before you begin, make sure you have:
- An Apple Developer Account ($99/year) - https://developer.apple.com
- A Google Play Developer Account ($25 one-time fee) - https://play.google.com/console
- EAS CLI installed globally
- An Expo account

## Step 1: Configure Your Expo Account

### 1.1 Get Your Expo Username
1. Go to https://expo.dev
2. Sign in or create an account
3. Your username is shown in the top right corner (e.g., @yourname)

### 1.2 Update app.json
Open `app.json` and replace:
- `"owner": "YOUR_EXPO_USERNAME"` → Your actual Expo username (without the @)

Example: `"owner": "johnsmith"`

## Step 2: Create an EAS Project

### 2.1 Link Your Project to EAS
You need to create an EAS project to get your project ID.

The EAS project ID will be automatically generated when you run your first build. For now, you can leave `"projectId": "YOUR_EAS_PROJECT_ID"` as is - it will be filled in automatically.

## Step 3: iOS App Store Setup

### 3.1 Create App Store Connect App
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: TrackNBook
   - **Primary Language**: English
   - **Bundle ID**: Select "com.tracknbook.app" (you'll need to register this in your Apple Developer account first)
   - **SKU**: tracknbook-ios (or any unique identifier)

### 3.2 Register Bundle Identifier
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click "+" to register a new identifier
3. Select "App IDs" → Continue
4. Select "App" → Continue
5. Fill in:
   - **Description**: TrackNBook
   - **Bundle ID**: com.tracknbook.app (Explicit)
   - **Capabilities**: Enable "Push Notifications" if needed
6. Click "Continue" → "Register"

### 3.3 Get Your Team ID
1. Go to https://developer.apple.com/account
2. Click "Membership" in the sidebar
3. Copy your **Team ID** (10-character code like "ABC123XYZ4")

### 3.4 Update eas.json
Open `eas.json` and in the `submit.production.ios` section, replace:
- `"appleId"`: Your Apple ID email (e.g., "john@example.com")
- `"ascAppId"`: Your App Store Connect App ID (found in App Store Connect under App Information)
- `"appleTeamId"`: Your Team ID from step 3.3

## Step 4: Android Play Store Setup

### 4.1 Create Play Console App
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - **App name**: TrackNBook
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free (or Paid if applicable)
4. Accept declarations and click "Create app"

### 4.2 Create Service Account for Automated Publishing
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Google Play Android Developer API"
4. Go to "IAM & Admin" → "Service Accounts"
5. Click "Create Service Account"
6. Name it "eas-submit" → Create
7. Click on the service account → "Keys" tab → "Add Key" → "Create new key" → JSON
8. Save the JSON file as `google-play-service-account.json` in your project root
9. Go back to Play Console → "Setup" → "API access"
10. Link the service account and grant "Release manager" permissions

### 4.3 Verify Package Name
The package name in `app.json` is already set to `com.tracknbook.app`. This will be automatically registered when you upload your first build.

## Step 5: Build Your App

### 5.1 iOS Build
This command will build your iOS app and upload it to App Store Connect:

```bash
eas build --platform ios --profile production
```

**What happens:**
- EAS will prompt you to log in to your Apple Developer account
- It will automatically create certificates and provisioning profiles
- The build will take 15-30 minutes
- Once complete, the app will be automatically uploaded to App Store Connect

### 5.2 Android Build
This command will build your Android app bundle:

```bash
eas build --platform android --profile production
```

**What happens:**
- EAS will create a keystore for signing your app
- The build will take 10-20 minutes
- You'll get an `.aab` file (Android App Bundle)

## Step 6: Submit to App Stores

### 6.1 Submit to iOS App Store
After your iOS build completes:

```bash
eas submit --platform ios --profile production
```

This will automatically upload your app to App Store Connect for review.

Then:
1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Fill in required metadata:
   - App description
   - Screenshots (required sizes: 6.5", 5.5")
   - App icon
   - Privacy policy URL
   - Support URL
4. Click "Submit for Review"

### 6.2 Submit to Google Play Store
After your Android build completes:

```bash
eas submit --platform android --profile production
```

This will automatically upload your app to Google Play Console.

Then:
1. Go to https://play.google.com/console
2. Select your app
3. Complete the store listing:
   - App description
   - Screenshots (phone, tablet)
   - Feature graphic (1024x500)
   - App icon
   - Privacy policy URL
4. Complete content rating questionnaire
5. Set up pricing & distribution
6. Click "Send for review"

## Step 7: App Review Timeline

- **iOS**: Typically 1-3 days for initial review
- **Android**: Typically 1-7 days for initial review

You'll receive email notifications about the review status.

## Common Issues & Solutions

### Issue: "No bundle identifier found"
**Solution**: Make sure you've registered the bundle ID in your Apple Developer account (Step 3.2)

### Issue: "Invalid provisioning profile"
**Solution**: Run `eas credentials` and reset your credentials, then rebuild

### Issue: "Build failed with exit code 1"
**Solution**: Check that all placeholders in `app.json` and `eas.json` are filled in correctly

### Issue: "Missing required icon sizes"
**Solution**: Make sure your `assets/icon.png` is at least 1024x1024 pixels

## Need Help?

- EAS Build Documentation: https://docs.expo.dev/build/introduction/
- EAS Submit Documentation: https://docs.expo.dev/submit/introduction/
- Expo Forums: https://forums.expo.dev/

## Summary Checklist

Before running your first build, make sure you've completed:

- [ ] Updated `app.json` with your Expo username
- [ ] Created App Store Connect app (iOS)
- [ ] Registered bundle identifier in Apple Developer account (iOS)
- [ ] Updated `eas.json` with Apple IDs and Team ID (iOS)
- [ ] Created Google Play Console app (Android)
- [ ] Created service account JSON file (Android)
- [ ] Verified all placeholder values are replaced

Once everything is configured, you can build and submit with:

```bash
# Build both platforms
eas build --platform all --profile production

# Submit both platforms (after builds complete)
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

Good luck with your app launch! 🚀
