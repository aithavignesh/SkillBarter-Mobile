import { describe, it, expect } from "vitest";
import {
  passwordSchema,
  registerSchema,
  loginSchema,
  onboardingSchema,
  createExchangeSchema,
  createSessionSchema,
  createReviewSchema,
  createReportSchema,
  createPostSchema,
} from "../utils/validators";

describe("Mobile Form Validation Schemas", () => {
  describe("passwordSchema", () => {
    it("accepts valid complex passwords", () => {
      expect(passwordSchema.safeParse("Password123!").success).toBe(true);
      expect(passwordSchema.safeParse("StrongP@ss99").success).toBe(true);
    });

    it("rejects weak passwords", () => {
      expect(passwordSchema.safeParse("short1!").success).toBe(false); // < 8 chars
      expect(passwordSchema.safeParse("alllowercase1!").success).toBe(false); // No uppercase
      expect(passwordSchema.safeParse("ALLUPPERCASE1!").success).toBe(false); // No lowercase
      expect(passwordSchema.safeParse("NoNumbersHere!").success).toBe(false); // No numbers
    });
  });

  describe("registerSchema", () => {
    it("validates valid registration inputs", () => {
      const res = registerSchema.safeParse({
        displayName: "Alex Rivers",
        email: "alex@example.com",
        password: "Password123!",
      });
      expect(res.success).toBe(true);
    });

    it("rejects invalid emails and short names", () => {
      const badEmail = registerSchema.safeParse({
        displayName: "Alex",
        email: "not-an-email",
        password: "Password123!",
      });
      expect(badEmail.success).toBe(false);

      const shortName = registerSchema.safeParse({
        displayName: "A",
        email: "alex@example.com",
        password: "Password123!",
      });
      expect(shortName.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("validates login inputs", () => {
      expect(
        loginSchema.safeParse({
          email: "user@example.com",
          password: "SecretPassword123!",
        }).success
      ).toBe(true);
    });

    it("rejects missing passwords", () => {
      expect(
        loginSchema.safeParse({
          email: "user@example.com",
          password: "",
        }).success
      ).toBe(false);
    });
  });

  describe("onboardingSchema", () => {
    it("accepts valid onboarding payload with offered and wanted skills", () => {
      const payload = {
        displayName: "Taylor Dev",
        bio: "Senior engineer teaching mobile development",
        location: "Seattle, WA",
        preferredSessionFormat: "video" as const,
        availability: "Evenings",
        offeredSkills: [
          {
            skillName: "React Native",
            category: "Software Development",
            proficiency: "expert" as const,
            description: "Expo, TypeScript, Architecture",
            yearsExperience: 5,
          },
        ],
        wantedSkills: [
          {
            skillName: "Conversational Spanish",
            category: "Languages",
            proficiency: "beginner" as const,
            description: "Travel vocab",
            yearsExperience: 0,
          },
        ],
      };
      const res = onboardingSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it("rejects onboarding when skills are missing", () => {
      const res = onboardingSchema.safeParse({
        displayName: "Taylor Dev",
        preferredSessionFormat: "video",
        offeredSkills: [],
        wantedSkills: [],
      });
      expect(res.success).toBe(false);
    });
  });

  describe("createExchangeSchema", () => {
    it("accepts valid barter proposal", () => {
      const res = createExchangeSchema.safeParse({
        recipientId: "user-123",
        offeredSkillId: "skill-offered-1",
        wantedSkillId: "skill-wanted-2",
        proposalDescription:
          "Hi! I'd love to mentor you on React Native in exchange for Spanish practice.",
      });
      expect(res.success).toBe(true);
    });

    it("rejects proposal with description under 10 characters", () => {
      const res = createExchangeSchema.safeParse({
        recipientId: "user-123",
        offeredSkillId: "skill-1",
        wantedSkillId: "skill-2",
        proposalDescription: "Too short",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("createSessionSchema", () => {
    it("accepts valid session timing where endTime > startTime", () => {
      const res = createSessionSchema.safeParse({
        title: "Session 1: Architecture Overview",
        startTime: "2026-11-15T18:00:00.000Z",
        endTime: "2026-11-15T19:00:00.000Z",
        notes: "Bring your laptop",
        meetingLink: "https://meet.google.com/abc-defg-hij",
      });
      expect(res.success).toBe(true);
    });

    it("rejects sessions where endTime is earlier than startTime", () => {
      const res = createSessionSchema.safeParse({
        title: "Invalid Timing",
        startTime: "2026-11-15T19:00:00.000Z",
        endTime: "2026-11-15T18:00:00.000Z",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("createReviewSchema", () => {
    it("accepts 1 to 5 star ratings with valid comments", () => {
      expect(
        createReviewSchema.safeParse({
          exchangeId: "ex-1",
          rating: 5,
          comment: "Outstanding mentorship, learned a huge amount!",
        }).success
      ).toBe(true);
    });

    it("rejects ratings out of range or comments under 5 characters", () => {
      expect(
        createReviewSchema.safeParse({
          exchangeId: "ex-1",
          rating: 6,
          comment: "Too high rating",
        }).success
      ).toBe(false);

      expect(
        createReviewSchema.safeParse({
          exchangeId: "ex-1",
          rating: 4,
          comment: "bad", // < 5 chars
        }).success
      ).toBe(false);
    });
  });

  describe("createReportSchema & createPostSchema", () => {
    it("validates moderation report", () => {
      expect(
        createReportSchema.safeParse({
          targetType: "user",
          targetId: "target-user-456",
          reason: "Inappropriate language",
          description: "Used offensive language in exchange proposal description.",
        }).success
      ).toBe(true);
    });

    it("validates community post creation", () => {
      expect(
        createPostSchema.safeParse({
          title: "Top 5 Tips for React Native Developers",
          content:
            "Here is a comprehensive overview of tips for optimizing React Native lists and memory...",
          tags: ["reactnative", "expo", "performance"],
        }).success
      ).toBe(true);
    });
  });
});
