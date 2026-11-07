export type SessionFormat = "video" | "chat" | "in_person" | "any";

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type ExchangeStatus =
  | "DRAFT"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type SessionStatus = "PROPOSED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type ConnectionStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type NotificationType =
  | "EXCHANGE_REQUESTED"
  | "EXCHANGE_ACCEPTED"
  | "EXCHANGE_REJECTED"
  | "EXCHANGE_CANCELLED"
  | "SESSION_PROPOSED"
  | "SESSION_CONFIRMED"
  | "SESSION_CANCELLED"
  | "NEW_MESSAGE"
  | "EXCHANGE_COMPLETED"
  | "REVIEW_RECEIVED"
  | "CONNECTION_REQUEST"
  | "CONNECTION_ACCEPTED"
  | "MODERATION_ALERT";

export type ReportTargetType = "user" | "message" | "review" | "community_post";

export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  availability?: string;
  preferredSessionFormat?: SessionFormat;
  reputationScore: number;
  completedExchangesCount: number;
  createdAt: string;
}

export interface UserSkillItem {
  skillName: string;
  category: string;
  proficiency: ProficiencyLevel;
  description?: string;
  yearsExperience?: number;
}

export interface OnboardingInput {
  displayName: string;
  bio?: string;
  location?: string;
  preferredSessionFormat: SessionFormat;
  availability?: string;
  offeredSkills: UserSkillItem[];
  wantedSkills: UserSkillItem[];
}

export interface ProfileUpdateInput {
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  preferredSessionFormat?: SessionFormat;
  availability?: string;
  isProfilePublic?: boolean;
}

export interface PublicUserProfile {
  id: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  preferredSessionFormat: SessionFormat;
  availability?: string;
  reputationScore: number;
  completedExchangesCount: number;
  createdAt: string;
  offeredSkills: Array<{
    id: string;
    skillId: string;
    name: string;
    category: string;
    proficiency: string;
    description?: string;
  }>;
  wantedSkills: Array<{
    id: string;
    skillId: string;
    name: string;
    category: string;
    proficiency: string;
    description?: string;
  }>;
}

export interface SkillDto {
  id: string;
  name: string;
  category: string;
  description?: string;
  approved: boolean;
}

export interface UserSkillDto {
  id: string;
  userId: string;
  skillId: string;
  name: string;
  category: string;
  type: "offered" | "wanted";
  proficiency: ProficiencyLevel;
  description?: string;
  yearsExperience: number;
}

export interface MatchResult {
  user: {
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    location: string;
    preferredSessionFormat: string;
    availability: string;
    reputationScore: number;
    completedExchangesCount: number;
  };
  compatibilityScore: number;
  explanation: string;
  reciprocalMatch: boolean;
  theyTeachYouLearn: Array<{ skillId: string; name: string; proficiency: string }>;
  youTeachTheyLearn: Array<{ skillId: string; name: string; proficiency: string }>;
}

export interface ExchangeDto {
  id: string;
  requesterId: string;
  requesterName?: string;
  recipientId: string;
  recipientName?: string;
  offeredSkillId: string;
  offeredSkillName?: string;
  wantedSkillId: string;
  wantedSkillName?: string;
  status: ExchangeStatus;
  proposalDescription: string;
  cancellationReason?: string;
  disputeReason?: string;
  completionStatus: {
    requesterConfirmed: boolean;
    recipientConfirmed: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeSessionDto {
  id: string;
  exchangeId: string;
  proposedById: string;
  title: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  notes?: string;
  meetingLink?: string;
  createdAt: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  readBy: string[];
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  participants: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string;
  }>;
  exchangeId?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface NotificationDto {
  id: string;
  recipientId: string;
  senderId?: string;
  senderName?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ReviewDto {
  id: string;
  exchangeId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ConnectionDto {
  id: string;
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
  otherUser?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    reputationScore: number;
  };
  createdAt: string;
}

export interface CommunityPostDto {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDto {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string;
  status: ReportStatus;
  moderationNotes?: string;
  createdAt: string;
}

export interface PlatformStatsDto {
  totalUsers: number;
  totalExchanges: number;
  completedExchanges: number;
  activeSessions: number;
  totalSkills: number;
  pendingReports: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}
