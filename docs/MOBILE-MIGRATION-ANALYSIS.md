# SkillBarter Mobile Migration Analysis

**Author:** Mobile Application Architect & Engineering Team  
**Date:** November 2026  
**Target Applications:** SkillBarter Mobile (iOS & Android)  
**Target Backend:** SkillBarter-Next Express.js API + MongoDB  

---

## 1. Executive Summary

SkillBarter is a decentralized skill-exchange marketplace connecting people who trade expertise reciprocally without monetary transactions (e.g., Python tutoring in exchange for UI/UX mentorship). The web platform is built on Next.js 15, an Express.js REST API (`/api/v1`), and MongoDB.

This document establishes the architectural migration analysis, technical feasibility, boundary contracts, and execution plan for the production-grade **SkillBarter Mobile Application** built with **React Native**, **Expo**, **TypeScript**, and **Expo Router**.

The mobile application connects directly to the existing Express.js backend and MongoDB database. It maintains 100% interoperability with existing web users, transactions, conversations, and records.

---

## 2. Existing Backend Architecture

### 2.1 Technology Stack
- **Runtime:** Node.js (>=20.11.0)
- **Framework:** Express.js 4.x
- **Database:** MongoDB with Mongoose ODM 8.x
- **Shared Contracts:** `@skillbarter/shared` (Zod schemas and TypeScript interfaces)
- **Security:** Helmet, Argon2id password hashing, JWT Access (15-min TTL) & Refresh tokens (7-day TTL), Rate limiting (`express-rate-limit`)
- **API Versioning:** Primary routes under `/api/v1/`, aliased to `/api/`

### 2.2 Domain Modules
The backend is structured into 12 distinct domain modules:
1. **Auth:** User registration, password verification, session tokens, email verification, password reset.
2. **Users:** User profiles, multi-step onboarding completion, profile updating, public profile retrieval with privacy rules.
3. **Skills:** Canonical skill catalog browsing, custom skill creation, user-specific skill offerings/wants management.
4. **Matches:** Algorithmic discover engine calculating reciprocal (95%), teaching (75%), learning (65%), and category overlap (55%) match scores.
5. **Exchanges:** Skill barter transaction lifecycle (`PENDING` -> `ACCEPTED` -> `SCHEDULED` -> `IN_PROGRESS` -> `COMPLETED`, plus `CANCELLED` / `DISPUTED`). Mutual completion confirmations.
6. **Sessions:** Calendar scheduling for exchanges, conflict detection, ISO 8601 timestamps, status transitions (`PROPOSED` -> `CONFIRMED` -> `COMPLETED` / `CANCELLED`).
7. **Messages:** Private direct conversation threads between barter partners with unread tracking and blocking enforcement.
8. **Notifications:** Real-time/polling alerts for exchanges, sessions, messages, and reviews with unread counts.
9. **Reviews:** 1-5 star ratings and reviews submitted exclusively after mutual exchange completion.
10. **Community:** Discussion posts and peer connection requests/networking.
11. **Safety:** Two-way user blocking, content/user moderation reporting, privacy visibility enforcement.
12. **Admin & Analytics:** Platform-level statistics, user suspension management, moderation report triage, audit logs, and event analytics.

---

## 3. Available API Endpoints & Contract Matrix

