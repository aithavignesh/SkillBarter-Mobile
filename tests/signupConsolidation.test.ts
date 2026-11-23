import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerSchema, normalizePhoneNumber } from "../utils/validators";
import { tokenStorage } from "../services/auth/tokenStorage";
import { api } from "../services/api";

describe("Mobile Signup Validation & Account Consolidation Test Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await tokenStorage.clearAll();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("Signup Phone Schema Validation", () => {
    it("accepts valid 10-digit mobile number", () => {
      const res = registerSchema.safeParse({
        displayName: "Anil Sharma",
        email: "anil@example.com",
        phone: "9876543210",
        password: "Password123!",
      });
      expect(res.success).toBe(true);
    });

    it("accepts international + country code number", () => {
      const res = registerSchema.safeParse({
        displayName: "Priya Patel",
        email: "priya@example.com",
        phone: "+919876543210",
        password: "Password123!",
      });
      expect(res.success).toBe(true);
    });

    it("rejects phone numbers with fewer than 8 digits", () => {
      const res = registerSchema.safeParse({
        displayName: "Anil Sharma",
        email: "anil@example.com",
        phone: "12345",
        password: "Password123!",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.flatten().fieldErrors.phone).toBeDefined();
      }
    });

    it("rejects phone numbers with alphabetic characters", () => {
      const res = registerSchema.safeParse({
        displayName: "Anil Sharma",
        email: "anil@example.com",
        phone: "98765abcde",
        password: "Password123!",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("API Registration Request Payload and Token Persistence", () => {
    it("includes normalized phone number in the registration request", async () => {
      let capturedBody: any = null;

      global.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
        if (url.includes("/auth/register")) {
          capturedBody = JSON.parse(init.body);
          return {
            ok: true,
            status: 201,
            json: async () => ({
              success: true,
              data: {
                user: {
                  id: "user-new-123",
                  email: capturedBody.email,
                  phone: capturedBody.phone,
                  displayName: capturedBody.displayName,
                  role: "user",
                  isEmailVerified: false,
                  onboardingCompleted: false,
                  reputationScore: 5.0,
                  completedExchangesCount: 0,
                  createdAt: new Date().toISOString(),
                },
                accessToken: "access-token-new",
                refreshToken: "refresh-token-new",
              },
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }) as any;

      const normalizedPhone = normalizePhoneNumber("9876543210");
      expect(normalizedPhone).toBe("+919876543210");

      const response = await api.auth.register({
        displayName: "Ravi Kumar",
        email: "ravi@example.com",
        phone: normalizedPhone,
        password: "Password123!",
      });

      expect(capturedBody).toBeDefined();
      expect(capturedBody.phone).toBe("+919876543210");
      expect(capturedBody.email).toBe("ravi@example.com");
      expect(response.accessToken).toBe("access-token-new");
      expect(response.refreshToken).toBe("refresh-token-new");
    });

    it("surfaces field-specific duplicate email error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: "EMAIL_EXISTS",
            message: "An account with this email already exists",
            details: { field: "email" },
          },
        }),
      } as any);

      await expect(
        api.auth.register({
          displayName: "Existing Email",
          email: "already.taken@example.com",
          phone: "+919876543210",
          password: "Password123!",
        })
      ).rejects.toMatchObject({
        code: "EMAIL_EXISTS",
        status: 409,
        details: { field: "email" },
      });
    });

    it("surfaces field-specific duplicate phone error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: "PHONE_EXISTS",
            message: "An account with this mobile number already exists",
            details: { field: "phone" },
          },
        }),
      } as any);

      await expect(
        api.auth.register({
          displayName: "Existing Phone",
          email: "unique@example.com",
          phone: "+919876543210",
          password: "Password123!",
        })
      ).rejects.toMatchObject({
        code: "PHONE_EXISTS",
        status: 409,
        details: { field: "phone" },
      });
    });
  });

  describe("Account Consolidation Login Guidance", () => {
    it("handles ACCOUNT_CONSOLIDATED response with masked primary email", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "ACCOUNT_CONSOLIDATED",
            message:
              "This account was consolidated into your primary account (v***h@example.com). Please sign in using your primary account credentials.",
            details: {
              primaryAccountId: "6ae6437e4419de4b9ecc74bc",
              primaryEmailMasked: "v***h@example.com",
              primaryPhoneMasked: "+91 ********10",
              primaryIsSuspended: false,
            },
          },
        }),
      } as any);

      try {
        await api.auth.login({
          email: "secondary.alias@example.com",
          password: "Password123!",
        });
        expect.unreachable("Should have thrown ApiError");
      } catch (err: any) {
        expect(err.code).toBe("ACCOUNT_CONSOLIDATED");
        expect(err.status).toBe(403);
        expect(err.details.primaryEmailMasked).toBe("v***h@example.com");
        expect(err.message).toContain("v***h@example.com");
      }
    });

    it("allows logging in with the primary account credentials", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: "6ae6437e4419de4b9ecc74bc",
              email: "primary.user@example.com",
              phone: "+919876543210",
              displayName: "Primary User",
              role: "user",
              isEmailVerified: true,
              onboardingCompleted: true,
              reputationScore: 5.0,
              completedExchangesCount: 2,
              createdAt: new Date().toISOString(),
            },
            accessToken: "primary-access-token",
            refreshToken: "primary-refresh-token",
          },
        }),
      } as any);

      const res = await api.auth.login({
        email: "primary.user@example.com",
        password: "Password123!",
      });

      expect(res.user.id).toBe("6ae6437e4419de4b9ecc74bc");
      expect(res.accessToken).toBe("primary-access-token");
      expect(res.user.email).toBe("primary.user@example.com");
    });
  });
});
