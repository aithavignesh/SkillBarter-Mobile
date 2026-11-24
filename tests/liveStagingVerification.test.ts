import { describe, it, expect } from "vitest";

const STAGING_API_URL = "https://skillbarter-next-api-staging.onrender.com/api/v1";
const isLiveStagingEnabled = process.env.TEST_LIVE_STAGING === "true";

describe.skipIf(!isLiveStagingEnabled)("Live Staging Backend Authentication & Account Verification", () => {
  const timestamp = Date.now();
  const indianMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const normalizedPhone = `+91${indianMobile}`;
  const testUser = {
    displayName: "Staging Test User",
    email: `device.test.${timestamp}@example.com`,
    phone: normalizedPhone,
    password: "Password123!@#",
  };

  let savedAccessToken = "";
  let savedRefreshToken = "";

  it("1. Health check: staging server is live and running correct commit", async () => {
    const res = await fetch(`${STAGING_API_URL}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.commit).toBe("fd14e85718fae305ce5291e2dbc61bb95c1f8e68");
    console.log("[LIVE STAGING] Health check OK:", body);
  });

  it("2. New user registration with Indian mobile number (+91)", async () => {
    const res = await fetch(`${STAGING_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    const body = await res.json();
    console.log("[LIVE STAGING] Register body:", JSON.stringify(body));
    expect(res.status).toBe(201);
    
    // Support either envelope { data: { accessToken } } or flat { accessToken }
    const authData = body.data || body;
    expect(authData.accessToken).toBeDefined();
    expect(authData.refreshToken).toBeDefined();
    expect(authData.user).toBeDefined();
    expect(authData.user.email).toBe(testUser.email.toLowerCase());
    // Note: authData.user strips phone for privacy in public AuthUser payload;
    // Phone persistence is verified below by duplicate phone uniqueness rejection (Test 4).

    savedAccessToken = authData.accessToken;
    savedRefreshToken = authData.refreshToken;
  });

  it("3. Duplicate email handling returns 409 EMAIL_EXISTS with field='email'", async () => {
    const duplicateEmailUser = {
      displayName: "Duplicate Email User",
      email: testUser.email,
      phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: "Password123!@#",
    };

    const res = await fetch(`${STAGING_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicateEmailUser),
    });

    const body = await res.json();
    console.log("[LIVE STAGING] Duplicate email rejection:", JSON.stringify(body));
    expect(res.status).toBe(409);
    const err = body.error || body;
    expect(err.code).toBe("EMAIL_EXISTS");
    expect(err.details?.field).toBe("email");
  });

  it("4. Duplicate phone handling returns 409 PHONE_EXISTS with field='phone'", async () => {
    const duplicatePhoneUser = {
      displayName: "Duplicate Phone User",
      email: `other.${timestamp}@example.com`,
      phone: testUser.phone,
      password: "Password123!@#",
    };

    const res = await fetch(`${STAGING_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicatePhoneUser),
    });

    const body = await res.json();
    console.log("[LIVE STAGING] Duplicate phone rejection:", JSON.stringify(body));
    expect(res.status).toBe(409);
    const err = body.error || body;
    expect(err.code).toBe("PHONE_EXISTS");
    expect(err.details?.field).toBe("phone");
  });

  it("5. Login with valid credentials returns tokens and user object", async () => {
    const res = await fetch(`${STAGING_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const body = await res.json();
    console.log("[LIVE STAGING] Login body:", JSON.stringify(body));
    expect(res.status).toBe(200);
    const authData = body.data || body;
    expect(authData.accessToken).toBeDefined();
    expect(authData.refreshToken).toBeDefined();
    expect(authData.user.email).toBe(testUser.email.toLowerCase());

    savedAccessToken = authData.accessToken;
    savedRefreshToken = authData.refreshToken;
  });

  it("6. Session restoration (/auth/me) with saved accessToken", async () => {
    const res = await fetch(`${STAGING_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${savedAccessToken}`,
      },
    });

    const body = await res.json();
    console.log("[LIVE STAGING] /auth/me body:", JSON.stringify(body));
    expect(res.status).toBe(200);
    const authData = body.data || body;
    expect(authData.user?.email || authData.email).toBe(testUser.email.toLowerCase());
  });

  it("7. Token refresh rotation returns new accessToken and new refreshToken", async () => {
    const res = await fetch(`${STAGING_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: savedRefreshToken }),
    });

    const body = await res.json();
    console.log("[LIVE STAGING] Refresh body:", JSON.stringify(body));
    expect(res.status).toBe(200);
    const authData = body.data || body;
    expect(authData.accessToken).toBeDefined();
    expect(authData.refreshToken).toBeDefined();

    // Verify newly rotated token works
    const meRes = await fetch(`${STAGING_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authData.accessToken}`,
      },
    });
    expect(meRes.status).toBe(200);
  });

  it("8. Logout revokes refreshToken on staging server", async () => {
    const res = await fetch(`${STAGING_API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${savedAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: savedRefreshToken }),
    });

    expect(res.status).toBe(200);
    console.log("[LIVE STAGING] Logout status:", res.status);
  });
});