| Domain | Route | Method | Auth Req | Payload / Query | Notes |
|---|---|---|---|---|---|
| **Health** | `/api/v1/health` | GET | None | None | Service liveness |
| **Ready** | `/api/v1/ready` | GET | None | None | Database connection readiness |
| **Auth** | `/api/v1/auth/register` | POST | None | `RegisterInput` | Returns user, accessToken, verificationToken (dev) |
| **Auth** | `/api/v1/auth/login` | POST | None | `LoginInput` | Returns user, accessToken |
| **Auth** | `/api/v1/auth/logout` | POST | None | None | Clears session |
| **Auth** | `/api/v1/auth/me` | GET | Bearer | None | Returns current `AuthUser` |
| **Auth** | `/api/v1/auth/verify-email` | POST | None | `{ token }` | Verifies account |
| **Auth** | `/api/v1/auth/forgot-password` | POST | None | `{ email }` | Sends reset email / returns token in dev |
| **Auth** | `/api/v1/auth/reset-password` | POST | None | `{ token, newPassword }` | Resets password |
| **Auth** | `/api/v1/auth/change-password` | POST | Bearer | `{ currentPassword, newPassword }` | Updates password |
| **Auth** | `/api/v1/auth/refresh` | POST | None / Body | `{ refreshToken }` | Issues new accessToken |
| **Users** | `/api/v1/users/onboarding` | POST | Bearer | `OnboardingInput` | Sets displayName, skills, bio, format |
| **Users** | `/api/v1/users/:id` | GET | Optional | None | Returns `PublicUserProfile` |
| **Users** | `/api/v1/users/profile` | PATCH | Bearer | `ProfileUpdateInput` | Updates user details |
| **Skills** | `/api/v1/skills` | GET | Optional | `category, search, page` | Lists approved skills |
| **Skills** | `/api/v1/skills` | POST | Bearer | `SkillCreateInput` | Proposes new skill |
| **Skills** | `/api/v1/skills/user` | GET | Bearer | None | Authenticated user's skills |
| **Skills** | `/api/v1/skills/user` | POST | Bearer | `UserSkillCreateInput` | Adds offered/wanted skill |
| **Skills** | `/api/v1/skills/user/:id` | PATCH | Bearer | `UserSkillUpdateInput` | Updates proficiency/description |
| **Skills** | `/api/v1/skills/user/:id` | DELETE | Bearer | None | Deletes user skill |
| **Matches** | `/api/v1/matches/discover` | GET | Optional | `category, search, format, page` | Reciprocal match engine |
| **Exchanges** | `/api/v1/exchanges` | POST | Bearer | `CreateExchangeInput` | Starts new barter request |
| **Exchanges** | `/api/v1/exchanges` | GET | Bearer | `status` (query) | Lists user's exchanges |
| **Exchanges** | `/api/v1/exchanges/:id` | GET | Bearer | None | Fetches exchange details |
| **Exchanges** | `/api/v1/exchanges/:id/status` | PATCH | Bearer | `{ status, reason }` | Accepts/rejects/cancels exchange |
| **Exchanges** | `/api/v1/exchanges/:id/complete`| POST | Bearer | None | Confirms mutual completion |
| **Exchanges** | `/api/v1/exchanges/:id/dispute` | POST | Bearer | `{ reason }` | Raises dispute |
| **Sessions** | `/api/v1/exchanges/:id/sessions` | POST | Bearer | `CreateSessionInput` | Proposes exchange session |
| **Sessions** | `/api/v1/exchanges/:id/sessions` | GET | Bearer | None | Lists scheduled sessions |
| **Sessions** | `/api/v1/exchanges/:id/sessions/:sessionId` | PATCH | Bearer | `UpdateSessionStatusInput` | Confirms/cancels/completes session |
| **Messages** | `/api/v1/messages/conversations` | GET | Bearer | None | Lists user conversations |
| **Messages** | `/api/v1/messages/conversations` | POST | Bearer | `{ targetUserId }` | Finds or creates thread |
| **Messages** | `/api/v1/messages/conversations/:id` | GET | Bearer | `page` (query) | Fetches thread messages |
| **Messages** | `/api/v1/messages/conversations/:id` | POST | Bearer | `{ content }` | Sends private message |
| **Notifications** | `/api/v1/notifications` | GET | Bearer | `page` (query) | Lists notifications |
| **Notifications** | `/api/v1/notifications/unread-count` | GET | Bearer | None | Unread badge count |
| **Notifications** | `/api/v1/notifications/:id/read` | PATCH | Bearer | None | Marks notification read |
| **Notifications** | `/api/v1/notifications/mark-all-read` | POST | Bearer | None | Clears unread badge |
| **Reviews** | `/api/v1/reviews` | POST | Bearer | `CreateReviewInput` | Submits 1-5 rating & review |
| **Reviews** | `/api/v1/reviews/user/:userId` | GET | Optional | None | Reviews received by user |
| **Community** | `/api/v1/community/connections` | GET | Bearer | `status` (query) | Lists connections |
| **Community** | `/api/v1/community/connections` | POST | Bearer | `{ recipientId }` | Requests peer connection |
| **Community** | `/api/v1/community/connections/:id/accept` | PATCH | Bearer | None | Accepts connection |
| **Community** | `/api/v1/community/connections/:id` | DELETE | Bearer | None | Rejects/removes connection |
| **Community** | `/api/v1/community/posts` | GET | Optional | `page` (query) | Lists community feed |
| **Community** | `/api/v1/community/posts` | POST | Bearer | `CreatePostInput` | Creates community post |
| **Community** | `/api/v1/community/posts/:id` | DELETE | Bearer | None | Deletes post |
| **Safety** | `/api/v1/safety/block` | POST | Bearer | `{ userId, reason }` | Blocks user |
| **Safety** | `/api/v1/safety/block/:userId` | DELETE | Bearer | None | Unblocks user |
| **Safety** | `/api/v1/safety/blocked` | GET | Bearer | None | Lists blocked users |
| **Safety** | `/api/v1/safety/report` | POST | Bearer | `CreateReportInput` | Submits moderation report |
| **Admin** | `/api/v1/admin/bootstrap` | POST | None | `{ secretKey, ... }` | Bootstraps initial admin |
| **Admin** | `/api/v1/admin/stats` | GET | Admin Bearer | None | Metrics and counts |
| **Admin** | `/api/v1/admin/users` | GET | Admin Bearer | `page, search, role` | Admin user directory |
| **Admin** | `/api/v1/admin/users/:id` | PATCH | Admin Bearer | `AdminUpdateUserInput` | Suspends/updates role |
| **Admin** | `/api/v1/admin/reports` | GET | Admin Bearer | `page, status` | Moderation queue |
| **Admin** | `/api/v1/admin/reports/:id` | PATCH | Admin Bearer | `AdminReportActionInput` | Moderates report |
| **Admin** | `/api/v1/admin/audit-logs` | GET | Admin Bearer | `page` | Admin audit trail |
| **Analytics** | `/api/v1/analytics/track` | POST | Optional | `{ eventName, metadata }` | Logs analytics |
| **Analytics** | `/api/v1/analytics/summary` | GET | Admin Bearer | None | Metrics summary |

