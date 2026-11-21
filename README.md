# SkillBarter Mobile (iOS & Android)

SkillBarter Mobile is the official cross-platform mobile client for the SkillBarter network. It connects individuals who trade skills reciprocally without monetary transactions (e.g. software development for language tutoring).

The application is built with **React Native**, **Expo SDK 52**, **Expo Router v4**, **TypeScript (Strict Mode)**, **TanStack React Query**, and connects directly to the existing **SkillBarter-Next Express.js API (`/api/v1`)** and **MongoDB** database.

---

## Key Features

- **Authentication & Security:** Registration, login, email verification, password reset, token-based session restoration, and hardware-encrypted JWT storage via `Expo SecureStore`.
- **Multi-Step Onboarding:** Personal profile, offered skills, wanted skills, proficiency ratings, and session format preferences.
- **Personalized Dashboard:** Welcome stats, reputation scores, pending barter alerts, and recommended reciprocal matches.
- **Discover & Reciprocal Match Engine:** Category filtering, search, session format filters, and algorithmic reciprocal compatibility scoring (up to 95%).
- **Exchange Lifecycle Management:** Propose barters, accept/decline incoming requests, schedule sessions with Google Meet links, confirm mutual completions, and dispute handling.
- **Messaging:** Direct conversation threads with barter partners, automatic unread counters, and periodic polling sync.
- **Notifications Center:** Real-time and polling alerts for exchanges, sessions, messages, and reviews with one-tap read actions.
- **Reviews & Ratings:** 1-5 star ratings and reviews unlocked exclusively after mutual exchange completion.
- **Community:** Member discussion posts and peer connection networking.
- **Safety Center:** Two-way user blocking, unblocking, and moderation reporting.
- **Admin Portal:** Role-guarded platform metrics, user directory with suspension toggles, moderation reports queue, and audit trail.

---

## Architecture & Technology Stack

- **Framework:** React Native 0.76.9 (New Architecture enabled)
- **App Platform:** Expo SDK 52
- **Routing:** Expo Router v4 (File-based navigation)
- **State Management:** TanStack React Query v5 (Server state) & React Context (Auth state)
- **Validation:** Zod 3.24 & React Hook Form
- **Secure Persistence:** Expo SecureStore (iOS Keychain & Android KeyStore)
- **Styling:** Custom design system tokens (`constants/theme.ts`) optimized for iOS & Android
- **Testing:** Vitest test runner with 100% passing automated test suites

---

## Directory Layout

```text
SkillBarter-Mobile/
├── app/                        # Expo Router navigation routes
│   ├── _layout.tsx             # Root layout with Query & Auth Providers
│   ├── (auth)/                 # Login, signup, verify-email, forgot-password
│   ├── (onboarding)/           # Welcome, profile, skills, preferences
│   ├── (tabs)/                 # Bottom tab bar (Home, Discover, Exchanges, Messages, Profile)
│   ├── exchanges/              # Exchange details & new barter proposal
│   ├── conversations/          # Direct messaging thread
│   ├── profiles/               # Public member profile with reviews & skills
│   ├── notifications/          # Notification inbox & badge management
│   ├── settings/               # App settings, privacy toggle, sign out
│   ├── community/              # Feed discussions & connections
│   ├── safety/                 # Blocked users & moderation reporting
│   └── admin/                  # Role-protected administrator dashboard
├── components/                 # Reusable design system components
│   ├── common/                 # Button, Input, Card, Badge, Avatar, Skeleton
│   ├── feedback/               # EmptyState, ErrorAlert, LoadingSpinner
│   ├── navigation/             # Header, BackButton, TabIcon
│   └── cards/                  # MatchCard, ExchangeCard, SessionCard, ReviewCard
├── services/                   # Network & API layer
│   ├── api/                    # Centralized typed HTTP client with Bearer & 401 refresh
│   └── auth/                   # SecureStore token storage
├── context/                    # AuthContext provider
├── constants/                  # Color palette, spacing, typography
├── utils/                      # Validators and formatting helpers
├── docs/                       # Migration analysis, API contracts, testing reports
└── tests/                      # Automated unit, API, security, and E2E acceptance tests
```

---

## Prerequisites

- **Node.js:** `>= 20.11.0` (Node 22 recommended)
- **npm:** `>= 10.2.0`
- **Expo CLI / EAS CLI:** Installed automatically or globally (`npm install -g eas-cli`)
- **Backend API:** The existing SkillBarter-Next Express.js API running on `http://localhost:4000`

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
# Windows PowerShell
Copy-Item .env.example .env
```

Set the backend API URL:
- **Android Emulator:** `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1`
- **iOS Simulator / Local:** `EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1`
- **Physical Device:** `EXPO_PUBLIC_API_URL=http://<YOUR-COMPUTER-LAN-IP>:4000/api/v1`

### 3. Run Development Server

```bash
npm start
```

Press:
- `a` to open Android emulator
- `i` to open iOS simulator
- `w` to open in web browser
- Or scan the QR code with the Expo Go app on a physical device.

---

## Verification & Testing

### Run TypeScript Verification
```bash
npm run typecheck
```

### Run Automated Tests
```bash
npm test
```
Executes all 27 automated test suites:
- Form validation schemas
- Token storage & security wipes
- API client headers & token refresh loop
- Complete 18-step Two-User End-to-End Acceptance Journey & boundary invariant checks

---

## Building for Production

Configure your Expo Application Services (EAS) credentials and run:

### Android Production Build (AAB)
```bash
eas build --platform android --profile production
```

### iOS Production Build (IPA)
```bash
eas build --platform ios --profile production
```

For detailed release requirements and store submission guidance, see:
[`docs/RELEASE-READINESS.md`](docs/RELEASE-READINESS.md).

---

## Documentation Index

- [Mobile Migration Analysis](docs/MOBILE-MIGRATION-ANALYSIS.md)
- [Mobile API Integration Reference](docs/MOBILE-API-INTEGRATION.md)
- [Architecture Specification](docs/ARCHITECTURE.md)
- [Automated Testing Report](docs/TESTING-REPORT.md)
- [Release Readiness & Store Guide](file:///c:/Users/vigne/OneDrive/Desktop/SkillBarter-Mobile/docs/RELEASE-READINESS.md)
