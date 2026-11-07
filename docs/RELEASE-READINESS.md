# SkillBarter Mobile Release Readiness & Deployment Guide

This document establishes the production readiness status, release requirements, build configurations, and store submission guidelines for the SkillBarter Mobile applications on Android (Google Play) and iOS (Apple App Store).

---

## 1. Application Identification & Configuration

| Parameter | Android | iOS |
|---|---|---|
| **App Name** | SkillBarter | SkillBarter |
| **Package / Bundle ID** | `com.skillbarter.mobile` | `com.skillbarter.mobile` |
| **Scheme** | `skillbarter://` | `skillbarter://` |
| **SDK Version** | Expo SDK 52 (React Native 0.76.7) | Expo SDK 52 (React Native 0.76.7) |
| **Architecture** | React Native New Architecture (`newArchEnabled: true`) | React Native New Architecture (`newArchEnabled: true`) |
| **Orientation** | Portrait | Portrait (Tablet Supported) |
| **Target OS Version** | Android 7.0+ (API level 24+) | iOS 15.1+ |

---

## 2. Permissions & Compliance

### 2.1 Android (`android/app/src/main/AndroidManifest.xml`)
- `android.permission.INTERNET`: Required to communicate with the Express REST API.
- `android.permission.READ_EXTERNAL_STORAGE`: Required to select user avatar images.

### 2.2 iOS (`ios/SkillBarter/Info.plist`)
- `NSCameraUsageDescription`: "SkillBarter uses the camera to update your profile photo."
- `NSPhotoLibraryUsageDescription`: "SkillBarter requires access to your photo library to select a profile avatar."

---

## 3. Expo Application Services (EAS) Build Profiles

Configured in `eas.json`:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://10.0.2.2:4000/api/v1"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://staging-api.skillbarter.com/api/v1"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.skillbarter.com/api/v1"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

---

## 4. Build Instructions

### 4.1 Prerequisites
1. Node.js >= 20.11.0 (Node 22 recommended)
2. npm >= 10.2.0
3. EAS CLI installed: `npm install -g eas-cli`
4. Active Expo account: `eas login`

### 4.2 Building Android Release
To generate an Android App Bundle (AAB) for Google Play:
```bash
eas build --platform android --profile production
```
To generate an installable APK for internal device testing:
```bash
eas build --platform android --profile preview
```

### 4.3 Building iOS Release
To generate an iOS IPA for TestFlight / App Store:
```bash
eas build --platform ios --profile production
```
To generate an iOS Simulator build:
```bash
eas build --platform ios --profile development
```

### 4.4 Local Native Prebuild (Without EAS Cloud)
To eject/prebuild local `android` and `ios` native projects:
```bash
npx expo prebuild
```
Then build natively:
- **Android:**
  ```bash
  cd android
  ./gradlew bundleRelease
  ```
- **iOS (requires macOS + Xcode):**
  ```bash
  cd ios
  pod install
  xcodebuild -workspace SkillBarter.xcworkspace -scheme SkillBarter -configuration Release
  ```

---

## 5. Store Metadata Preparation

### 5.1 App Store (iOS)
- **Primary Category:** Education / Networking
- **Secondary Category:** Social Networking
- **Keywords:** skill exchange, barter, learning, tutoring, coding mentorship, language exchange, peer learning
- **Support URL:** `https://skillbarter.com/support`
- **Marketing URL:** `https://skillbarter.com`
- **Privacy Policy URL:** `https://skillbarter.com/privacy`

### 5.2 Google Play Store (Android)
- **App Category:** Education
- **Content Rating:** Everyone / PEGI 3
- **Data Safety:** Account credentials (encrypted in transit), user profiles, messages (stored on backend server). No financial data collected.

---

## 6. Known External Requirements & Account Dependencies

1. **Google Play Console:** An active Google Play Developer account ($25 one-time registration) is required to publish the Android App Bundle.
2. **Apple Developer Program:** An active Apple Developer Program membership ($99/year) is required for TestFlight distribution, Apple certificates, provisioning profiles, and App Store publication.
3. **EAS Project ID:** Replace `placeholder-skillbarter-project-id` in `app.json` with your real EAS project ID generated via `eas project:init`.
4. **Push Notification Credentials:** When enabling APNs (Apple Push Notification service) and FCM (Firebase Cloud Messaging) for background notifications, register service keys in Expo dashboard.
