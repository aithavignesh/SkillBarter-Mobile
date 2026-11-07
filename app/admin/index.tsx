import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { ReportDto, PlatformStatsDto } from "@/types";
import { Header } from "@/components/navigation/Header";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { SkeletonCard } from "@/components/common/Skeleton";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"stats" | "reports" | "users" | "audit">("stats");

  // Fetch Platform Stats
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    isRefetching: statsRefetching,
  } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.admin.getStats(),
    enabled: user?.role === "admin",
  });

  // Fetch Moderation Reports
  const {
    data: reports,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => api.admin.listReports(1),
    enabled: user?.role === "admin" && activeTab === "reports",
  });

  // Fetch Users
  const {
    data: usersList,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.admin.listUsers(1),
    enabled: user?.role === "admin" && activeTab === "users",
  });

  // Fetch Audit Logs
  const {
    data: auditLogs,
    isLoading: auditLoading,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => api.admin.listAuditLogs(1),
    enabled: user?.role === "admin" && activeTab === "audit",
  });

  // Server-side and client authorization check
  if (user?.role !== "admin") {
    return (
      <View style={styles.container}>
        <Header title="Admin Portal" showBack />
        <View style={{ padding: spacing.xl, alignItems: "center" }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "bold" }}>
            Access Denied
          </Text>
          <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 8 }}>
            Administrative credentials are required to access this portal.
          </Text>
          <Button
            title="Return to Dashboard"
            size="md"
            style={{ marginTop: 20 }}
            onPress={() => router.replace("/(tabs)")}
          />
        </View>
      </View>
    );
  }

  const handleResolveReport = async (reportId: string, actionTaken: any) => {
    try {
      await api.admin.handleReport(reportId, {
        status: "RESOLVED",
        actionTaken,
        moderationNotes: `Resolved by admin with action: ${actionTaken}`,
      });
      await refetchReports();
      Alert.alert("Success", `Report resolved with action: ${actionTaken}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to resolve report.");
    }
  };

  const handleToggleSuspendUser = async (userId: string, isSuspended: boolean) => {
    try {
      await api.admin.updateUser(userId, {
        isSuspended: !isSuspended,
        suspensionReason: !isSuspended ? "Administrative action" : undefined,
      });
      await refetchUsers();
      Alert.alert(
        "User Updated",
        `User account ${!isSuspended ? "suspended" : "restored"}.`
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update user status.");
    }
  };

  const stats = statsData?.stats;

  return (
    <View style={styles.container}>
      <Header title="Platform Administration" showBack />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab("stats")}
          style={[styles.tabBtn, activeTab === "stats" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "stats" && styles.tabTextActive,
            ]}
          >
            Overview
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("reports")}
          style={[styles.tabBtn, activeTab === "reports" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "reports" && styles.tabTextActive,
            ]}
          >
            Reports
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("users")}
          style={[styles.tabBtn, activeTab === "users" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "users" && styles.tabTextActive,
            ]}
          >
            Users
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("audit")}
          style={[styles.tabBtn, activeTab === "audit" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "audit" && styles.tabTextActive,
            ]}
          >
            Audit
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={statsRefetching}
            onRefresh={() => {
              refetchStats();
              refetchReports();
              refetchUsers();
              refetchAudit();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {statsError && (
          <ErrorAlert
            message={(statsError as any)?.message || "Failed to load admin stats"}
            onRetry={() => refetchStats()}
          />
        )}

        {/* Tab 1: Stats Overview */}
        {activeTab === "stats" && (
          <>
            {statsLoading ? (
              <SkeletonCard />
            ) : (
              <View style={styles.statsGrid}>
                <Card style={styles.statBox}>
                  <Text style={styles.statNum}>{stats?.totalUsers ?? 0}</Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </Card>
                <Card style={styles.statBox}>
                  <Text style={styles.statNum}>{stats?.totalExchanges ?? 0}</Text>
                  <Text style={styles.statLabel}>Total Barters</Text>
                </Card>
                <Card style={styles.statBox}>
                  <Text style={[styles.statNum, { color: colors.secondary }]}>
                    {stats?.completedExchanges ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </Card>
                <Card style={styles.statBox}>
                  <Text style={styles.statNum}>{stats?.activeSessions ?? 0}</Text>
                  <Text style={styles.statLabel}>Active Sessions</Text>
                </Card>
                <Card style={styles.statBox}>
                  <Text style={styles.statNum}>{stats?.totalSkills ?? 0}</Text>
                  <Text style={styles.statLabel}>Total Skills</Text>
                </Card>
                <Card style={styles.statBox}>
                  <Text
                    style={[
                      styles.statNum,
                      { color: (stats?.pendingReports ?? 0) > 0 ? colors.danger : colors.textPrimary },
                    ]}
                  >
                    {stats?.pendingReports ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Pending Reports</Text>
                </Card>
              </View>
            )}
          </>
        )}

        {/* Tab 2: Reports Queue */}
        {activeTab === "reports" && (
          <>
            {reportsLoading ? (
              <SkeletonCard />
            ) : !reports || reports.length === 0 ? (
              <Card style={{ alignItems: "center", padding: spacing.xl }}>
                <Text style={{ color: colors.textPrimary, fontWeight: "bold" }}>
                  Queue Clean
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  No pending moderation reports.
                </Text>
              </Card>
            ) : (
              reports.map((rep: ReportDto) => (
                <Card key={rep.id} style={styles.reportItem}>
                  <View style={styles.reportTop}>
                    <Badge label={rep.targetType} variant="warning" />
                    <Badge label={rep.status} variant="neutral" />
                  </View>
                  <Text style={styles.reportReason}>{rep.reason}</Text>
                  <Text style={styles.reportDesc}>{rep.description}</Text>
                  <Text style={styles.reportMeta}>
                    Reporter: {rep.reporterName || rep.reporterId} • Target ID: {rep.targetId}
                  </Text>

                  {rep.status === "PENDING" && (
                    <View style={styles.reportActions}>
                      <Button
                        title="Dismiss"
                        size="sm"
                        variant="ghost"
                        onPress={() => handleResolveReport(rep.id, "none")}
                      />
                      <Button
                        title="Issue Warning"
                        size="sm"
                        variant="outline"
                        onPress={() => handleResolveReport(rep.id, "warning")}
                      />
                      <Button
                        title="Suspend Account"
                        size="sm"
                        variant="danger"
                        onPress={() => handleResolveReport(rep.id, "account_suspended")}
                      />
                    </View>
                  )}
                </Card>
              ))
            )}
          </>
        )}

        {/* Tab 3: Users Directory */}
        {activeTab === "users" && (
          <>
            {usersLoading ? (
              <SkeletonCard />
            ) : (
              (usersList || []).map((u: any) => (
                <Card key={u._id || u.id} style={styles.userItem}>
                  <View style={styles.userTop}>
                    <View>
                      <Text style={styles.userName}>{u.displayName}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                    </View>
                    <Badge
                      label={u.isSuspended ? "Suspended" : u.role}
                      variant={u.isSuspended ? "danger" : u.role === "admin" ? "primary" : "neutral"}
                    />
                  </View>
                  <View style={styles.userActions}>
                    <Button
                      title={u.isSuspended ? "Restore Account" : "Suspend Account"}
                      size="sm"
                      variant={u.isSuspended ? "secondary" : "danger"}
                      onPress={() => handleToggleSuspendUser(u._id || u.id, !!u.isSuspended)}
                    />
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {/* Tab 4: Audit Trail */}
        {activeTab === "audit" && (
          <>
            {auditLoading ? (
              <SkeletonCard />
            ) : (
              (auditLogs || []).map((log: any) => (
                <Card key={log._id || log.id} style={styles.auditItem}>
                  <Text style={styles.auditAction}>{log.action}</Text>
                  <Text style={styles.auditDetails}>
                    Target: {log.targetType} ({log.targetId})
                  </Text>
                  <Text style={styles.auditDate}>
                    {new Date(log.createdAt || log.timestamp).toLocaleString()}
                  </Text>
                </Card>
              ))
            )}
          </>
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
    backgroundColor: colors.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
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
    fontSize: 12,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  content: {
    padding: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statBox: {
    width: "48%",
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  statNum: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: typography.fontWeights.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textTransform: "uppercase",
  },
  reportItem: {
    marginBottom: spacing.sm,
  },
  reportTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  reportReason: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  reportDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    lineHeight: 18,
  },
  reportMeta: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 6,
  },
  reportActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  userItem: {
    marginBottom: spacing.xs,
  },
  userTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  userActions: {
    marginTop: spacing.sm,
    alignItems: "flex-end",
  },
  auditItem: {
    marginBottom: spacing.xs,
    padding: spacing.sm + 2,
  },
  auditAction: {
    color: colors.primary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  auditDetails: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  auditDate: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});
