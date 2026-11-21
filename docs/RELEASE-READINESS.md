# SkillBarter Mobile — Release Readiness

This document reflects the tracked configuration on the `ui/bhuvan` branch. A successful JavaScript bundle export does not prove that a signed installable app, live backend, or store submission is ready.

## 1. App identity (verified from `app.json`)

| Setting | Android | iOS |
|---|---|---|
| App name | SkillBarter | SkillBarter |
| Application identifier | `com.skillbarter.mobile` | `com.skillbarter.mobile` |
| URL scheme | `skillbarter://` | `skillbarter://` |
| Expo SDK | 52 | 52 |
| React Native | 0.76.9 (from `package.json`) | 0.76.9 (from `package.json`) |
| New Architecture | Enabled | Enabled |
| Tablet support | N/A | Enabled |

## 2. Build profiles (verified from `eas.json`)

- **development:** internal distribution, development client enabled, API URL `http://10.0.2.2:4000/api/v1`.
- **preview:** internal distribution, Android APK, API URL currently set to `https://api.skillbarter.com/api/v1`.
- **production:** Android App Bundle, physical iOS build, API URL `https://api.skillbarter.com/api/v1`.

Important: the preview profile currently points to the production API, not a staging API. Do not use it for testing against production data. A dedicated staging API URL must be confirmed and configured before staging builds are made.

## 3. Current release blockers

1. **EAS project linking:** `app.json` currently contains `"extra": { "eas": {} }`; no `extra.eas.projectId` is configured. The Expo project must be linked before EAS cloud builds can run. Do not invent a project UUID.
2. **Expo authentication:** an authorized Expo account/session or CI `EXPO_TOKEN` is required to start cloud builds. Availability of a token in repository secrets has not been verified.
3. **Staging target:** preview currently points to `https://api.skillbarter.com/api/v1`, which is the production URL. Confirm a working staging endpoint before preview testing.
4. **Store accounts and signing:** Google Play Console and Apple Developer account access, signing credentials, and store identifiers have not been verified.
5. **Device validation:** test install, signup, login, verification, onboarding, API connectivity, notifications, and core exchange journeys on real Android and iOS devices.
6. **Privacy and store declarations:** verify the live privacy policy, support URL, data-safety disclosures, age/content rating, and permission justifications before submission. Values in older drafts are not treated as verified.

## 4. Commands

Install dependencies and validate locally:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npx expo export --platform android
npx expo export --platform ios
```

After the project is linked and Expo authentication is available:

```bash
eas build --platform android --profile preview
eas build --platform android --profile production
eas build --platform ios --profile production
```

The preview command currently targets the production API; do not distribute that build as a staging build until its API URL is corrected.

## 5. Permissions (verified from `app.json`)

- Android: INTERNET, READ_EXTERNAL_STORAGE, CAMERA.
- iOS usage descriptions: camera and photo-library access for profile photos.

Review whether every permission is still required by the implemented app and current target SDK policies. Remove unused permissions rather than requesting them pre-emptively.

## 6. Release status

**Status: not yet build-ready for EAS cloud distribution.** The app configuration and CI bundle checks are present, but EAS project linking, Expo authentication, a genuine staging API target, signed device builds, and device-level acceptance testing remain outstanding.
