import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  phone: z.string().trim().min(8, "Mobile number is required").max(16, "Mobile number is too long").regex(/^(?:[6-9]\\d{9}|\\+[1-9]\\d{7,14})$/, "Enter a valid mobile number, e.g. +919876543210"),
  password: passwordSchema,
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50).trim(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const userSkillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required").max(50).trim(),
  category: z.string().min(1).default("General"),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  description: z.string().max(500).optional().default(""),
  yearsExperience: z.number().min(0).max(50).optional().default(1),
});

export const onboardingSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50).trim(),
  bio: z.string().max(1000).trim().optional().default(""),
  location: z.string().max(100).trim().optional().default(""),
  preferredSessionFormat: z.enum(["video", "chat", "in_person", "any"]).default("video"),
  availability: z.string().max(200).trim().optional().default("Flexible"),
  offeredSkills: z.array(userSkillSchema).min(1, "Please offer at least one skill to teach"),
  wantedSkills: z.array(userSkillSchema).min(1, "Please list at least one skill you want to learn"),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

export const createExchangeSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  offeredSkillId: z.string().min(1, "Skill you are offering is required"),
  wantedSkillId: z.string().min(1, "Skill you want in return is required"),
  proposalDescription: z
    .string()
    .min(10, "Please explain your proposal (at least 10 characters)")
    .max(1500),
});

export type CreateExchangeFormData = z.infer<typeof createExchangeSchema>;

export const createSessionSchema = z
  .object({
    title: z.string().min(3, "Session title is required").max(100).trim(),
    startTime: z.string().datetime("Valid start time required"),
    endTime: z.string().datetime("Valid end time required"),
    notes: z.string().max(1000).optional().default(""),
    meetingLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CreateSessionFormData = z.infer<typeof createSessionSchema>;

export const createReviewSchema = z.object({
  exchangeId: z.string().min(1, "Exchange ID is required"),
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters").max(1000).trim(),
});

export type CreateReviewFormData = z.infer<typeof createReviewSchema>;

export const createReportSchema = z.object({
  targetType: z.enum(["user", "message", "review", "community_post"]),
  targetId: z.string().min(1, "Target ID is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(100).trim(),
  description: z.string().min(10, "Please describe the issue (at least 10 characters)").max(1500).trim(),
});

export type CreateReportFormData = z.infer<typeof createReportSchema>;

export const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150).trim(),
  content: z.string().min(10, "Content must be at least 10 characters").max(5000).trim(),
  tags: z.array(z.string().min(1).max(30).trim()).max(5).default([]),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;
