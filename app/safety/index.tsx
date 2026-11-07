import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Header } from "@/components/navigation/Header";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function SafetyScreen() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"blocked" | "report">("blocked");

  // Report Form State
  const [targetType, setTargetType] = useState<"user" | "message" | "review" | "community_post">("user");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Fetch Blocked Users
  const {
    data: blockedData,
    refetch: refetchBlocked,
  } = useQuery({
    queryKey: ["safety", "blocked"],
    queryFn: () => api.safety.listBlocked(),
  });

  const handleUnblock = (userId: string) => {
    Alert.alert("Unblock Member", "Are you sure you want to unblock this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        onPress: async () => {
          try {
            await api.safety.unblockUser(userId);
            await refetchBlocked();
            await queryClient.invalidateQueries({ queryKey: ["matches"] });
            Alert.alert("Success", "User unblocked successfully.");
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to unblock user.");
          }
        },
      },
    ]);
  };

  const handleSubmitReport = async () => {
    if (!targetId.trim()) {
      Alert.alert("Error", "Target ID is required");
      return;
    }
    if (reason.trim().length < 3) {
      Alert.alert("Error", "Reason must be at least 3 characters");
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert("Error", "Description must be at least 10 characters");
      return;
    }

    setSubmittingReport(true);
    try {
      await api.safety.createReport({
        targetType,
        targetId: targetId.trim(),
        reason: reason.trim(),
        description: description.trim(),
      });
      setTargetId("");
      setReason("");
      setDescription("");
      Alert.alert("Report Received", "Thank you. Our moderation team will investigate this report.");
    } catch (err: any) {
      Alert.alert("Report Error", err.message || "Failed to submit moderation report.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const blockedUsers = blockedData?.blockedUsers || [];

  return (
    <View style={styles.container}>
      <Header title="Safety & Privacy Center" showBack />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab("blocked")}
          style={[styles.tabBtn, activeTab === "blocked" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "blocked" && styles.tabTextActive,
            ]}
          >
            Blocked Members ({blockedUsers.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("report")}
          style={[styles.tabBtn, activeTab === "report" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "report" && styles.tabTextActive,
            ]}
          >
            File a Report
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === "blocked" ? (
          <>
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>About Two-Way Blocking</Text>
              <Text style={styles.infoDesc}>
                Blocked users cannot see your profile in discover, propose exchanges, or send you private messages.
              </Text>
            </Card>

            {blockedUsers.length === 0 ? (
              <Card style={{ alignItems: "center", padding: spacing.xl }}>
                <Text style={{ color: colors.textPrimary, fontWeight: "bold" }}>
                  No Blocked Members
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  You have not blocked any members.
                </Text>
              </Card>
            ) : (
              blockedUsers.map((b) => (
                <Card key={b.id} style={styles.blockedCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.blockedId}>
                      Blocked User ID: {b.blockedUserId}
                    </Text>
                    {b.reason ? (
                      <Text style={styles.blockedReason}>Reason: "{b.reason}"</Text>
                    ) : null}
                  </View>
                  <Button
                    title="Unblock"
                    size="sm"
                    variant="outline"
                    onPress={() => handleUnblock(b.blockedUserId)}
                  />
                </Card>
              ))
            )}
          </>
        ) : (
          <Card style={styles.reportCard}>
            <Text style={styles.reportTitle}>Submit Moderation Report</Text>
            <Text style={styles.reportSub}>
              SkillBarter is dedicated to maintaining a safe, respectful environment. Reports are confidentially reviewed by platform administrators.
            </Text>

            <Text style={styles.label}>Target Type</Text>
            <View style={styles.typeRow}>
              {(["user", "message", "review", "community_post"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTargetType(t)}
                  style={[
                    styles.typeBtn,
                    targetType === t && styles.typeBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      targetType === t && styles.typeBtnTextActive,
                    ]}
                  >
                    {t.replace("_", " ")}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Input
              label="Target ID *"
              placeholder="User ID, Post ID, or Message ID"
              value={targetId}
              onChangeText={setTargetId}
            />

            <Input
              label="Reason Category *"
              placeholder="e.g. Harassment, Spam, Inappropriate behavior"
              value={reason}
              onChangeText={setReason}
            />

            <Input
              label="Detailed Explanation *"
              placeholder="Describe what occurred with as much context as possible..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              helper="Min 10 characters."
            />

            <Button
              title="Submit Report"
              variant="danger"
              size="lg"
              loading={submittingReport}
              style={{ marginTop: spacing.md }}
              onPress={handleSubmitReport}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    backgroundColor: colors.cardDark,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  content: {
    padding: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.md,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderColor: colors.primary,
  },
  infoTitle: {
    color: colors.primary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  infoDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    lineHeight: 18,
  },
  blockedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  blockedId: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontFamily: "monospace",
  },
  blockedReason: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  reportCard: {
    padding: spacing.lg,
  },
  reportTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
  reportSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  typeBtnActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  typeBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: "capitalize",
  },
  typeBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
