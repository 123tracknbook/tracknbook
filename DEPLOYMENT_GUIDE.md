
# TrackNBook - App Store Deployment Guide

This guide covers everything you need to do to get your TrackNBook app on the Apple App Store and Google Play Store.

## ✅ What's Already Done (Completed by Natively)

1. ✅ App configuration in `app.json` with proper bundle identifiers
2. ✅ EAS Build configuration in `eas.json` for production builds
3. ✅ iOS permissions configured (Camera, Photo Library, Microphone)
4. ✅ Android permissions configured
5. ✅ WebView wrapper implementation for https://www.tracknbook.app
6. ✅ App Transport Security (ATS) exceptions for your domain
7. ✅ Edge-to-edge display configuration
8. ✅ Platform-specific code for iOS, Android, and Web
9. ✅ Push notifications setup (expo-notifications)
10. ✅ Camera/photo picker integration (expo-image-picker)

---

## 🚨 CRITICAL STEPS YOU MUST DO

### Step 1: Update Configuration Placeholders

Open `app.json` and replace these placeholder values:

```json
"owner": "YOUR_EXPO_USERNAME"  → Replace with your Expo account username
"eas.projectId": "YOUR_EAS_PROJECT_ID"  → Replace with your EAS project ID (get this in Step 3)
"updates.url": "https://u.expo.dev/YOUR_EAS_PROJECT_ID"  → Replace with your EAS project ID
```

Open `eas.json` and replace these placeholders (for submission):

```json
"appleId": "YOUR_APPLE_ID_EMAIL"  → Your Apple ID email
"ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"  → Get this from App Store Connect
"appleTeamId": "YOUR_APPLE_TEAM_ID"  → Get this from Apple Developer Portal
```

---

### Step 2: Apple Developer Program Enrollment

**Cost: $99/year**

1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with your Apple ID
3. Complete the enrollment process
4. Wait for approval (usually 24-48 hours)

**Why this is required:** You cannot submit apps to the App Store without an active Apple Developer Program membership.

---

### Step 3: Install EAS CLI and Initialize Project

