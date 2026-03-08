
# Quick Start - Get Your App on the App Store

This is the condensed version. For detailed explanations, see `DEPLOYMENT_GUIDE.md`.

## Prerequisites

- Mac computer (required for iOS builds)
- Apple Developer Program membership ($99/year)
- Expo account (free at expo.dev)

## Steps (In Order)

### 1. Update app.json

Replace these values in `app.json`:

```json
"owner": "your-expo-username"
"extra.eas.projectId": "your-project-id-from-step-3"
"updates.url": "https://u.expo.dev/your-project-id-from-step-3"
```

### 2. Join Apple Developer Program

- Go to https://developer.apple.com/programs/enroll/
- Pay $99/year
- Wait for approval (24-48 hours)

### 3. Install EAS CLI & Initialize

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Copy the project ID and update `app.json` (Step 1).

### 4. Create App in App Store Connect

- Go to https://appstoreconnect.apple.com/
- Create new app
- Bundle ID: `com.tracknbook.app`
- Save the App ID for later

### 5. Build Your App

```bash
eas build --platform ios --profile production
```

Wait 10-20 minutes for the build to complete.

### 6. Upload to App Store

```bash
eas submit --platform ios --profile production
```

### 7. Complete App Store Metadata

In App Store Connect, add:
- App icon (1024x1024)
- Screenshots (at least 1 device size)
- Description
- Keywords
- Privacy Policy URL ⚠️ **REQUIRED**
- Support URL
- Category
- Age rating

### 8. Submit for Review

Click "Submit for Review" in App Store Connect.

Wait 24-48 hours for Apple's review.

## 🚨 Critical Issues to Address

### In-App Purchases

If your web app (`www.tracknbook.app`) sells digital goods or subscriptions:
- ❌ You CANNOT use external payments (Stripe, PayPal)
- ✅ You MUST use Apple's In-App Purchase system

**Options:**
1. Wait for RevenueCat integration (coming soon to Natively)
2. Remove payment features from the app version
3. Implement native IAP manually

### Privacy Policy

You MUST have a live privacy policy URL. It should explain:
- What data you collect
- How you use it
- Third-party services
- User rights

## Testing Before Submission

Use TestFlight for beta testing:

```bash
eas build --platform ios --profile production --auto-submit
```

Then invite testers in App Store Connect → TestFlight.

## Cost

- Apple Developer Program: $99/year
- Google Play (optional): $25 one-time
- EAS Build: Free tier available

## Timeline

- Setup: 1-2 hours
- Build: 20-30 minutes
- Metadata: 2-4 hours
- Review: 24-48 hours
- **Total: 3-5 days**

## Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed explanations of each step.

**Good luck! 🚀**
