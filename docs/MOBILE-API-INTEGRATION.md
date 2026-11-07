# SkillBarter Mobile API Integration Reference

This document provides the canonical API contract reference for the SkillBarter Mobile Application connecting to the SkillBarter-Next Express.js backend.

**Base URL (Development):** `http://<LAN-IP>:4000/api/v1` or `http://localhost:4000/api/v1`  
**Base URL (Staging/Production):** Configured via `EXPO_PUBLIC_API_URL` environment variable  
**Content-Type:** `application/json`  
**Standard Auth Header:** `Authorization: Bearer <accessToken>`  

---

## 1. Response Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable explanation",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

Common Error Codes:
- `VALIDATION_ERROR`: Zod schema validation failed (HTTP 400)
- `UNAUTHORIZED`: Missing or malformed token (HTTP 401)
- `INVALID_TOKEN` / `EXPIRED_TOKEN`: Token expired or signature invalid (HTTP 401)
- `FORBIDDEN`: Lacks role or resource permission (HTTP 403)
- `ACCOUNT_SUSPENDED`: User account has an active administrative suspension (HTTP 403)
- `NOT_FOUND`: Resource was not found (HTTP 404)
- `CONFLICT`: Resource already exists (HTTP 409)
- `RATE_LIMIT_EXCEEDED`: Too many requests (HTTP 429)
- `INTERNAL_ERROR`: Unexpected server error (HTTP 500)

---

## 2. Authentication (`/auth`)

### 2.1 Register
- **POST** `/auth/register`
- **Auth:** None
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "displayName": "Alex Rivers"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "6724...",
        "email": "user@example.com",
        "displayName": "Alex Rivers",
        "role": "user",
        "isEmailVerified": false,
        "onboardingCompleted": false,
        "reputationScore": 100,
        "completedExchangesCount": 0,
        "createdAt": "2026-11-01T12:00:00.000Z"
      },
      "accessToken": "eyJhbGci...",
      "verificationToken": "raw-token-in-dev-only"
    }
  }
  ```

### 2.2 Login
- **POST** `/auth/login`
- **Auth:** None
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "user": { ... },
      "accessToken": "eyJhbGci..."
    }
  }
  ```

### 2.3 Logout
- **POST** `/auth/logout`
- **Auth:** Optional / Bearer
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Successfully logged out"
    }
  }
  ```

### 2.4 Get Current User (`/me`)
- **GET** `/auth/me`
- **Auth:** Bearer
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "6724...",
        "email": "user@example.com",
        "displayName": "Alex Rivers",
        "role": "user",
        "isEmailVerified": true,
        "onboardingCompleted": true,
        "bio": "Full-stack developer...",
        "location": "San Francisco, CA",
        "preferredSessionFormat": "video",
        "availability": "Weekday evenings",
        "reputationScore": 100,
        "completedExchangesCount": 0,
        "createdAt": "2026-11-01T12:00:00.000Z"
      }
    }
  }
  ```

### 2.5 Verify Email
- **POST** `/auth/verify-email`
- **Auth:** None
- **Request Body:**
  ```json
  {
    "token": "verification-token-string"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "user": { ... },
      "message": "Email successfully verified"
    }
  }
  ```

### 2.6 Forgot Password
- **POST** `/auth/forgot-password`
- **Auth:** None
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "message": "If an account exists with this email, password reset instructions have been sent.",
      "resetToken": "token-string-in-dev-only"
    }
  }
  ```

### 2.7 Reset Password
- **POST** `/auth/reset-password`
- **Auth:** None
- **Request Body:**
  ```json
  {
    "token": "reset-token-string",
    "newPassword": "NewStrongPassword123!"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Password has been successfully reset"
    }
  }
  ```

### 2.8 Refresh Token
- **POST** `/auth/refresh`
- **Auth:** None
- **Request Body:**
  ```json
  {
    "refreshToken": "refresh-token-string"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "new-access-token-jwt"
    }
  }
  ```

---

## 3. Users & Onboarding (`/users`)

### 3.1 Complete Onboarding
- **POST** `/users/onboarding`
- **Auth:** Bearer
- **Request Body:**
  ```json
  {
    "displayName": "Alex Rivers",
    "bio": "Software developer looking to learn Spanish",
    "location": "New York, USA",
    "preferredSessionFormat": "video",
    "availability": "Weekends & Evenings",
    "offeredSkills": [
      {
        "skillName": "React Native",
        "category": "Software Development",
        "proficiency": "expert",
        "description": "Mobile app architecture, Expo, TypeScript",
        "yearsExperience": 5
      }
    ],
    "wantedSkills": [
      {
        "skillName": "Conversational Spanish",
        "category": "Languages",
        "proficiency": "beginner",
        "description": "Basic conversation and vocabulary",
        "yearsExperience": 0
      }
    ]
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "user": { ... }
    }
  }
  ```

### 3.2 Get Public Profile
- **GET** `/users/:id`
- **Auth:** Optional / Bearer
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "profile": {
        "id": "6724...",
        "displayName": "Maria Silva",
        "bio": "Native Spanish speaker learning code",
        "avatarUrl": "https://...",
        "location": "Madrid, Spain",
        "preferredSessionFormat": "video",
        "availability": "Flexible",
        "reputationScore": 105,
        "completedExchangesCount": 2,
        "createdAt": "2026-10-15T09:00:00.000Z",
        "offeredSkills": [
          {
            "id": "skill-1",
            "skillId": "canonical-1",
            "name": "Conversational Spanish",
            "category": "Languages",
            "proficiency": "expert",
            "description": "Native accent and grammar"
          }
        ],
        "wantedSkills": [
          {
            "id": "skill-2",
            "skillId": "canonical-2",
            "name": "React Native",
            "category": "Software Development",
            "proficiency": "beginner",
            "description": "Mobile dev"
          }
        ]
      }
    }
  }
  ```

