import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { SessionStatus } from "@/types";
import { Header } from "@/components/navigation/Header";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { SessionCard } from "@/components/cards/SessionCard";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function ExchangeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Propose Session Modal
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("Skill Exchange Session");
  const [sessionDate, setSessionDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [startTimeStr, setStartTimeStr] = useState("18:00");
  const [endTimeStr, setEndTimeStr] = useState("19:00");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");

  // Review Modal
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Dispute Modal
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const {
    data: exchangeData,
    isLoading: exchangeLoading,
    error: exchangeError,
    refetch: refetchExchange,
    isRefetching,
  } = useQuery({
    queryKey: ["exchange", id],
    queryFn: () => api.exchanges.getById(id!),
    enabled: !!id,
  });

  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ["exchange", id, "sessions"],
    queryFn: () => api.exchanges.listSessions(id!),
    enabled: !!id,
  });

  const exchange = exchangeData?.exchange;
  const sessions = sessionsData?.sessions || [];

  const isRequester = exchange?.requesterId === user?.id;
  const partnerId = isRequester ? exchange?.recipientId : exchange?.requesterId;
  const partnerName = isRequester
    ? exchange?.recipientName || "Member"
    : exchange?.requesterName || "Member";

  const handleStatusTransition = async (
    status: "ACCEPTED" | "REJECTED" | "CANCELLED" | "IN_PROGRESS"
  ) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.exchanges.updateStatus(id!, { status });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exchange", id] }),
        queryClient.invalidateQueries({ queryKey: ["exchanges"] }),
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update exchange status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.exchanges.confirmCompletion(id!);
      await queryClient.invalidateQueries({ queryKey: ["exchange", id] });
      Alert.alert(
        "Completion Recorded",
        "Your confirmation has been saved! When both members confirm, the exchange is marked completed."
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record completion.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenConversation = async () => {
    if (!partnerId) return;
    setActionLoading(true);
    try {
      const res = await api.messages.getOrCreateConversation(partnerId);
      router.push(`/conversations/${res.conversation.id}` as any);
    } catch (err: any) {
      Alert.alert("Messaging Error", err.message || "Failed to open conversation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeSession = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const startIso = new Date(`${sessionDate}T${startTimeStr}:00Z`).toISOString();
      const endIso = new Date(`${sessionDate}T${endTimeStr}:00Z`).toISOString();

      await api.exchanges.createSession(id!, {
        title: sessionTitle.trim(),
        startTime: startIso,
        endTime: endIso,
        notes: notes.trim(),
        meetingLink: meetingLink.trim() || undefined,
      });

      setSessionModalVisible(false);
      await refetchSessions();
      await queryClient.invalidateQueries({ queryKey: ["exchange", id] });
    } catch (err: any) {
      Alert.alert("Scheduling Error", err.message || "Failed to schedule session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSessionStatus = async (
    sessionId: string,
    status: SessionStatus
  ) => {
    if (status === "PROPOSED") return;
    setActionLoading(true);
    try {
      await api.exchanges.updateSessionStatus(id!, sessionId, { status });
      await refetchSessions();
    } catch (err: any) {
      Alert.alert("Session Error", err.message || "Failed to update session status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewComment.trim().length < 5) {
      Alert.alert("Review Error", "Comment must be at least 5 characters");
      return;
    }
    setActionLoading(true);
    try {
      await api.reviews.create({
        exchangeId: id!,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewModalVisible(false);
      Alert.alert("Success", "Your review has been submitted!");
    } catch (err: any) {
      Alert.alert("Review Error", err.message || "Failed to submit review.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (disputeReason.trim().length < 10) {
      Alert.alert("Dispute Error", "Please provide a reason with at least 10 characters");
      return;
    }
    setActionLoading(true);
    try {
      await api.exchanges.dispute(id!, disputeReason.trim());
      setDisputeModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: ["exchange", id] });
      Alert.alert("Dispute Opened", "Our moderation team has been alerted.");
    } catch (err: any) {
      Alert.alert("Dispute Error", err.message || "Failed to open dispute.");
    } finally {
      setActionLoading(false);
    }
  };

  if (exchangeLoading) {
    return <LoadingSpinner message="Loading exchange details..." />;
  }

  if (exchangeError || !exchange) {
    return (
      <View style={styles.container}>
        <Header title="Exchange Details" showBack />
        <View style={{ padding: spacing.md }}>
          <ErrorAlert
            message={(exchangeError as any)?.message || "Exchange not found"}
            onRetry={() => refetchExchange()}
          />
        </View>
      </View>
    );
  }

  const myConfirmed = isRequester
    ? exchange.completionStatus.requesterConfirmed
    : exchange.completionStatus.recipientConfirmed;
  const partnerConfirmed = isRequester
    ? exchange.completionStatus.recipientConfirmed
    : exchange.completionStatus.requesterConfirmed;

  return (
    <View style={styles.container}>
      <Header
        title={`Exchange with ${partnerName}`}
        showBack
        rightAction={
          <Button
            title="Chat 💬"
            size="sm"
            variant="outline"
            onPress={handleOpenConversation}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetchExchange();
              refetchSessions();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {errorMsg && <ErrorAlert message={errorMsg} />}

        {/* Overview Card */}
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.exchangeId}>ID: {exchange.id.slice(-8)}</Text>
            <Badge label={exchange.status} variant="primary" />
          </View>

          <View style={styles.skillsBox}>
            <View style={styles.skillItem}>
              <Text style={styles.skillSub}>
                {isRequester ? "You Teach" : `${partnerName} Teaches`}
              </Text>
              <Text style={styles.skillName}>
                {exchange.offeredSkillName || "Skill"}
              </Text>
            </View>
            <Text style={styles.tradeArrow}>⇄</Text>
            <View style={styles.skillItem}>
              <Text style={styles.skillSub}>
                {isRequester ? "You Learn" : `${partnerName} Learns`}
              </Text>
              <Text style={styles.skillName}>
                {exchange.wantedSkillName || "Skill"}
              </Text>
            </View>
          </View>

          <Text style={styles.proposalTitle}>Proposal Message:</Text>
          <Text style={styles.proposalText}>"{exchange.proposalDescription}"</Text>

          {/* Pending Actions */}
          {exchange.status === "PENDING" && !isRequester && (
            <View style={styles.actionRow}>
              <Button
                title="Decline"
                variant="danger"
                size="md"
                style={{ flex: 1 }}
                loading={actionLoading}
                onPress={() => handleStatusTransition("REJECTED")}
              />
              <Button
                title="Accept Barter"
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
                loading={actionLoading}
                onPress={() => handleStatusTransition("ACCEPTED")}
              />
            </View>
          )}

          {exchange.status === "PENDING" && isRequester && (
            <Button
              title="Cancel Barter Request"
              variant="outline"
              size="md"
              loading={actionLoading}
              style={{ marginTop: spacing.md }}
              onPress={() => handleStatusTransition("CANCELLED")}
            />
          )}
        </Card>

        {/* Active & Scheduled State: Sessions & Completion */}
        {["ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(exchange.status) && (
          <>
            {/* Completion Status Indicator */}
            <Card style={styles.completionCard}>
              <Text style={styles.completionTitle}>Exchange Progress & Completion</Text>
              <Text style={styles.completionDesc}>
                Both members must mutually confirm when the exchange is finished.
              </Text>

              <View style={styles.confirmationStatusBox}>
                <Text style={styles.confirmStateText}>
                  Your confirmation: {myConfirmed ? "✅ Confirmed" : "⏳ Pending"}
                </Text>
                <Text style={styles.confirmStateText}>
                  {partnerName}'s confirmation:{" "}
                  {partnerConfirmed ? "✅ Confirmed" : "⏳ Pending"}
                </Text>
              </View>

              <View style={styles.actionRow}>
                <Button
                  title={myConfirmed ? "Already Confirmed" : "Confirm Completion ✓"}
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                  disabled={myConfirmed}
                  loading={actionLoading}
                  onPress={handleConfirmCompletion}
                />
                <Button
                  title="Dispute ⚠️"
                  variant="outline"
                  size="md"
                  onPress={() => setDisputeModalVisible(true)}
                />
              </View>
            </Card>

            {/* Sessions Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sessions ({sessions.length})</Text>
              <Button
                title="+ Propose Session"
                size="sm"
                variant="primary"
                onPress={() => setSessionModalVisible(true)}
              />
            </View>

            {sessions.length === 0 ? (
              <Card style={{ alignItems: "center", padding: spacing.md }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  No sessions scheduled yet. Propose a meeting time to start exchanging!
                </Text>
              </Card>
            ) : (
              sessions.map((sess) => (
                <SessionCard
                  key={sess.id}
                  session={sess}
                  currentUserId={user?.id || ""}
                  onUpdateStatus={handleUpdateSessionStatus}
                />
              ))
            )}
          </>
        )}

        {/* Completed State: Leave Review */}
        {exchange.status === "COMPLETED" && (
          <Card style={styles.completedCard}>
            <Text style={styles.completedTitle}>🎉 Exchange Completed!</Text>
            <Text style={styles.completedSub}>
              You and {partnerName} have successfully completed this skill barter exchange.
            </Text>
            <Button
              title="Leave a Review & Rating ★"
              variant="primary"
              size="md"
              style={{ marginTop: spacing.md }}
              onPress={() => setReviewModalVisible(true)}
            />
          </Card>
        )}

        {exchange.status === "DISPUTED" && (
          <Card style={{ borderColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontWeight: "bold", fontSize: 14 }}>
              Dispute Under Moderation
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              Reason: {exchange.disputeReason || "No details provided"}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Propose Session Modal */}
      <Modal visible={sessionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Propose Exchange Session</Text>

            <Input
              label="Session Title"
              value={sessionTitle}
              onChangeText={setSessionTitle}
            />

            <Input
              label="Date (YYYY-MM-DD)"
              value={sessionDate}
              onChangeText={setSessionDate}
              helper="e.g. 2026-11-15"
            />

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Input
                label="Start Time (HH:MM UTC)"
                value={startTimeStr}
                onChangeText={setStartTimeStr}
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="End Time (HH:MM UTC)"
                value={endTimeStr}
                onChangeText={setEndTimeStr}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <Input
              label="Meeting Link"
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChangeText={setMeetingLink}
            />

            <Input
              label="Agenda / Notes"
              placeholder="What will you cover in this session?"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setSessionModalVisible(false)}
              />
              <Button
                title="Send Proposal"
                variant="primary"
                style={{ flex: 1 }}
                loading={actionLoading}
                onPress={handleProposeSession}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Your Experience</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  title={star <= reviewRating ? "★" : "☆"}
                  variant={star <= reviewRating ? "primary" : "ghost"}
                  size="sm"
                  style={{ minWidth: 44, marginHorizontal: 4 }}
                  onPress={() => setReviewRating(star)}
                />
              ))}
            </View>

            <Input
              label="Review Comments *"
              placeholder="How was the mentorship and skill exchange?"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
              helper="Min 5 characters."
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setReviewModalVisible(false)}
              />
              <Button
                title="Submit Review"
                variant="primary"
                style={{ flex: 1 }}
                loading={actionLoading}
                onPress={handleSubmitReview}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Dispute Modal */}
      <Modal visible={disputeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Raise a Dispute</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
              Please describe the issue preventing completion of this exchange.
            </Text>

            <Input
              placeholder="Explain the issue (min 10 characters)..."
              value={disputeReason}
              onChangeText={setDisputeReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setDisputeModalVisible(false)}
              />
              <Button
                title="Submit Dispute"
                variant="danger"
                style={{ flex: 1 }}
                loading={actionLoading}
                onPress={handleSubmitDispute}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  exchangeId: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  skillsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
  },
  skillItem: {
    flex: 1,
  },
  skillSub: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
  },
  skillName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2,
  },
  tradeArrow: {
    color: colors.primary,
    fontSize: 22,
    marginHorizontal: spacing.sm,
    fontWeight: "bold",
  },
  proposalTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeights.medium,
  },
  proposalText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
    marginTop: 2,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  completionCard: {
    marginBottom: spacing.md,
    borderColor: colors.secondary,
  },
  completionTitle: {
    color: colors.secondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  completionDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  confirmationStatusBox: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  confirmStateText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
  completedCard: {
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: colors.secondary,
  },
  completedTitle: {
    color: colors.secondary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
  completedSub: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
});
