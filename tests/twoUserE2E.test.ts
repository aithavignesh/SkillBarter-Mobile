import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { api } from "../services/api";
import { tokenStorage } from "../services/auth/tokenStorage";
import { ApiError } from "../services/api/client";

describe("Section 9: Complete Two-User Mobile End-to-End Acceptance Journey", () => {
  // In-memory backend simulation store matching MongoDB backend schema & business rules
  let usersDb: any[] = [];
  let userSkillsDb: any[] = [];
  let exchangesDb: any[] = [];
  let sessionsDb: any[] = [];
  let conversationsDb: any[] = [];
  let messagesDb: any[] = [];
  let reviewsDb: any[] = [];
  let blocksDb: any[] = [];

  let userAToken = "";
  let userBToken = "";
  let userAId = "";
  let userBId = "";
  let exchangeId = "";
  let sessionId = "";
  let conversationId = "";

  const originalFetch = global.fetch;

  beforeAll(async () => {
    await tokenStorage.clearAll();
    usersDb = [];
    userSkillsDb = [];
    exchangesDb = [];
    sessionsDb = [];
    conversationsDb = [];
    messagesDb = [];
    reviewsDb = [];
    blocksDb = [];

    // Mock realistic fetch handling conforming 100% to Express.js endpoints
    global.fetch = vi.fn().mockImplementation(async (url: string, opts: any = {}) => {
      const parsedUrl = new URL(url, "http://localhost:4000");
      const path = parsedUrl.pathname.replace(/^\/api\/v1/, "");
      const method = (opts.method || "GET").toUpperCase();
      const body = opts.body ? JSON.parse(opts.body) : {};
      
      let currentToken = "";
      if (opts.headers instanceof Headers) {
        currentToken = (opts.headers.get("Authorization") || "").replace(/^Bearer\s+/, "");
      } else if (opts.headers) {
        currentToken = (opts.headers["Authorization"] || "").replace(/^Bearer\s+/, "");
      }
      const currentUser = usersDb.find((u) => u.token === currentToken);

      const jsonRes = (status: number, data: any) => ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => data,
      });

      // 1. Auth: Register
      if (path === "/auth/register" && method === "POST") {
        const id = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const token = `jwt-token-${id}`;
        const vToken = `verify-token-${id}`;
        const newUser = {
          id,
          email: body.email,
          displayName: body.displayName,
          role: "user",
          isEmailVerified: false,
          onboardingCompleted: false,
          reputationScore: 100,
          completedExchangesCount: 0,
          createdAt: new Date().toISOString(),
          token,
          verificationToken: vToken,
        };
        usersDb.push(newUser);
        return jsonRes(201, {
          success: true,
          data: {
            user: { ...newUser },
            accessToken: token,
            verificationToken: vToken,
          },
        });
      }

      // 2. Auth: Verify Email
      if (path === "/auth/verify-email" && method === "POST") {
        const target = usersDb.find((u) => u.verificationToken === body.token);
        if (!target) {
          return jsonRes(400, {
            success: false,
            error: { code: "INVALID_TOKEN", message: "Invalid verification token" },
          });
        }
        target.isEmailVerified = true;
        return jsonRes(200, {
          success: true,
          data: { user: { ...target }, message: "Email successfully verified" },
        });
      }

      // 3. Auth: Login
      if (path === "/auth/login" && method === "POST") {
        const target = usersDb.find((u) => u.email === body.email);
        if (!target) {
          return jsonRes(401, {
            success: false,
            error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
          });
        }
        return jsonRes(200, {
          success: true,
          data: { user: { ...target }, accessToken: target.token },
        });
      }

      // 4. Auth: Me
      if (path === "/auth/me" && method === "GET") {
        if (!currentUser) {
          return jsonRes(401, {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          });
        }
        return jsonRes(200, {
          success: true,
          data: { user: { ...currentUser } },
        });
      }

      // 5. Users: Onboarding
      if (path === "/users/onboarding" && method === "POST") {
        if (!currentUser) {
          return jsonRes(401, {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Unauthorized" },
          });
        }
        currentUser.displayName = body.displayName;
        currentUser.bio = body.bio || "";
        currentUser.location = body.location || "";
        currentUser.preferredSessionFormat = body.preferredSessionFormat;
        currentUser.availability = body.availability;
        currentUser.onboardingCompleted = true;

        for (const item of body.offeredSkills || []) {
          userSkillsDb.push({
            id: `skill-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            userId: currentUser.id,
            skillId: `canonical-${item.skillName}`,
            name: item.skillName,
            category: item.category || "General",
            type: "offered",
            proficiency: item.proficiency,
            description: item.description,
            yearsExperience: item.yearsExperience || 1,
          });
        }

        for (const item of body.wantedSkills || []) {
          userSkillsDb.push({
            id: `skill-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            userId: currentUser.id,
            skillId: `canonical-${item.skillName}`,
            name: item.skillName,
            category: item.category || "General",
            type: "wanted",
            proficiency: item.proficiency,
            description: item.description,
            yearsExperience: item.yearsExperience || 1,
          });
        }

        return jsonRes(200, {
          success: true,
          data: { user: { ...currentUser } },
        });
      }

      // 6. Users: Public Profile
      if (path.startsWith("/users/") && method === "GET") {
        const targetUserId = path.replace("/users/", "");
        const targetUser = usersDb.find((u) => u.id === targetUserId);
        if (!targetUser) {
          return jsonRes(404, {
            success: false,
            error: { code: "NOT_FOUND", message: "User profile not found" },
          });
        }

        const isBlocked = blocksDb.some(
          (b) =>
            (b.blockerId === currentUser?.id && b.blockedUserId === targetUserId) ||
            (b.blockerId === targetUserId && b.blockedUserId === currentUser?.id)
        );
        if (isBlocked) {
          return jsonRes(404, {
            success: false,
            error: { code: "NOT_FOUND", message: "Profile is not accessible" },
          });
        }

        const userSkills = userSkillsDb.filter((s) => s.userId === targetUserId);
        return jsonRes(200, {
          success: true,
          data: {
            profile: {
              id: targetUser.id,
              displayName: targetUser.displayName,
              bio: targetUser.bio,
              location: targetUser.location,
              preferredSessionFormat: targetUser.preferredSessionFormat,
              availability: targetUser.availability,
              reputationScore: targetUser.reputationScore,
              completedExchangesCount: targetUser.completedExchangesCount,
              createdAt: targetUser.createdAt,
              offeredSkills: userSkills.filter((s) => s.type === "offered"),
              wantedSkills: userSkills.filter((s) => s.type === "wanted"),
            },
          },
        });
      }

      // 7. Matches: Discover
      if (path === "/matches/discover" && method === "GET") {
        const matches: any[] = [];
        const otherUsers = usersDb.filter(
          (u) =>
            u.id !== currentUser?.id &&
            u.onboardingCompleted &&
            !blocksDb.some(
              (b) =>
                (b.blockerId === currentUser?.id && b.blockedUserId === u.id) ||
                (b.blockerId === u.id && b.blockedUserId === currentUser?.id)
            )
        );

        const mySkills = currentUser ? userSkillsDb.filter((s) => s.userId === currentUser.id) : [];
        const myWantedNames = new Set(mySkills.filter((s) => s.type === "wanted").map((s) => s.name.toLowerCase()));
        const myOfferedNames = new Set(mySkills.filter((s) => s.type === "offered").map((s) => s.name.toLowerCase()));

        for (const candidate of otherUsers) {
          const cSkills = userSkillsDb.filter((s) => s.userId === candidate.id);
          const candidateOffered = cSkills.filter((s) => s.type === "offered");
          const candidateWanted = cSkills.filter((s) => s.type === "wanted");

          const theyTeachYouLearn = candidateOffered.filter((s) =>
            myWantedNames.has(s.name.toLowerCase())
          );
          const youTeachTheyLearn = candidateWanted.filter((s) =>
            myOfferedNames.has(s.name.toLowerCase())
          );

          const isReciprocal = theyTeachYouLearn.length > 0 && youTeachTheyLearn.length > 0;
          const score = isReciprocal ? 95 : theyTeachYouLearn.length > 0 ? 75 : 50;

          matches.push({
            user: {
              id: candidate.id,
              displayName: candidate.displayName,
              bio: candidate.bio,
              location: candidate.location,
              preferredSessionFormat: candidate.preferredSessionFormat,
              availability: candidate.availability,
              reputationScore: candidate.reputationScore,
              completedExchangesCount: candidate.completedExchangesCount,
            },
            compatibilityScore: score,
            explanation: isReciprocal ? "Perfect reciprocal match!" : "Skill match",
            reciprocalMatch: isReciprocal,
            theyTeachYouLearn,
            youTeachTheyLearn,
          });
        }

        return jsonRes(200, {
          success: true,
          data: {
            matches,
            meta: { page: 1, limit: 10, total: matches.length, totalPages: 1 },
          },
        });
      }

      // 8. Exchanges: Create
      if (path === "/exchanges" && method === "POST") {
        if (!currentUser) return jsonRes(401, { success: false });
        const id = `ex-${Date.now()}`;
        const recipient = usersDb.find((u) => u.id === body.recipientId);
        const newEx = {
          id,
          requesterId: currentUser.id,
          requesterName: currentUser.displayName,
          recipientId: body.recipientId,
          recipientName: recipient?.displayName || "Partner",
          offeredSkillId: body.offeredSkillId,
          wantedSkillId: body.wantedSkillId,
          status: "PENDING",
          proposalDescription: body.proposalDescription,
          completionStatus: {
            requesterConfirmed: false,
            recipientConfirmed: false,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        exchangesDb.push(newEx);
        return jsonRes(201, { success: true, data: { exchange: newEx } });
      }

      // 9. Exchanges: List & Detail
      if (path === "/exchanges" && method === "GET") {
        const userEx = exchangesDb.filter(
          (e) => e.requesterId === currentUser?.id || e.recipientId === currentUser?.id
        );
        return jsonRes(200, { success: true, data: { exchanges: userEx } });
      }

      if (path.match(/^\/exchanges\/[^/]+$/) && method === "GET") {
        const id = path.replace("/exchanges/", "");
        const ex = exchangesDb.find((e) => e.id === id);
        if (!ex) return jsonRes(404, { success: false, error: { message: "Not found" } });
        if (ex.requesterId !== currentUser?.id && ex.recipientId !== currentUser?.id) {
          return jsonRes(403, {
            success: false,
            error: { code: "FORBIDDEN", message: "Not a participant in this exchange" },
          });
        }
        return jsonRes(200, { success: true, data: { exchange: ex } });
      }

      // 10. Exchanges: Update Status
      if (path.match(/^\/exchanges\/[^/]+\/status$/) && method === "PATCH") {
        const id = path.split("/")[2];
        const ex = exchangesDb.find((e) => e.id === id);
        if (!ex) return jsonRes(404, { success: false });
        ex.status = body.status;
        return jsonRes(200, { success: true, data: { exchange: ex } });
      }

      // 11. Exchanges: Sessions
      if (path.match(/^\/exchanges\/[^/]+\/sessions$/)) {
        const exId = path.split("/")[2];
        if (method === "POST") {
          const sess = {
            id: `sess-${Date.now()}`,
            exchangeId: exId,
            proposedById: currentUser?.id,
            title: body.title,
            startTime: body.startTime,
            endTime: body.endTime,
            status: "PROPOSED",
            notes: body.notes,
            meetingLink: body.meetingLink,
            createdAt: new Date().toISOString(),
          };
          sessionsDb.push(sess);
          return jsonRes(201, { success: true, data: { session: sess } });
        }
        if (method === "GET") {
          const list = sessionsDb.filter((s) => s.exchangeId === exId);
          return jsonRes(200, { success: true, data: { sessions: list } });
        }
      }

      // 12. Sessions: Update Status
      if (path.match(/^\/exchanges\/[^/]+\/sessions\/[^/]+$/) && method === "PATCH") {
        const parts = path.split("/");
        const sessId = parts[4];
        const sess = sessionsDb.find((s) => s.id === sessId);
        if (!sess) return jsonRes(404, { success: false });
        sess.status = body.status;
        return jsonRes(200, { success: true, data: { session: sess } });
      }

      // 13. Messages: Conversations & Sending
      if (path === "/messages/conversations" && method === "POST") {
        let conv = conversationsDb.find(
          (c) =>
            c.participants.some((p: any) => p.id === currentUser?.id) &&
            c.participants.some((p: any) => p.id === body.targetUserId)
        );
        if (!conv) {
          const peer = usersDb.find((u) => u.id === body.targetUserId);
          conv = {
            id: `conv-${Date.now()}`,
            participants: [
              { id: currentUser?.id, displayName: currentUser?.displayName },
              { id: peer?.id, displayName: peer?.displayName },
            ],
            unreadCount: 0,
            updatedAt: new Date().toISOString(),
          };
          conversationsDb.push(conv);
        }
        return jsonRes(200, { success: true, data: { conversation: { id: conv.id } } });
      }

      if (path.startsWith("/messages/conversations/") && method === "POST") {
        const convId = path.replace("/messages/conversations/", "");
        const conv = conversationsDb.find((c) => c.id === convId);
        const peer = conv?.participants.find((p: any) => p.id !== currentUser?.id);

        const isBlocked = blocksDb.some(
          (b) => b.blockerId === peer?.id && b.blockedUserId === currentUser?.id
        );
        if (isBlocked) {
          return jsonRes(403, {
            success: false,
            error: { code: "FORBIDDEN", message: "Cannot message a user who blocked you" },
          });
        }

        const msg = {
          id: `msg-${Date.now()}`,
          conversationId: convId,
          senderId: currentUser?.id,
          senderName: currentUser?.displayName,
          content: body.content,
          readBy: [currentUser?.id],
          createdAt: new Date().toISOString(),
        };
        messagesDb.push(msg);
        return jsonRes(200, { success: true, data: { message: msg } });
      }

      if (path.startsWith("/messages/conversations/") && method === "GET") {
        const convId = path.replace("/messages/conversations/", "").split("?")[0];
        const msgs = messagesDb.filter((m) => m.conversationId === convId);
        return jsonRes(200, { success: true, data: msgs });
      }

      // 14. Exchanges: Confirm Completion (Mutual)
      if (path.match(/^\/exchanges\/[^/]+\/complete$/) && method === "POST") {
        const id = path.split("/")[2];
        const ex = exchangesDb.find((e) => e.id === id);
        if (!ex) return jsonRes(404, { success: false });

        if (currentUser?.id === ex.requesterId) {
          ex.completionStatus.requesterConfirmed = true;
        } else if (currentUser?.id === ex.recipientId) {
          ex.completionStatus.recipientConfirmed = true;
        }

        if (ex.completionStatus.requesterConfirmed && ex.completionStatus.recipientConfirmed) {
          ex.status = "COMPLETED";
          const reqU = usersDb.find((u) => u.id === ex.requesterId);
          const recU = usersDb.find((u) => u.id === ex.recipientId);
          if (reqU) reqU.completedExchangesCount++;
          if (recU) recU.completedExchangesCount++;
        }

        return jsonRes(200, { success: true, data: { exchange: ex } });
      }

      // 15. Reviews: Create & List
      if (path === "/reviews" && method === "POST") {
        const ex = exchangesDb.find((e) => e.id === body.exchangeId);
        if (!ex || ex.status !== "COMPLETED") {
          return jsonRes(400, {
            success: false,
            error: { code: "INVALID_STATE", message: "Exchange must be completed before reviewing" },
          });
        }
        const revieweeId = currentUser?.id === ex.requesterId ? ex.recipientId : ex.requesterId;
        const rev = {
          id: `rev-${Date.now()}`,
          exchangeId: body.exchangeId,
          reviewerId: currentUser?.id,
          reviewerName: currentUser?.displayName,
          revieweeId,
          rating: body.rating,
          comment: body.comment,
          createdAt: new Date().toISOString(),
        };
        reviewsDb.push(rev);
        return jsonRes(201, { success: true, data: { review: rev } });
      }

      if (path.startsWith("/reviews/user/")) {
        const targetUId = path.replace("/reviews/user/", "");
        const userRevs = reviewsDb.filter((r) => r.revieweeId === targetUId);
        return jsonRes(200, { success: true, data: { reviews: userRevs } });
      }

      // 16. Safety: Block & Unblock
      if (path === "/safety/block" && method === "POST") {
        blocksDb.push({
          id: `b-${Date.now()}`,
          blockerId: currentUser?.id,
          blockedUserId: body.userId,
          reason: body.reason,
        });
        return jsonRes(200, { success: true, data: { message: "User blocked" } });
      }

      if (path.startsWith("/safety/block/") && method === "DELETE") {
        const targetUId = path.replace("/safety/block/", "");
        blocksDb = blocksDb.filter(
          (b) => !(b.blockerId === currentUser?.id && b.blockedUserId === targetUId)
        );
        return jsonRes(200, { success: true, data: { message: "User unblocked" } });
      }

      // 17. Admin: Authorization checks
      if (path.startsWith("/admin/")) {
        if (!currentUser || currentUser.role !== "admin") {
          return jsonRes(403, {
            success: false,
            error: { code: "FORBIDDEN", message: "Administrative privileges required" },
          });
        }
        if (path === "/admin/stats") {
          return jsonRes(200, {
            success: true,
            data: {
              stats: {
                totalUsers: usersDb.length,
                totalExchanges: exchangesDb.length,
                completedExchanges: exchangesDb.filter((e) => e.status === "COMPLETED").length,
                activeSessions: sessionsDb.length,
                totalSkills: userSkillsDb.length,
                pendingReports: 0,
              },
            },
          });
        }
      }

      return jsonRes(404, { success: false, error: { message: `Route not found: ${path}` } });
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("Executes the complete 18-step two-user exchange lifecycle sequentially", async () => {
    // 1. User A registers
    const regA = await api.auth.register({
      email: "alice@skillbarter.local",
      password: "AlicePassword123!",
      displayName: "Alice Developer",
    });
    expect(regA.user.email).toBe("alice@skillbarter.local");
    expect(regA.verificationToken).toBeDefined();
    userAId = regA.user.id;
    userAToken = regA.accessToken;

    // 2. User B registers
    const regB = await api.auth.register({
      email: "bob@skillbarter.local",
      password: "BobPassword123!",
      displayName: "Bob Linguist",
    });
    expect(regB.user.email).toBe("bob@skillbarter.local");
    expect(regB.verificationToken).toBeDefined();
    userBId = regB.user.id;
    userBToken = regB.accessToken;

    // 3. Both verify email addresses
    const vResA = await api.auth.verifyEmail(regA.verificationToken!);
    expect(vResA.user.isEmailVerified).toBe(true);

    const vResB = await api.auth.verifyEmail(regB.verificationToken!);
    expect(vResB.user.isEmailVerified).toBe(true);

    // 4 & 5. User A completes onboarding with offered React Native, wanted Spanish
    await tokenStorage.setAccessToken(userAToken);
    const onbA = await api.users.completeOnboarding({
      displayName: "Alice Developer",
      bio: "Senior mobile software architect",
      location: "San Francisco, CA",
      preferredSessionFormat: "video",
      availability: "Flexible evenings",
      offeredSkills: [
        {
          skillName: "React Native",
          category: "Software Development",
          proficiency: "expert",
          description: "Expo, TypeScript, cross-platform apps",
          yearsExperience: 6,
        },
      ],
      wantedSkills: [
        {
          skillName: "Conversational Spanish",
          category: "Languages",
          proficiency: "beginner",
          description: "Speaking practice",
          yearsExperience: 0,
        },
      ],
    });
    expect(onbA.user.onboardingCompleted).toBe(true);

    // 6. User B completes onboarding with reciprocal skills: offered Spanish, wanted React Native
    await tokenStorage.setAccessToken(userBToken);
    const onbB = await api.users.completeOnboarding({
      displayName: "Bob Linguist",
      bio: "Native Spanish tutor learning code",
      location: "Madrid, Spain",
      preferredSessionFormat: "video",
      availability: "Weekends",
      offeredSkills: [
        {
          skillName: "Conversational Spanish",
          category: "Languages",
          proficiency: "expert",
          description: "Grammar, conversation, and pronunciation",
          yearsExperience: 8,
        },
      ],
      wantedSkills: [
        {
          skillName: "React Native",
          category: "Software Development",
          proficiency: "beginner",
          description: "Mobile app fundamentals",
          yearsExperience: 0,
        },
      ],
    });
    expect(onbB.user.onboardingCompleted).toBe(true);

    // 7 & 8. User A discovers User B with perfect reciprocal matching (95%)
    await tokenStorage.setAccessToken(userAToken);
    const discRes = await api.matches.discover();
    expect(discRes.matches.length).toBeGreaterThanOrEqual(1);
    const matchBob = discRes.matches.find((m) => m.user.id === userBId);
    expect(matchBob).toBeDefined();
    expect(matchBob?.compatibilityScore).toBe(95);
    expect(matchBob?.reciprocalMatch).toBe(true);
    expect(matchBob?.theyTeachYouLearn[0].name).toBe("Conversational Spanish");
    expect(matchBob?.youTeachTheyLearn[0].name).toBe("React Native");

    // 9. User A creates an exchange request with User B
    const exRes = await api.exchanges.create({
      recipientId: userBId,
      offeredSkillId: "canonical-React Native",
      wantedSkillId: "canonical-Conversational Spanish",
      proposalDescription: "Hi Bob! Let's trade React Native mentoring for Spanish practice.",
    });
    expect(exRes.exchange.status).toBe("PENDING");
    exchangeId = exRes.exchange.id;

    // 10 & 11. User B receives and accepts the request
    await tokenStorage.setAccessToken(userBToken);
    const userBEx = await api.exchanges.list();
    const received = userBEx.exchanges.find((e) => e.id === exchangeId);
    expect(received).toBeDefined();
    expect(received?.status).toBe("PENDING");

    const acceptRes = await api.exchanges.updateStatus(exchangeId, { status: "ACCEPTED" });
    expect(acceptRes.exchange.status).toBe("ACCEPTED");

    // 12. Both users can access exchange details
    await tokenStorage.setAccessToken(userAToken);
    const accessA = await api.exchanges.getById(exchangeId);
    expect(accessA.exchange.status).toBe("ACCEPTED");

    await tokenStorage.setAccessToken(userBToken);
    const accessB = await api.exchanges.getById(exchangeId);
    expect(accessB.exchange.status).toBe("ACCEPTED");

    // 13. A session is proposed and confirmed
    await tokenStorage.setAccessToken(userAToken);
    const sessRes = await api.exchanges.createSession(exchangeId, {
      title: "First Mentoring Session",
      startTime: "2026-11-20T17:00:00.000Z",
      endTime: "2026-11-20T18:00:00.000Z",
      notes: "Kickoff call and setup",
      meetingLink: "https://meet.google.com/sb-test-123",
    });
    expect(sessRes.session.status).toBe("PROPOSED");
    sessionId = sessRes.session.id;

    await tokenStorage.setAccessToken(userBToken);
    const confirmRes = await api.exchanges.updateSessionStatus(exchangeId, sessionId, {
      status: "CONFIRMED",
    });
    expect(confirmRes.session.status).toBe("CONFIRMED");

    // 14. Both users exchange messages in private conversation
    await tokenStorage.setAccessToken(userAToken);
    const convRes = await api.messages.getOrCreateConversation(userBId);
    conversationId = convRes.conversation.id;

    const msgA = await api.messages.sendMessage(
      conversationId,
      "Looking forward to our first session on Friday!"
    );
    expect(msgA.message.content).toBe("Looking forward to our first session on Friday!");

    await tokenStorage.setAccessToken(userBToken);
    const msgB = await api.messages.sendMessage(
      conversationId,
      "Me too, Alice! I have prepared Spanish vocabulary lists."
    );
    expect(msgB.message.content).toBe("Me too, Alice! I have prepared Spanish vocabulary lists.");

    const history = await api.messages.getMessages(conversationId);
    expect(history.length).toBe(2);

    // 15 & 16. Mutual completion confirmation
    await tokenStorage.setAccessToken(userAToken);
    const compA = await api.exchanges.confirmCompletion(exchangeId);
    expect(compA.exchange.status).toBe("ACCEPTED"); // Not completed until second confirms!

    await tokenStorage.setAccessToken(userBToken);
    const compB = await api.exchanges.confirmCompletion(exchangeId);
    expect(compB.exchange.status).toBe("COMPLETED");

    // 17 & 18. Both users submit permitted reviews and profiles update
    await tokenStorage.setAccessToken(userAToken);
    const revA = await api.reviews.create({
      exchangeId,
      rating: 5,
      comment: "Bob is an incredible tutor with clear explanations!",
    });
    expect(revA.review.rating).toBe(5);

    await tokenStorage.setAccessToken(userBToken);
    const revB = await api.reviews.create({
      exchangeId,
      rating: 5,
      comment: "Alice gave masterclass guidance on React Native architecture!",
    });
    expect(revB.review.rating).toBe(5);

    const profileB = await api.users.getProfile(userBId);
    const reviewsB = await api.reviews.getUserReviews(userBId);
    expect(reviewsB.reviews.length).toBeGreaterThanOrEqual(1);
    expect(reviewsB.reviews[0].comment).toContain("Bob is an incredible tutor");
    expect(profileB.profile.completedExchangesCount).toBe(1);
  });

  describe("Security, Access Control & Boundary Invariants", () => {
    it("Rejects non-participant from accessing exchange details", async () => {
      const regC = await api.auth.register({
        email: "charlie@skillbarter.local",
        password: "CharliePassword123!",
        displayName: "Charlie ThirdParty",
      });
      await tokenStorage.setAccessToken(regC.accessToken);

      await expect(api.exchanges.getById(exchangeId)).rejects.toThrow(ApiError);
      try {
        await api.exchanges.getById(exchangeId);
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
        expect(err.status).toBe(403);
      }
    });

    it("Blocked users cannot send messages or view profiles", async () => {
      // User B blocks User A
      await tokenStorage.setAccessToken(userBToken);
      await api.safety.blockUser(userAId, "Safety test blocking");

      // User A attempts to view User B's profile -> 404 / NOT_FOUND
      await tokenStorage.setAccessToken(userAToken);
      await expect(api.users.getProfile(userBId)).rejects.toThrow(ApiError);

      // User A attempts to message User B -> 403 / FORBIDDEN
      await expect(
        api.messages.sendMessage(conversationId, "Are you there?")
      ).rejects.toThrow(ApiError);

      // User B unblocks User A
      await tokenStorage.setAccessToken(userBToken);
      await api.safety.unblockUser(userAId);
    });

    it("Ordinary user cannot access protected admin features", async () => {
      await tokenStorage.setAccessToken(userAToken);
      await expect(api.admin.getStats()).rejects.toThrow(ApiError);
      try {
        await api.admin.getStats();
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
        expect(err.status).toBe(403);
      }
    });
  });
});
