import { Platform } from "react-native";
import { tokenStorage } from "../auth/tokenStorage";
import { ApiResponse } from "@/types";

function getDefaultBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // Android emulator routes host machine loopback through 10.0.2.2
  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000/api/v1";
  }
  return "http://localhost:4000/api/v1";
}

export const API_BASE_URL = getDefaultBaseUrl();

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(message: string, code = "API_ERROR", status = 500, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (newToken: string) => void) {
  refreshSubscribers.push(cb);
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const token = await tokenStorage.getAccessToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new ApiError(
      `Network request failed: ${err.message || "Unable to connect to server"}`,
      "NETWORK_ERROR",
      0
    );
  }

  // Handle Token Expiry & Silent Refresh
  if (res.status === 401 && !isRetry && !endpoint.includes("/auth/")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshData: ApiResponse<{ accessToken: string }> = await refreshRes.json();
          if (refreshRes.ok && refreshData.success && refreshData.data?.accessToken) {
            const newAccessToken = refreshData.data.accessToken;
            await tokenStorage.setAccessToken(newAccessToken);
            isRefreshing = false;
            onRefreshed(newAccessToken);
            return request<T>(endpoint, options, true);
          }
        } catch {
          // Refresh failed
        }
      }
      isRefreshing = false;
      await tokenStorage.clearAll();
      refreshSubscribers = [];
    } else {
      // Wait for existing refresh to complete
      return new Promise<T>((resolve, reject) => {
        addRefreshSubscriber((newToken) => {
          headers.set("Authorization", `Bearer ${newToken}`);
          request<T>(endpoint, { ...options, headers }, true)
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  const json: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    error: {
      code: "INVALID_RESPONSE",
      message: `Server returned HTTP ${res.status}`,
    },
  }));

  if (!res.ok || !json.success) {
    const error = json.error || {
      code: `HTTP_${res.status}`,
      message: res.statusText || "Request failed",
    };
    throw new ApiError(error.message, error.code, res.status, error.details);
  }

  return json.data as T;
}
