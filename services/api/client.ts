import { Platform } from "react-native";
import { tokenStorage } from "../auth/tokenStorage";
import { ApiResponse } from "@/types";

function getDefaultBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.trim().replace(/\/+$/, "");

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
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const token = await tokenStorage.getAccessToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  // Only attach Authorization token if token exists and not unauthenticated auth routes
  if (
    token &&
    !headers.has("Authorization") &&
    cleanEndpoint !== "/auth/login" &&
    cleanEndpoint !== "/auth/register"
  ) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError(
      "Unable to connect to the server. Please check your internet connection.",
      "NETWORK_ERROR",
      0
    );
  }

  // Handle Token Expiry & Silent Refresh
  // Only exclude /auth/refresh and /auth/login to avoid infinite refresh loops.
  // Authenticated endpoints such as /auth/me MUST trigger token refresh when expired!
  const isExcludedFromRefresh = cleanEndpoint === "/auth/refresh" || cleanEndpoint === "/auth/login";
  if (res.status === 401 && !isRetry && !isExcludedFromRefresh) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        await tokenStorage.clearAll();
        refreshSubscribers = [];
      } else {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshData: ApiResponse<{ accessToken: string; refreshToken?: string }> =
            await refreshRes.json();
          if (refreshRes.ok && refreshData.success && refreshData.data?.accessToken) {
            const newAccessToken = refreshData.data.accessToken;
            await tokenStorage.setAccessToken(newAccessToken);
            if (refreshData.data.refreshToken) {
              await tokenStorage.setRefreshToken(refreshData.data.refreshToken);
            }
            isRefreshing = false;
            onRefreshed(newAccessToken);
            return request<T>(endpoint, options, true);
          }
        } catch {
          // Refresh failed
        }
        isRefreshing = false;
        await tokenStorage.clearAll();
        refreshSubscribers = [];
      }
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
      code: `HTTP_${res.status}`,
      message:
        res.status === 429
          ? "Too many requests. Please wait a moment and try again."
          : res.status === 502 || res.status === 503
          ? "The server is currently waking up or unavailable. Please try again shortly."
          : `Server returned HTTP ${res.status}`,
    },
  }));

  if (!res.ok || !json.success) {
    let errorCode = json.error?.code || `HTTP_${res.status}`;
    let errorMessage = json.error?.message;

    if (!errorMessage) {
      switch (res.status) {
        case 400:
          errorMessage = "Invalid request. Please verify your information.";
          break;
        case 401:
          errorMessage = "Invalid email or password. Please verify your credentials.";
          break;
        case 403:
          errorMessage = "Access denied. Your account may be suspended or lack permission.";
          break;
        case 404:
          errorMessage = "Requested resource was not found.";
          break;
        case 429:
          errorMessage = "Too many attempts. Please wait a few minutes before trying again.";
          break;
        case 502:
        case 503:
          errorMessage = "The server is currently waking up or unavailable. Please try again shortly.";
          break;
        default:
          errorMessage = res.statusText || "Request failed";
      }
    }

    throw new ApiError(errorMessage, errorCode, res.status, json.error?.details);
  }

  return json.data as T;
}