---

## 4. Authentication & Security Adaptation

### 4.1 Token Storage
- **Web:** Utilizes HTTP-only cookies (`accessToken` & `refreshToken`) plus local storage fallback.
- **Mobile Adaptation:** Native mobile environments cannot reliably depend on cookie-jar synchronizations across app restarts or background tasks. Mobile utilizes **Expo SecureStore** (backed by iOS Keychain and Android KeyStore) for hardware-encrypted storage of:
  - `access_token`
  - `refresh_token`
  - `current_user` JSON cache
- **Request Headers:** All authenticated requests attach `Authorization: Bearer <access_token>`.

### 4.2 Token Refresh Lifecycle
1. On HTTP 401 response with code `INVALID_TOKEN` or `EXPIRED_TOKEN`, the API client automatically pauses outbound queued requests.
2. It dispatches a refresh request: `POST /api/v1/auth/refresh` sending `{ refreshToken: <stored_refresh_token> }`.
3. Upon receiving the new `accessToken`, SecureStore updates and the paused requests retry with the new token.
4. If refresh fails or returns 401, all secure credentials are wiped and the user is redirected cleanly to the `(auth)/login` screen.

---

## 5. Web-to-Mobile UI & UX Adaptation

1. **Navigation Paradigm:**
   - Web: URL-driven with top Navbar and standard Footer.
   - Mobile: **Bottom Tabs** (`(tabs)/index`, `(tabs)/discover`, `(tabs)/exchanges`, `(tabs)/messages`, `(tabs)/profile`) with native Stack navigation for deep routes (`exchanges/[id]`, `conversations/[id]`, `profiles/[id]`, `notifications`, `settings`, `community`, `safety`, `admin`).
2. **Form Interaction:**
   - Native soft keyboard management using `KeyboardAvoidingView` and `react-hook-form` with `zodResolver`.
   - Date and time pickers for session scheduling formatted to ISO 8601 strings.
3. **List Performance:**
   - `FlatList` with `keyExtractor`, `ItemSeparatorComponent`, pull-to-refresh (`RefreshControl`), and skeleton loaders (`SkeletonCard`).
4. **Haptic Feedback & Native Modals:**
   - Platform-appropriate action sheets, confirmation alerts, and smooth transitions.

---

## 6. Testing Strategy

1. **TypeScript Verification:** Strict mode compiler checks (`tsc --noEmit`).
2. **Linting:** ESLint verification ensuring code health and import integrity.
3. **Unit & Component Testing:** Vitest / Jest tests covering API service methods, authentication state machine, form validation rules, and screen rendering.
4. **End-to-End Integration Testing:** Real two-user exchange lifecycle testing executing registration, onboarding, skill pairing, exchange proposal, session scheduling, messaging, completion confirmation, and review submission against the live Express backend.
5. **Platform Build Verification:** Expo prebuild and production build configuration for Android APK/AAB and iOS IPA.

---

## 7. Migration Readiness Checklist

- [x] Full audit of backend routes, parameters, and controllers.
- [x] Shared data models verified against Mongoose schemas.
- [x] Centralized API client design supporting Bearer tokens and token refresh.
- [x] Clear folder structure matching Expo Router specifications.
- [x] Branching model prepared (`main`, `development`, feature branches).
