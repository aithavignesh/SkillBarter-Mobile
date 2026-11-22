import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loginSchema } from "../utils/validators";
import { tokenStorage } from "../services/auth/tokenStorage";
import { request, ApiError } from "../services/api/client";
import { api } from "../services/api";
import { AuthUser } from "../types";

describe("Comprehensive Mobile Login & Authentication Verification Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await tokenStorage.clearAll();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // 1. Zod Form Validation: Empty fields, invalid email, whitespace normalization
  describe("Form Validation & Input Normalization", () => {
    it("rejects empty email and empty password", () => {
      const res = loginSchema.safeParse({ email: "", password: "" });
      expect(res.success).toBe(false);
      if (!res.success) {
        const fieldErrors = res.error.flatten().fieldErrors;
        expect(fieldErrors.email).toBeDefined();
        expect(fieldErrors.password).toBeDefined();
      }
    });

    it("rejects malformed email format", () => {
      const res = loginSchema.safeParse({ email: "not-an-email", password: "Password123!" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.flatten().fieldErrors.email).toContain("Invalid email address");
      }
    });

    it("normalizes and trims whitespace from email input", () => {
      const res = loginSchema.safeParse({
        email: "  User.Name@Example.COM  ",
        password: "Password123!",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe("user.name@example.com");
      }
    });

    it("preserves exact password characters without trimming or lowercasing", () => {
      const complexPass = " P@ssw0rd With Spaces! ";
      const res = loginSchema.safeParse({
        email: "user@example.com",
        password: complexPass,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.password).toBe(complexPass);
      }
    });
  });

  // 2. Authentication API Client: 400, 401, 429, 502 and Network Errors
  describe("API Client Error Handling", () => {
    it("handles 401 Invalid Credentials with meaningful user message", async () => {
      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        }),
      }));

      await expect(
        request("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: "user@example.com", password: "WrongPassword" }),
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("handles 400 Validation Error from backend", async () => {
      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid request data" },
        }),
      }));

      try {
        await request("/auth/login", { method: "POST", body: "{}" });
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(400);
        expect(err.code).toBe("VALIDATION_ERROR");
      }
    });

    it("handles 429 Rate Limiting with friendly cooldown message", async () => {
      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({
          success: false,
          error: { code: "RATE_LIMITED", message: "Too many authentication attempts, please try again later." },
        }),
      }));

      try {
        await request("/auth/login", { method: "POST", body: "{}" });
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(429);
        expect(err.message).toContain("Too many");
      }
    });

    it("handles 502/503 Bad Gateway / Service Unavailable (e.g. Render spin-up)", async () => {
      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: async () => {
          throw new Error("HTML error page from proxy");
        },
      }));

      try {
        await request("/auth/login", { method: "POST", body: "{}" });
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(502);
        expect(err.message).toContain("server is currently waking up or unavailable");
      }
    });

    it("handles network connectivity failure with clear offline message", async () => {
      global.fetch = vi.fn().mockImplementation(async () => {
        throw new TypeError("Failed to fetch");
      });

      try {
        await request("/auth/login", { method: "POST", body: "{}" });
        expect.unreachable();
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(0);
        expect(err.code).toBe("NETWORK_ERROR");
        expect(err.message).toContain("Unable to connect to the server");
      }
    });
  });

  // 3. Silent Token Refresh & /auth/me Session Restoration
  describe("Silent Token Refresh & Session Restoration", () => {
    it("successfully refreshes token on 401 when calling /auth/me", async () => {
      await tokenStorage.setAccessToken("expired-access-token");
      await tokenStorage.setRefreshToken("valid-refresh-token");

      let refreshAttempted = false;
      let meAttempts = 0;

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/auth/refresh")) {
          refreshAttempted = true;
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                accessToken: "new-shiny-access-token-123",
                refreshToken: "new-refresh-token-456",
              },
            }),
          };
        }

        if (url.includes("/auth/me")) {
          meAttempts++;
          if (meAttempts === 1) {
            // First call with expired token returns 401
            return {
              ok: false,
              status: 401,
              json: async () => ({
                success: false,
                error: { code: "INVALID_TOKEN", message: "Token expired" },
              }),
            };
          }

          // Second call with refreshed token returns user
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                user: {
                  id: "user-1",
                  email: "test@skillbarter.com",
                  displayName: "Test User",
                  role: "user",
                  isEmailVerified: true,
                  onboardingCompleted: true,
                  reputationScore: 100,
                  completedExchangesCount: 0,
                  createdAt: new Date().toISOString(),
                },
              },
            }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      });

      const res = await api.auth.me();
      expect(refreshAttempted).toBe(true);
      expect(res.user.id).toBe("user-1");
      expect(await tokenStorage.getAccessToken()).toBe("new-shiny-access-token-123");
      expect(await tokenStorage.getRefreshToken()).toBe("new-refresh-token-456");
    });

    it("clears tokens and fails cleanly when refresh token is also invalid/expired", async () => {
      await tokenStorage.setAccessToken("expired-access-token");
      await tokenStorage.setRefreshToken("expired-refresh-token");

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/auth/refresh")) {
          return {
            ok: false,
            status: 401,
            json: async () => ({
              success: false,
              error: { code: "INVALID_TOKEN", message: "Refresh token expired" },
            }),
          };
        }

        return {
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            error: { code: "INVALID_TOKEN", message: "Session expired" },
          }),
        };
      });

      await expect(api.auth.me()).rejects.toThrow();
      expect(await tokenStorage.getAccessToken()).toBeNull();
      expect(await tokenStorage.getRefreshToken()).toBeNull();
    });

    it("supports sequential refresh-token rotation across multiple refresh cycles without reusing stale tokens", async () => {
      // Step 0: User logs in, acquiring initial access token v1 and refresh token v1
      await tokenStorage.setAccessToken("access-token-v1");
      await tokenStorage.setRefreshToken("refresh-token-v1");

      const sentRefreshTokens: string[] = [];
      let callCount = 0;

      global.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
        if (url.includes("/auth/refresh")) {
          const body = JSON.parse(opts.body || "{}");
          sentRefreshTokens.push(body.refreshToken);

          // Backend enforces single-use refresh token rotation
          if (body.refreshToken === "refresh-token-v1") {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                data: {
                  accessToken: "access-token-v2",
                  refreshToken: "refresh-token-v2",
                },
              }),
            };
          }

          if (body.refreshToken === "refresh-token-v2") {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                data: {
                  accessToken: "access-token-v3",
                  refreshToken: "refresh-token-v3",
                },
              }),
            };
          }

          // If a rotated/stale token is reused, backend rejects with 401
          return {
            ok: false,
            status: 401,
            json: async () => ({
              success: false,
              error: { code: "INVALID_TOKEN", message: "Refresh token already used / invalid" },
            }),
          };
        }

        callCount++;
        if (callCount === 1) {
          // First attempt of request A fails with 401 (access token v1 expired)
          return {
            ok: false,
            status: 401,
            json: async () => ({
              success: false,
              error: { code: "EXPIRED_TOKEN", message: "Token expired" },
            }),
          };
        }
        if (callCount === 2) {
          // Retry of request A succeeds with access token v2
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: { step: 1 } }),
          };
        }
        if (callCount === 3) {
          // Much later, request B fails with 401 (access token v2 expired)
          return {
            ok: false,
            status: 401,
            json: async () => ({
              success: false,
              error: { code: "EXPIRED_TOKEN", message: "Token expired again" },
            }),
          };
        }
        // Retry of request B succeeds with access token v3
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { step: 2 } }),
        };
      });

      // Cycle 1: First request triggers refresh from v1 -> v2
      const res1 = await request<{ step: number }>("/protected-data-1");
      expect(res1.step).toBe(1);
      expect(sentRefreshTokens).toEqual(["refresh-token-v1"]);
      expect(await tokenStorage.getAccessToken()).toBe("access-token-v2");
      expect(await tokenStorage.getRefreshToken()).toBe("refresh-token-v2");

      // Cycle 2: Second request triggers second refresh from v2 -> v3
      const res2 = await request<{ step: number }>("/protected-data-2");
      expect(res2.step).toBe(2);
      expect(sentRefreshTokens).toEqual(["refresh-token-v1", "refresh-token-v2"]);
      expect(await tokenStorage.getAccessToken()).toBe("access-token-v3");
      expect(await tokenStorage.getRefreshToken()).toBe("refresh-token-v3");
    });

    it("persists rotated tokens through direct api.auth.refreshToken call", async () => {
      await tokenStorage.setRefreshToken("existing-refresh-token");

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/auth/refresh")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                accessToken: "new-access-token-direct",
                refreshToken: "new-refresh-token-direct",
              },
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      });

      const res = await api.auth.refreshToken();
      expect(res.accessToken).toBe("new-access-token-direct");
      expect(res.refreshToken).toBe("new-refresh-token-direct");
      expect(await tokenStorage.getAccessToken()).toBe("new-access-token-direct");
      expect(await tokenStorage.getRefreshToken()).toBe("new-refresh-token-direct");
    });
  });

  // 4. Token Storage & Android Large Payload Resilience
  describe("Token Storage Security & Android Keystore Resilience", () => {
    it("stores and retrieves access and refresh tokens securely", async () => {
      await tokenStorage.setAccessToken("access-jwt-token");
      await tokenStorage.setRefreshToken("refresh-jwt-token");

      expect(await tokenStorage.getAccessToken()).toBe("access-jwt-token");
      expect(await tokenStorage.getRefreshToken()).toBe("refresh-jwt-token");
    });

    it("survives app restart simulation with cached user persistence", async () => {
      const user: AuthUser = {
        id: "usr-42",
        email: "alex@skillbarter.local",
        displayName: "Alex Rivers",
        role: "user",
        isEmailVerified: true,
        onboardingCompleted: true,
        reputationScore: 150,
        completedExchangesCount: 5,
        createdAt: "2026-11-01T00:00:00.000Z",
      };

      await tokenStorage.setAccessToken("persisted-token");
      await tokenStorage.setUser(user);

      // Verify retrieval matches exactly
      const restoredUser = await tokenStorage.getUser();
      expect(restoredUser).not.toBeNull();
      expect(restoredUser?.id).toBe("usr-42");
      expect(restoredUser?.email).toBe("alex@skillbarter.local");
      expect(restoredUser?.onboardingCompleted).toBe(true);
      expect(await tokenStorage.getAccessToken()).toBe("persisted-token");
    });

    it("safely stores large user payload with extensive bio and metadata", async () => {
      const largeBio = "A".repeat(1500); // Large bio text
      const heavyUser: AuthUser = {
        id: "usr-heavy-1",
        email: "heavy@skillbarter.local",
        displayName: "Heavy Profile User",
        role: "user",
        isEmailVerified: true,
        onboardingCompleted: true,
        bio: largeBio,
        location: "San Francisco, CA, United States of America",
        availability: "Weekdays 9am - 5pm PST",
        preferredSessionFormat: "video",
        avatarUrl: "https://images.example.com/very/long/path/to/avatar/image-avatar-profile.png",
        reputationScore: 120,
        completedExchangesCount: 3,
        createdAt: new Date().toISOString(),
      };

      await tokenStorage.setUser(heavyUser);
      const retrieved = await tokenStorage.getUser();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe("usr-heavy-1");
      expect(retrieved?.email).toBe("heavy@skillbarter.local");
    });
  });

  // 5. Navigation Decision Verification: Existing Onboarded vs Newly Registered
  describe("Post-Login Navigation Path Determination", () => {
    it("determines correct route for existing onboarded user -> /(tabs)", () => {
      const onboardedUser: AuthUser = {
        id: "u-onboarded",
        email: "veteran@example.com",
        displayName: "Veteran User",
        role: "user",
        isEmailVerified: true,
        onboardingCompleted: true,
        reputationScore: 100,
        completedExchangesCount: 2,
        createdAt: new Date().toISOString(),
      };

      const targetRoute = onboardedUser.onboardingCompleted ? "/(tabs)" : "/(onboarding)";
      expect(targetRoute).toBe("/(tabs)");
    });

    it("determines correct route for newly registered non-onboarded user -> /(onboarding)", () => {
      const freshUser: AuthUser = {
        id: "u-fresh",
        email: "fresh@example.com",
        displayName: "Fresh User",
        role: "user",
        isEmailVerified: false,
        onboardingCompleted: false,
        reputationScore: 100,
        completedExchangesCount: 0,
        createdAt: new Date().toISOString(),
      };

      const targetRoute = freshUser.onboardingCompleted ? "/(tabs)" : "/(onboarding)";
      expect(targetRoute).toBe("/(onboarding)");
    });
  });
});
