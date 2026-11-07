import { describe, it, expect, beforeEach } from "vitest";
import { tokenStorage } from "../services/auth/tokenStorage";
import { AuthUser } from "../types";

describe("Mobile Token & User Storage", () => {
  beforeEach(async () => {
    await tokenStorage.clearAll();
  });

  it("stores and retrieves access token securely", async () => {
    expect(await tokenStorage.getAccessToken()).toBeNull();
    await tokenStorage.setAccessToken("test-access-token-jwt-123");
    expect(await tokenStorage.getAccessToken()).toBe("test-access-token-jwt-123");
  });

  it("stores and retrieves refresh token securely", async () => {
    expect(await tokenStorage.getRefreshToken()).toBeNull();
    await tokenStorage.setRefreshToken("test-refresh-token-jwt-456");
    expect(await tokenStorage.getRefreshToken()).toBe("test-refresh-token-jwt-456");
  });

  it("stores and parses cached user profile", async () => {
    const mockUser: AuthUser = {
      id: "u-100",
      email: "test@skillbarter.local",
      displayName: "Jordan Test",
      role: "user",
      isEmailVerified: true,
      onboardingCompleted: true,
      reputationScore: 105,
      completedExchangesCount: 2,
      createdAt: new Date().toISOString(),
    };

    expect(await tokenStorage.getUser()).toBeNull();
    await tokenStorage.setUser(mockUser);
    const retrieved = await tokenStorage.getUser();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe("u-100");
    expect(retrieved?.displayName).toBe("Jordan Test");
    expect(retrieved?.reputationScore).toBe(105);
  });

  it("wipes all stored credentials on clearAll", async () => {
    await tokenStorage.setAccessToken("token-a");
    await tokenStorage.setRefreshToken("token-b");
    await tokenStorage.setUser({
      id: "u-1",
      email: "a@b.com",
      displayName: "A",
      role: "user",
      isEmailVerified: false,
      onboardingCompleted: false,
      reputationScore: 100,
      completedExchangesCount: 0,
      createdAt: "",
    });

    await tokenStorage.clearAll();

    expect(await tokenStorage.getAccessToken()).toBeNull();
    expect(await tokenStorage.getRefreshToken()).toBeNull();
    expect(await tokenStorage.getUser()).toBeNull();
  });
});