You'll need to run these commands in your terminal:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Initialize EAS in your project (this creates the project ID)
eas build:configure
```

**What this does:**
- Creates an EAS project and gives you a project ID
- Links your local project to EAS Build servers
- Generates credentials for code signing

**Copy the project ID** that's generated and update it in `app.json` (Step 1).

---

### Step 4: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Click "My Apps" → "+" → "New App"
3. Fill in the required information:
   - **Platform:** iOS
   - **Name:** TrackNBook (or your preferred name)
   - **Primary Language:** English (or your choice)
   - **Bundle ID:** Select `com.tracknbook.app` (must match app.json)
   - **SKU:** Can be anything unique (e.g., "tracknbook-001")
   - **User Access:** Full Access

4. Save the **App ID** (numeric ID) - you'll need this for `eas.json`

---

### Step 5: Build Your iOS App

Run this command in your terminal:

```bash
# Build for iOS production
eas build --platform ios --profile production
```

**What happens:**
- EAS will ask about code signing - choose "Let EAS handle it" (recommended)
- Your app will be built on EAS servers (takes 10-20 minutes)
- You'll get a download link for the `.ipa` file

**Important:** Keep the terminal open or check your Expo dashboard for build status.

---

### Step 6: Upload to App Store Connect

**Option A: Using EAS Submit (Easiest)**

```bash
eas submit --platform ios --profile production
```

This automatically uploads your latest build to App Store Connect.

**Option B: Using Transporter App (Manual)**

1. Download Apple's Transporter app from the Mac App Store
2. Download your `.ipa` file from the EAS build
3. Open Transporter and drag the `.ipa` file into it
4. Click "Deliver" to upload to App Store Connect

---

### Step 7: Complete App Store Metadata

Go to App Store Connect → Your App → "App Information" and fill in:

#### Required Information:

1. **App Icon** (1024x1024 pixels)
   - Must be a PNG or JPEG
   - No transparency
   - No rounded corners (Apple adds them)

2. **Screenshots** (Required for at least one device size)
   - iPhone 6.7" Display (iPhone 14 Pro Max, 15 Pro Max)
   - iPhone 6.5" Display (iPhone 11 Pro Max, XS Max)
   - You need at least 1 screenshot, up to 10

3. **App Description**
   - What your app does
   - Key features
   - Benefits to users

4. **Keywords**
   - Comma-separated
   - Max 100 characters
   - Example: "booking,track,schedule,appointments,calendar"

5. **Support URL**
   - A webpage where users can get help
   - Example: https://www.tracknbook.app/support

6. **Privacy Policy URL** ⚠️ **REQUIRED**
   - A webpage explaining your privacy practices
   - Example: https://www.tracknbook.app/privacy

7. **Category**
   - Primary: Choose the most relevant (e.g., "Productivity", "Business")
   - Secondary: Optional

8. **Age Rating**
   - Complete the questionnaire
   - Be honest about content

9. **Pricing**
   - Free or Paid
   - Select countries/regions

---

### Step 8: App Review Information

In App Store Connect, provide:

1. **Contact Information**
   - First Name, Last Name
   - Phone Number
   - Email Address

2. **Demo Account** (if your app requires login)
   - Username/Email
   - Password
   - Any special instructions for reviewers

3. **Notes**
   - Explain that this is a web app wrapper
   - Mention any special features or functionality
   - Explain how to test key features

---

### Step 9: 🚨 CRITICAL - In-App Purchase Compliance

**This is the most common reason for rejection.**

If `www.tracknbook.app` allows users to:
- Purchase digital goods or services
- Subscribe to premium features
- Unlock content with payments
- Buy virtual items

**You MUST integrate Apple's In-App Purchase (IAP) system.**

Apple's rules:
- ❌ You CANNOT use external payment systems (Stripe, PayPal, etc.) for digital goods consumed in-app
- ✅ You MUST use Apple's IAP for subscriptions, premium features, digital content
- ✅ Physical goods/services (hotel bookings, real-world appointments) are exempt

**How to handle this:**

**Option 1: Use RevenueCat (Recommended - Coming Soon to Natively)**
- RevenueCat handles IAP complexity
- Works across iOS and Android
- Natively will support this soon

**Option 2: Disable Payments in the App**
- Remove payment buttons from the WebView
- Direct users to your website for purchases
- Use JavaScript injection to hide payment UI

**Option 3: Implement Native IAP**
- Use `expo-in-app-purchases` or `react-native-iap`
- Requires backend integration
- Complex but gives you full control

**If you're unsure:** Contact me and I can help you determine if IAP is required for your specific use case.

---

### Step 10: Submit for Review

1. In App Store Connect, go to your app
2. Click "Prepare for Submission"
3. Ensure all required fields are filled (green checkmarks)
4. Click "Submit for Review"

**Review Timeline:**
- Usually 24-48 hours
- Can take up to 7 days during busy periods
- You'll get email updates on status

---

## 🤖 Android / Google Play Store (Optional)

If you also want to publish on Android:

### Step 1: Create Google Play Console Account

**Cost: $25 one-time fee**

1. Go to https://play.google.com/console/signup
2. Pay the registration fee
3. Complete your account setup

### Step 2: Build Android App

```bash
eas build --platform android --profile production
```

This creates an `.aab` (Android App Bundle) file.

### Step 3: Create App in Google Play Console

1. Go to Google Play Console
2. Click "Create App"
3. Fill in app details
4. Upload your `.aab` file
5. Complete store listing (similar to App Store)

### Step 4: Submit for Review

Google's review is typically faster (1-3 days).

---

## 📋 Pre-Submission Checklist

Before submitting, verify:

- [ ] All placeholder values in `app.json` are replaced
- [ ] App icon is 1024x1024 PNG with no transparency
- [ ] Screenshots are prepared for required device sizes
- [ ] Privacy Policy URL is live and accessible
- [ ] Support URL is live and accessible
- [ ] App description is clear and accurate
- [ ] Demo account credentials work (if login required)
- [ ] You've tested the app on a physical iOS device
- [ ] In-App Purchase compliance is addressed (if applicable)
- [ ] Age rating questionnaire is completed
- [ ] Contact information is accurate

---

## 🆘 Common Rejection Reasons & How to Fix

### 1. "App is just a web view"

**Fix:** Emphasize native features in your App Review notes:
- "This app provides native push notifications for booking reminders"
- "Integrates device camera for profile photos"
- "Optimized native UI for iOS with edge-to-edge display"

### 2. "Missing In-App Purchase for digital goods"

**Fix:** See Step 9 above. Either:
- Implement IAP
- Remove payment functionality from the app
- Prove that your payments are for physical goods/services

### 3. "Privacy Policy missing or inadequate"

**Fix:** Ensure your privacy policy:
- Explains what data you collect
- How you use the data
- Third-party services you use
- User rights (access, deletion, etc.)

### 4. "App crashes on launch"

**Fix:** Test on a physical device before submitting:
- Borrow an iPhone from a friend
- Use TestFlight for beta testing
- Check crash logs in App Store Connect

### 5. "Misleading screenshots or description"

**Fix:** Ensure screenshots show actual app functionality, not marketing materials.

---

## 🧪 Testing Before Submission

### TestFlight (iOS Beta Testing)

1. After your first build, enable TestFlight in App Store Connect
2. Add internal testers (up to 100)
3. Share the TestFlight link with testers
4. Gather feedback before public release

```bash
# Build and auto-submit to TestFlight
eas build --platform ios --profile production --auto-submit
```

### Internal Testing (Android)

1. In Google Play Console, create an "Internal Testing" track
2. Upload your `.aab` file
3. Add testers by email
4. They can install via Play Store

---

## 📞 Need Help?

If you get stuck on any of these steps:

1. **Expo Documentation:** https://docs.expo.dev/
2. **EAS Build Docs:** https://docs.expo.dev/build/introduction/
3. **Apple Developer Support:** https://developer.apple.com/support/
4. **Expo Forums:** https://forums.expo.dev/

---

## 🎉 After Approval

Once your app is approved:

1. **Set Release Date:** You can release immediately or schedule a date
2. **Monitor Reviews:** Respond to user feedback in App Store Connect
3. **Track Analytics:** Use App Store Connect analytics
4. **Plan Updates:** Use EAS Update for over-the-air updates (currently disabled in your config)

---

## 💰 Cost Summary

- **Apple Developer Program:** $99/year (required for iOS)
- **Google Play Console:** $25 one-time (optional, for Android)
- **EAS Build:** Free tier available, paid plans for more builds
- **Total Minimum:** $99/year for iOS only

---

## ⏱️ Timeline Estimate

- **Configuration & Setup:** 1-2 hours
- **First Build:** 20-30 minutes
- **App Store Metadata:** 2-4 hours
- **Apple Review:** 24-48 hours (up to 7 days)
- **Total:** 3-5 days from start to App Store

---

## 🔄 Future Updates

To update your app after it's live:

```bash
# Make your code changes, then:
eas build --platform ios --profile production --auto-submit
```

Then in App Store Connect:
1. Create a new version
2. Upload the new build
3. Update "What's New" text
4. Submit for review

---

**Good luck with your App Store submission! 🚀**

If you have questions about any of these steps, feel free to ask!
