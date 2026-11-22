import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { AuthUser } from "@/types";

const ACCESS_TOKEN_KEY = "sb_access_token";
const REFRESH_TOKEN_KEY = "sb_refresh_token";
const USER_KEY = "sb_current_user";

// Fallback memory store for environments where SecureStore is not initialized (e.g. tests or SSR)
const memoryStore = new Map<string, string>();

let secureStoreAvailabilityPromise: Promise<boolean> | null = null;

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (secureStoreAvailabilityPromise !== null) {
    return secureStoreAvailabilityPromise;
  }
  secureStoreAvailabilityPromise = (async () => {
    try {
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  })();
  return secureStoreAvailabilityPromise;
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      if (await isSecureStoreAvailable()) {
        const val = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (val) return val;
      }
    } catch {}
    return memoryStore.get(ACCESS_TOKEN_KEY) ?? null;
  },

  async setAccessToken(token: string): Promise<void> {
    if (!token) return;
    memoryStore.set(ACCESS_TOKEN_KEY, token);
    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      }
    } catch {}
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (await isSecureStoreAvailable()) {
        const val = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (val) return val;
      }
    } catch {}
    return memoryStore.get(REFRESH_TOKEN_KEY) ?? null;
  },

  async setRefreshToken(token: string): Promise<void> {
    if (!token) return;
    memoryStore.set(REFRESH_TOKEN_KEY, token);
    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      }
    } catch {}
  },

  async getUser(): Promise<AuthUser | null> {
    try {
      let raw: string | null = null;
      if (await isSecureStoreAvailable()) {
        raw = await SecureStore.getItemAsync(USER_KEY);
      }
      if (!raw) raw = memoryStore.get(USER_KEY) ?? null;
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  },

  async setUser(user: AuthUser): Promise<void> {
    if (!user) return;
    const raw = JSON.stringify(user);
    memoryStore.set(USER_KEY, raw);
    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(USER_KEY, raw);
      }
    } catch {
      // Android SecureStore limitation: values over 2048 bytes can fail in SharedPreferences/Keystore.
      // If the full user payload exceeds this, store the essential fields required for session restoration.
      try {
        if (await isSecureStoreAvailable()) {
          const minimalUser: AuthUser = {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            onboardingCompleted: user.onboardingCompleted,
            reputationScore: user.reputationScore ?? 100,
            completedExchangesCount: user.completedExchangesCount ?? 0,
            createdAt: user.createdAt || new Date().toISOString(),
          };
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(minimalUser));
        }
      } catch {}
    }
  },

  async clearAll(): Promise<void> {
    memoryStore.clear();
    try {
      if (await isSecureStoreAvailable()) {
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {}),
          SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
          SecureStore.deleteItemAsync(USER_KEY).catch(() => {}),
        ]);
      }
    } catch {}
  },
};
