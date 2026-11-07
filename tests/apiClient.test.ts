import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { request, ApiError } from "../services/api/client";
import { tokenStorage } from "../services/auth/tokenStorage";

describe("Mobile Centralized API Client", () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await tokenStorage.clearAll();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("attaches Authorization Bearer header when token exists", async () => {
    await tokenStorage.setAccessToken("my-valid-bearer-token");

    let capturedHeaders: Headers | undefined;
    global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
      capturedHeaders = opts.headers as Headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { result: "ok" },
        }),
      } as any;
    });

    const res = await request<{ result: string }>("/test-endpoint");
    expect(res.result).toBe("ok");
    expect(capturedHeaders?.get("Authorization")).toBe("Bearer my-valid-bearer-token");
  });

  it("throws structured ApiError on server error response", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input fields",
            details: [{ field: "email", message: "Email required" }],
          },
        }),
      } as any;
    });

    await expect(request("/bad-endpoint")).rejects.toThrow(ApiError);
    try {
      await request("/bad-endpoint");
    } catch (err: any) {
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.status).toBe(400);
      expect(err.message).toBe("Invalid input fields");
    }
  });

  it("performs silent token refresh on 401 when refresh token is available", async () => {
    await tokenStorage.setAccessToken("expired-token");
    await tokenStorage.setRefreshToken("valid-refresh-token");

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/auth/refresh")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { accessToken: "new-shiny-access-token" },
          }),
        } as any;
      }

      callCount++;
      if (callCount === 1) {
        // First attempt fails with 401
        return {
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            error: { code: "INVALID_TOKEN", message: "Session expired" },
          }),
        } as any;
      }

      // Retry attempt succeeds
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { secureData: "success-after-refresh" },
        }),
      } as any;
    });

    const data = await request<{ secureData: string }>("/protected-resource");
    expect(data.secureData).toBe("success-after-refresh");
    expect(await tokenStorage.getAccessToken()).toBe("new-shiny-access-token");
  });
});