### 3.3 Update Profile
- **PATCH** `/users/profile`
- **Auth:** Bearer
- **Request Body:**
  ```json
  {
    "displayName": "Alex Rivers",
    "bio": "Updated bio text",
    "location": "Austin, TX",
    "avatarUrl": "https://...",
    "preferredSessionFormat": "video",
    "availability": "Flexible",
    "isProfilePublic": true
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "user": { ... }
    }
  }
  ```

---

## 4. Skills (`/skills`)

- **GET** `/skills?category=&search=&page=1`: Catalog listing
- **POST** `/skills`: Create canonical skill `{ name, category, description }`
- **GET** `/skills/user`: Authenticated user's skills `{ skills: UserSkillDto[] }`
- **POST** `/skills/user`: Add skill to user `{ name, category, type: "offered"|"wanted", proficiency, description, yearsExperience }`
- **PATCH** `/skills/user/:id`: Update `{ proficiency, description, yearsExperience }`
- **DELETE** `/skills/user/:id`: Remove user skill

---

## 5. Discover & Matching (`/matches`)

- **GET** `/matches/discover?category=&search=&format=&page=1&limit=12`
- **Auth:** Optional / Bearer
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "matches": [
        {
          "user": {
            "id": "6724...",
            "displayName": "Maria Silva",
            "bio": "Native Spanish speaker...",
            "avatarUrl": "",
            "location": "Madrid",
            "preferredSessionFormat": "video",
            "availability": "Flexible",
            "reputationScore": 105,
            "completedExchangesCount": 2
          },
          "compatibilityScore": 95,
          "explanation": "Perfect reciprocal match! Maria Silva teaches Conversational Spanish (which you want) and wants to learn React Native (which you teach).",
          "reciprocalMatch": true,
          "theyTeachYouLearn": [
            { "skillId": "...", "name": "Conversational Spanish", "proficiency": "expert" }
          ],
          "youTeachTheyLearn": [
            { "skillId": "...", "name": "React Native", "proficiency": "beginner" }
          ]
        }
      ]
    },
    "meta": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
  }
  ```

---

## 6. Exchanges & Sessions (`/exchanges`)

- **POST** `/exchanges`: Create request `{ recipientId, offeredSkillId, wantedSkillId, proposalDescription }`
- **GET** `/exchanges?status=`: List user's exchanges
- **GET** `/exchanges/:id`: Exchange details
- **PATCH** `/exchanges/:id/status`: Transition `{ status: "ACCEPTED"|"REJECTED"|"CANCELLED", reason? }`
- **POST** `/exchanges/:id/complete`: Mutual completion confirmation
- **POST** `/exchanges/:id/dispute`: Raise dispute `{ reason }`
- **POST** `/exchanges/:id/sessions`: Propose session `{ exchangeId, title, startTime, endTime, notes?, meetingLink? }`
- **GET** `/exchanges/:id/sessions`: List scheduled sessions
- **PATCH** `/exchanges/:id/sessions/:sessionId`: Update status `{ status: "CONFIRMED"|"CANCELLED"|"COMPLETED", notes? }`

---

## 7. Messages (`/messages`)

- **GET** `/messages/conversations`: Thread list with unread counts
- **POST** `/messages/conversations`: Get or create thread `{ targetUserId }`
- **GET** `/messages/conversations/:id?page=1`: Fetch thread messages
- **POST** `/messages/conversations/:id`: Send message `{ content }`

---

## 8. Notifications (`/notifications`)

- **GET** `/notifications?page=1`: List notifications
- **GET** `/notifications/unread-count`: Unread counter `{ unreadCount: number }`
- **PATCH** `/notifications/:id/read`: Mark single notification read
- **POST** `/notifications/mark-all-read`: Mark all read

---

## 9. Reviews (`/reviews`)

- **POST** `/reviews`: Submit rating `{ exchangeId, rating: 1..5, comment }`
- **GET** `/reviews/user/:userId`: Fetch public reviews received by user

---

## 10. Community & Safety (`/community`, `/safety`)

- **GET / POST / DELETE** `/community/posts`: Feed posts
- **GET / POST / PATCH / DELETE** `/community/connections`: Peer connections
- **POST** `/safety/block`: Block user `{ userId, reason? }`
- **DELETE** `/safety/block/:userId`: Unblock user
- **GET** `/safety/blocked`: List blocked users
- **POST** `/safety/report`: Submit report `{ targetType, targetId, reason, description }`

---

## 11. Admin (`/admin`)

- **POST** `/admin/bootstrap`: Bootstrap key initialization
- **GET** `/admin/stats`: Platform metrics
- **GET** `/admin/users`: User directory
- **PATCH** `/admin/users/:id`: Suspension & role updates
- **GET / PATCH** `/admin/reports`: Moderation queue
- **GET** `/admin/audit-logs`: Administrative audit trail
