import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { AuthUser } from "@/types";

const ACCESS_TOKEN_KEY = "sb_access_token";
const REFRESH_TOKEN_KEY = "sb_refresh_token";
const USER_KEY = "sb_current_user";

// Fallback memory store for environments where SecureStore is not initialized (e.g. tests or SSR)
const memoryStore = new Map<string, string>();

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      if (await isSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
    } catch {}
    return memoryStore.get(ACCESS_TOKEN_KEY) ?? null;
  },

  async setAccessToken(token: string): Promise<void> {
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
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch {}
    return memoryStore.get(REFRESH_TOKEN_KEY) ?? null;
  },

  async setRefreshToken(token: string): Promise<void> {
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
    const raw = JSON.stringify(user);
    memoryStore.set(USER_KEY, raw);
    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(USER_KEY, raw);
      }
    } catch {}
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
