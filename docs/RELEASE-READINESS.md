# SkillBarter Mobile — Release Readiness

This document reflects the tracked mobile app configuration and the verified staging-preview target. A successful JavaScript bundle export does not prove that a signed installable app, live backend, or store submission is ready.

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
- **preview:** internal distribution, Android APK, API URL `https://skillbarter-next-api-staging.onrender.com/api/v1`.
- **production:** Android App Bundle, physical iOS build, API URL `https://api.skillbarter.com/api/v1`.

The staging API hostname is confirmed by the Render service configuration. The Render service has a successful live deployment, and the Vercel development preview has a branch-scoped `BACKEND_API_URL` environment variable whose configured value resolves to that staging host. This confirms the intended targets, but does not replace an authenticated app-to-API end-to-end test. Confirm CORS permits the actual Vercel preview origin before browser-based staging tests.

## 3. Current release blockers

1. **EAS project linking:** `app.json` currently contains `"extra": { "eas": {} }`; no `extra.eas.projectId` is configured. The Expo project must be linked before EAS cloud builds can run. Do not invent a project UUID.
2. **Expo authentication:** an authorized Expo account/session or CI `EXPO_TOKEN` is required to start cloud builds. Availability of a token in repository secrets has not been verified.
3. **Staging health and connectivity:** the Render service is deployed, but its dashboard health-check path is currently empty while the repository Blueprint specifies `/api/v1/ready`. Confirm database readiness and CORS from the actual staging client before distributing the APK.
4. **Database network policy:** the development Atlas project currently allows `0.0.0.0/0`. Restrict this after verifying stable service egress or a supported private networking option; do not replace it with an unverified IP.
5. **Store accounts and signing:** Google Play Console and Apple Developer account access, signing credentials, and store identifiers have not been verified.
6. **Device validation:** test install, signup, login, verification, onboarding, API connectivity, notifications, and core exchange journeys on real Android and iOS devices.
7. **Privacy and store declarations:** verify the live privacy policy, support URL, data-safety disclosures, age/content rating, and permission justifications before submission. Values in older drafts are not treated as verified.

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

The preview profile is configured for the staging API. Do not distribute a preview build until the staging health/readiness and client connectivity checks pass.

## 5. Permissions (verified from `app.json`)

- Android: INTERNET, READ_EXTERNAL_STORAGE, CAMERA.
- iOS usage descriptions: camera and photo-library access for profile photos.

Review whether every permission is still required by the implemented app and current target SDK policies. Remove unused permissions rather than requesting them pre-emptively.

## 6. Release status

**Status: not yet build-ready for EAS cloud distribution.** The preview API target is now configured to staging in the proposed change. EAS project linking, Expo authentication, staging health/CORS verification, signed device builds, and device-level acceptance testing remain outstanding.
