import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUser } from "@/types";
import { tokenStorage } from "@/services/auth/tokenStorage";
import { api } from "@/services/api";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isVerified: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ user: AuthUser; verificationToken?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const restoreSession = useCallback(async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        setStatus("unauthenticated");
        return;
      }

      // Try fetching current user profile
      const res = await api.auth.me();
      if (res && res.user) {
        setUser(res.user);
        await tokenStorage.setUser(res.user);
        setStatus("authenticated");
      } else {
        await tokenStorage.clearAll();
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch {
      // In case network is offline, check cached user
      const cached = await tokenStorage.getUser();
      if (cached) {
        setUser(cached);
        setStatus("authenticated");
      } else {
        await tokenStorage.clearAll();
        setUser(null);
        setStatus("unauthenticated");
      }
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    setStatus("loading");
    try {
      const res = await api.auth.login({ email, password });
      await tokenStorage.setAccessToken(res.accessToken);
      await tokenStorage.setUser(res.user);
      setUser(res.user);
      setStatus("authenticated");
      return res.user;
    } catch (err) {
      setStatus("unauthenticated");
      throw err;
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ user: AuthUser; verificationToken?: string }> => {
    setStatus("loading");
    try {
      const res = await api.auth.register({ email, password, displayName });
      await tokenStorage.setAccessToken(res.accessToken);
      await tokenStorage.setUser(res.user);
      setUser(res.user);
      setStatus("authenticated");
      return { user: res.user, verificationToken: res.verificationToken };
    } catch (err) {
      setStatus("unauthenticated");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout().catch(() => {});
    } finally {
      await tokenStorage.clearAll();
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      const res = await api.auth.me();
      if (res && res.user) {
        setUser(res.user);
        await tokenStorage.setUser(res.user);
        return res.user;
      }
    } catch {}
    return null;
  };

  const isOnboarded = !!user?.onboardingCompleted;
  const isVerified = !!user?.isEmailVerified;

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated" && !!user,
        isOnboarded,
        isVerified,
        login,
        register,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
