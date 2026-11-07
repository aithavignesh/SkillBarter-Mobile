import { request } from "./client";
import {
  AuthUser,
  PublicUserProfile,
  OnboardingInput,
  ProfileUpdateInput,
  SkillDto,
  UserSkillDto,
  MatchResult,
  ExchangeDto,
  ExchangeSessionDto,
  ConversationDto,
  MessageDto,
  NotificationDto,
  ReviewDto,
  ConnectionDto,
  CommunityPostDto,
  ReportDto,
  PlatformStatsDto,
} from "@/types";

export const api = {
  auth: {
    register: (input: { email: string; password: string; displayName: string }) =>
      request<{ user: AuthUser; accessToken: string; verificationToken?: string }>(
        "/auth/register",
        { method: "POST", body: JSON.stringify(input) }
      ),
    login: (input: { email: string; password: string }) =>
      request<{ user: AuthUser; accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
    me: () => request<{ user: AuthUser }>("/auth/me"),
    verifyEmail: (token: string) =>
      request<{ user: AuthUser; message: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    forgotPassword: (email: string) =>
      request<{ message: string; resetToken?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, newPassword: string) =>
      request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    refreshToken: (refreshToken: string) =>
      request<{ accessToken: string }>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }),
  },

  users: {
    completeOnboarding: (input: OnboardingInput) =>
      request<{ user: AuthUser }>("/users/onboarding", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getProfile: (id: string) =>
      request<{ profile: PublicUserProfile }>(`/users/${id}`),
    updateProfile: (input: ProfileUpdateInput) =>
      request<{ user: AuthUser }>("/users/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
  },

  skills: {
    listCatalog: (category?: string, search?: string, page = 1) =>
      request<SkillDto[]>(
        `/skills?category=${encodeURIComponent(category || "")}&search=${encodeURIComponent(
          search || ""
        )}&page=${page}`
      ),
    createCatalogSkill: (input: { name: string; category?: string; description?: string }) =>
      request<{ skill: SkillDto }>("/skills", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getMySkills: () => request<{ skills: UserSkillDto[] }>("/skills/user"),
    addMySkill: (input: {
      name: string;
      category?: string;
      type: "offered" | "wanted";
      proficiency: string;
      description?: string;
      yearsExperience?: number;
    }) =>
      request<{ userSkill: UserSkillDto }>("/skills/user", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateMySkill: (
      id: string,
      input: { proficiency?: string; description?: string; yearsExperience?: number }
    ) =>
      request<{ userSkill: UserSkillDto }>(`/skills/user/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    deleteMySkill: (id: string) =>
      request<{ message: string }>(`/skills/user/${id}`, { method: "DELETE" }),
  },

  matches: {
    discover: (params?: {
      category?: string;
      search?: string;
      format?: string;
      page?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set("category", params.category);
      if (params?.search) q.set("search", params.search);
      if (params?.format) q.set("format", params.format);
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      const qs = q.toString();
      return request<{
        matches: MatchResult[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }>(`/matches/discover${qs ? `?${qs}` : ""}`);
    },
  },

  exchanges: {
    create: (input: {
      recipientId: string;
      offeredSkillId: string;
      wantedSkillId: string;
      proposalDescription: string;
    }) =>
      request<{ exchange: ExchangeDto }>("/exchanges", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    list: (status?: string) =>
      request<{ exchanges: ExchangeDto[] }>(
        `/exchanges${status ? `?status=${encodeURIComponent(status)}` : ""}`
      ),
    getById: (id: string) =>
      request<{ exchange: ExchangeDto }>(`/exchanges/${id}`),
    updateStatus: (
      id: string,
      input: { status: "ACCEPTED" | "REJECTED" | "CANCELLED" | "IN_PROGRESS"; reason?: string }
    ) =>
      request<{ exchange: ExchangeDto }>(`/exchanges/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    confirmCompletion: (id: string) =>
      request<{ exchange: ExchangeDto }>(`/exchanges/${id}/complete`, {
        method: "POST",
      }),
    dispute: (id: string, reason: string) =>
      request<{ exchange: ExchangeDto }>(`/exchanges/${id}/dispute`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    // Sessions
    createSession: (
      exchangeId: string,
      input: {
        title: string;
        startTime: string;
        endTime: string;
        notes?: string;
        meetingLink?: string;
      }
    ) =>
      request<{ session: ExchangeSessionDto }>(`/exchanges/${exchangeId}/sessions`, {
        method: "POST",
        body: JSON.stringify({ exchangeId, ...input }),
      }),
    listSessions: (exchangeId: string) =>
      request<{ sessions: ExchangeSessionDto[] }>(`/exchanges/${exchangeId}/sessions`),
    updateSessionStatus: (
      exchangeId: string,
      sessionId: string,
      input: { status: "CONFIRMED" | "CANCELLED" | "COMPLETED"; notes?: string }
    ) =>
      request<{ session: ExchangeSessionDto }>(
        `/exchanges/${exchangeId}/sessions/${sessionId}`,
        {
          method: "PATCH",
          body: JSON.stringify(input),
        }
      ),
  },

  messages: {
    listConversations: () =>
      request<{ conversations: ConversationDto[] }>("/messages/conversations"),
    getOrCreateConversation: (targetUserId: string) =>
      request<{ conversation: { id: string } }>("/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ targetUserId }),
      }),
    getMessages: (conversationId: string, page = 1) =>
      request<MessageDto[]>(
        `/messages/conversations/${conversationId}?page=${page}`
      ),
    sendMessage: (conversationId: string, content: string) =>
      request<{ message: MessageDto }>(
        `/messages/conversations/${conversationId}`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        }
      ),
  },

  notifications: {
    list: (page = 1) =>
      request<NotificationDto[]>(`/notifications?page=${page}`),
    unreadCount: () =>
      request<{ unreadCount: number }>("/notifications/unread-count"),
    markRead: (id: string) =>
      request<{ message: string }>(`/notifications/${id}/read`, {
        method: "PATCH",
      }),
    markAllRead: () =>
      request<{ message: string }>("/notifications/mark-all-read", {
        method: "POST",
      }),
  },

  reviews: {
    create: (input: { exchangeId: string; rating: number; comment: string }) =>
      request<{ review: ReviewDto }>("/reviews", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getUserReviews: (userId: string) =>
      request<{ reviews: ReviewDto[] }>(`/reviews/user/${userId}`),
  },

  community: {
    listPosts: (page = 1) =>
      request<CommunityPostDto[]>(`/community/posts?page=${page}`),
    createPost: (input: { title: string; content: string; tags?: string[] }) =>
      request<{ post: CommunityPostDto }>("/community/posts", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    deletePost: (id: string) =>
      request<{ message: string }>(`/community/posts/${id}`, {
        method: "DELETE",
      }),
    listConnections: (status?: string) =>
      request<{ connections: ConnectionDto[] }>(
        `/community/connections${status ? `?status=${status}` : ""}`
      ),
    requestConnection: (recipientId: string) =>
      request<{ connection: ConnectionDto }>("/community/connections", {
        method: "POST",
        body: JSON.stringify({ recipientId }),
      }),
    acceptConnection: (id: string) =>
      request<{ connection: ConnectionDto }>(`/community/connections/${id}/accept`, {
        method: "PATCH",
      }),
    removeConnection: (id: string) =>
      request<{ message: string }>(`/community/connections/${id}`, {
        method: "DELETE",
      }),
  },

  safety: {
    blockUser: (userId: string, reason?: string) =>
      request<{ message: string }>("/safety/block", {
        method: "POST",
        body: JSON.stringify({ userId, reason }),
      }),
    unblockUser: (userId: string) =>
      request<{ message: string }>(`/safety/block/${userId}`, {
        method: "DELETE",
      }),
    listBlocked: () =>
      request<{ blockedUsers: Array<{ id: string; blockedUserId: string; reason?: string; createdAt: string }> }>(
        "/safety/blocked"
      ),
    createReport: (input: {
      targetType: "user" | "message" | "review" | "community_post";
      targetId: string;
      reason: string;
      description: string;
    }) =>
      request<{ report: ReportDto }>("/safety/report", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },

  admin: {
    getStats: () => request<{ stats: PlatformStatsDto }>("/admin/stats"),
    listUsers: (page = 1, search?: string, role?: string) =>
      request<any[]>(
        `/admin/users?page=${page}&search=${encodeURIComponent(
          search || ""
        )}&role=${encodeURIComponent(role || "")}`
      ),
    updateUser: (
      id: string,
      input: { role?: "user" | "admin"; isSuspended?: boolean; suspensionReason?: string }
    ) =>
      request<{ user: any }>(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    listReports: (page = 1, status?: string) =>
      request<ReportDto[]>(
        `/admin/reports?page=${page}&status=${encodeURIComponent(status || "")}`
      ),
    handleReport: (
      id: string,
      input: {
        status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
        moderationNotes?: string;
        actionTaken?: "none" | "warning" | "content_removed" | "account_suspended";
      }
    ) =>
      request<{ report: ReportDto }>(`/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    listAuditLogs: (page = 1) =>
      request<any[]>(`/admin/audit-logs?page=${page}`),
    bootstrap: (secretKey: string, email: string, password: string, displayName: string) =>
      request<{ message: string; adminId: string }>("/admin/bootstrap", {
        method: "POST",
        body: JSON.stringify({ secretKey, email, password, displayName }),
      }),
  },

  analytics: {
    track: (eventName: string, metadata?: Record<string, unknown>) =>
      request<{ tracked: boolean }>("/analytics/track", {
        method: "POST",
        body: JSON.stringify({ eventName, metadata }),
      }),
    summary: () =>
      request<{ summary: Record<string, number> }>("/analytics/summary"),
  },
};
