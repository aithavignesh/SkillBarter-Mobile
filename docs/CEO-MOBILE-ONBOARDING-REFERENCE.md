# CEO Mobile Signup and Onboarding Reference

## Design direction
The mobile signup/onboarding experience follows the CEO's EV Academy reference direction without copying its branding:
- Near-black/navy background
- Electric-blue primary actions and highlights
- Dedicated mobile layouts, spacing and navigation
- SkillBarter identity and skill-exchange messaging

## Implemented entry flow
1. Welcome screen with a working, accessible Get Started action
2. Signup/login choice screen
3. Signup form using the existing mobile AuthContext and Express API
4. Login form using the existing mobile AuthContext and Express API
5. Email verification screen using the backend's existing verification-token contract
6. Existing profile, offered/wanted skills and exchange-preferences onboarding screens

## Backend contract
The existing Express API exposes `POST /auth/verify-email` with a `token` string. It does not currently expose a numeric four-digit OTP verification contract. The mobile UI therefore uses the supported email-token flow rather than displaying a fake OTP input.

Unverified users may continue to profile onboarding according to the existing backend onboarding flow; protected features remain governed by server-side email-verification checks.

## Validation
The Mobile CI workflow runs:
- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npx expo export --platform android`
- `npx expo export --platform ios`

A successful Expo export is a bundle validation, not a substitute for physical Android/iOS device testing or real staging API delivery verification.
