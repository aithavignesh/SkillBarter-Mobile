# SkillBarter Mobile Architecture

## 1. System Overview

SkillBarter Mobile is a cross-platform client (iOS & Android) engineered with React Native, Expo (SDK 52), Expo Router v4, TypeScript (strict mode), TanStack React Query, React Hook Form with Zod validation schemas, and Expo SecureStore for encrypted token persistence.

The mobile app connects to the existing SkillBarter-Next Express.js backend and MongoDB database.

---

## 2. Directory Architecture

```text
SkillBarter-Mobile/
├── app/                        # Expo Router file-based navigation
│   ├── _layout.tsx             # Root layout with providers (Query, Auth, Theme)
│   ├── (auth)/                 # Public unauthenticated routes
│   │   ├── _layout.tsx
│   │   ├── login.tsx           # Email/password authentication
│   │   ├── signup.tsx          # Account registration
│   │   ├── verify-email.tsx    # Token-based email verification
│   │   ├── forgot-password.tsx # Password reset request
│   │   └── reset-password.tsx  # Password reset confirmation
│   ├── (onboarding)/           # New user onboarding flow
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # Welcome and profile overview
│   │   ├── profile.tsx         # Display name, bio, location, format
│   │   ├── skills.tsx          # Offered and wanted skills selection
│   │   └── preferences.tsx     # Availability and session format
│   ├── (tabs)/                 # Authenticated main tab navigation
│   │   ├── _layout.tsx         # Bottom tab bar configuration
│   │   ├── index.tsx           # Dashboard / Home
│   │   ├── discover.tsx        # Skill discovery & reciprocal match engine
│   │   ├── exchanges.tsx       # Active and past exchanges
│   │   ├── messages.tsx        # Conversation threads list
│   │   └── profile.tsx         # My profile & skills management
│   ├── exchanges/
│   │   ├── [id].tsx            # Exchange details, status actions, sessions
│   │   └── new.tsx             # Propose new exchange with user
│   ├── conversations/
│   │   └── [id].tsx            # Real-time/polling direct messaging thread
│   ├── profiles/
│   │   └── [id].tsx            # Public user profile view with skills & reviews
│   ├── notifications/
│   │   └── index.tsx           # Notifications center & unread management
│   ├── settings/
│   │   └── index.tsx           # App settings, account management, logout
│   ├── community/
│   │   └── index.tsx           # Feed posts and peer connections
│   ├── safety/
│   │   └── index.tsx           # Blocked users & reporting form
│   └── admin/
│       └── index.tsx           # Protected admin dashboard & moderation
├── components/                 # Reusable UI & presentation components
│   ├── common/                 # Button, Input, Card, Badge, Avatar, Skeleton
│   ├── feedback/               # EmptyState, ErrorAlert, LoadingSpinner
│   ├── navigation/             # Header, BackButton, TabIcon
│   └── cards/                  # MatchCard, ExchangeCard, SessionCard, ReviewCard
├── services/                   # Backend API communication layer
│   ├── api/                    # Centralized type-safe HTTP client with interceptors
│   ├── auth/                   # Secure token management (SecureStore)
│   └── notifications/          # Push & in-app notification handler
├── context/                    # React Context providers (AuthContext, ThemeContext)
├── hooks/                      # Custom React hooks (useAuth, useDebounce, etc.)
├── types/                      # TypeScript domain models and API contracts
├── constants/                  # Color palette, spacing, typography, endpoints
├── utils/                      # Formatting helpers, date manipulation, validators
├── docs/                       # Migration analysis, API contracts, test reports
└── tests/                      # Automated unit, integration, and E2E tests
```

---

## 3. State Management & Data Flow

1. **Server State (TanStack Query):**
   - Automatically handles caching, query invalidation, background refetching, and pagination for matches, exchanges, messages, notifications, and profiles.
   - Cache keys follow domain namespaces (`['matches']`, `['exchanges', id]`, `['conversations']`, etc.).
2. **Client State (React Context):**
   - `AuthContext`: Holds current user identity, authentication status (`idle` | `loading` | `authenticated` | `unauthenticated`), tokens, login/logout actions, and onboarding status.
   - Secure persistence backed by Expo SecureStore with fallback for testing environments.
3. **Form State (React Hook Form + Zod):**
   - Strictly validates input against shared Zod schemas (`loginSchema`, `registerSchema`, `onboardingSchema`, `createExchangeSchema`, etc.).
   - Provides instant inline validation feedback and prevents invalid payloads from reaching the network.

---

## 4. Design System & Theming

- **Palette:**
  - Primary: Indigo (`#4F46E5` / `#6366F1`)
  - Secondary: Emerald (`#10B981` / `#059669`)
  - Accent: Amber (`#F59E0B`)
  - Background Light: `#F8FAFC`, Dark: `#0F172A`
  - Surface Light: `#FFFFFF`, Dark: `#1E293B`
  - Text Primary Light: `#0F172A`, Dark: `#F8FAFC`
  - Text Secondary Light: `#64748B`, Dark: `#94A3B8`
  - Border Light: `#E2E8F0`, Dark: `#334155`
  - Danger: `#EF4444`, Success: `#10B981`
- **Typography:** System fonts optimized for iOS (San Francisco) and Android (Roboto), scale-safe sizing.
- **Elevation & Shadows:** Platform-adapted elevation (Android) and shadow offsets (iOS).

---

## 5. Security & Network Architecture

- All API communications run over HTTPS in staging/production.
- Sensitive authentication tokens are stored strictly in device hardware security modules (Keychain on iOS, Keystore on Android).
- Zero plaintext password storage on device.
- Automatic token expiration handling and silent refresh.
- In-memory data redaction for security logs.
