import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { SkeletonCard } from "@/components/common/Skeleton";
import { MatchCard } from "@/components/cards/MatchCard";
import { ExchangeCard } from "@/components/cards/ExchangeCard";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Recommended Matches
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ["dashboard", "matches"],
    queryFn: () => api.matches.discover({ limit: 3 }),
  });

  // Fetch User's Exchanges
  const { data: exchangesData, isLoading: exchangesLoading } = useQuery({
    queryKey: ["dashboard", "exchanges"],
    queryFn: () => api.exchanges.list(),
  });

  // Fetch Unread Notifications Count
  const { data: notifData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.notifications.unreadCount(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
    setRefreshing(false);
  };

  const pendingExchanges = (exchangesData?.exchanges || []).filter(
    (e) => e.status === "PENDING"
  );
  const activeExchanges = (exchangesData?.exchanges || []).filter((e) =>
    ["ACCEPTED", "SCHEDULED", "IN_PROGRESS"].includes(e.status)
  );

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.welcomeSub}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{user?.displayName || "Member"}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/notifications")}
          style={styles.notifBtn}
        >
          <Text style={styles.notifIcon}>🔔</Text>
          {notifData && notifData.unreadCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{notifData.unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Completion / Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Reputation Score: {user?.reputationScore ?? 100}</Text>
              <Text style={styles.statusDesc}>
                {user?.completedExchangesCount ?? 0} exchange(s) successfully completed
              </Text>
            </View>
            <Badge
              label={user?.isEmailVerified ? "Verified Member" : "Email Unverified"}
              variant={user?.isEmailVerified ? "secondary" : "warning"}
            />
          </View>
          <View style={styles.quickActionRow}>
            <Button
              title="Explore Matches"
              size="sm"
              variant="primary"
              style={{ flex: 1 }}
              onPress={() => router.push("/(tabs)/discover")}
            />
            <Button
              title="Community"
              size="sm"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => router.push("/community")}
            />
          </View>
        </Card>

        {/* Pending Exchange Requests (if any) */}
        {pendingExchanges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>
                Pending Exchanges ({pendingExchanges.length})
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/exchanges")}>
                <Text style={styles.viewAllText}>View All ›</Text>
              </Pressable>
            </View>
            {pendingExchanges.slice(0, 2).map((exchange) => (
              <ExchangeCard
                key={exchange.id}
                exchange={exchange}
                currentUserId={user?.id || ""}
                onPress={(id) => router.push(`/exchanges/${id}` as any)}
              />
            ))}
          </View>
        )}

        {/* Active Exchanges */}
        {activeExchanges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>
                Active Barters ({activeExchanges.length})
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/exchanges")}>
                <Text style={styles.viewAllText}>View All ›</Text>
              </Pressable>
            </View>
            {activeExchanges.slice(0, 2).map((exchange) => (
              <ExchangeCard
                key={exchange.id}
                exchange={exchange}
                currentUserId={user?.id || ""}
                onPress={(id) => router.push(`/exchanges/${id}` as any)}
              />
            ))}
          </View>
        )}

        {/* Recommended Matches Engine */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            <Pressable onPress={() => router.push("/(tabs)/discover")}>
              <Text style={styles.viewAllText}>Explore All ›</Text>
            </Pressable>
          </View>

          {matchesLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : !matchesData || matchesData.matches.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Looking for compatible matches...</Text>
              <Text style={styles.emptyDesc}>
                Add more offered or wanted skills to boost your reciprocal barter matches!
              </Text>
              <Button
                title="Manage My Skills"
                size="sm"
                variant="outline"
                style={{ marginTop: 12 }}
                onPress={() => router.push("/(tabs)/profile")}
              />
            </Card>
          ) : (
            matchesData.matches.map((match) => (
              <MatchCard
                key={match.user.id}
                match={match}
                onViewProfile={(uid) => router.push(`/profiles/${uid}` as any)}
                onProposeExchange={(m) =>
                  router.push({
                    pathname: "/exchanges/new",
                    params: {
                      recipientId: m.user.id,
                      recipientName: m.user.displayName,
                    },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  welcomeSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
  },
  welcomeName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderDark,
    position: "relative",
  },
  notifIcon: {
    fontSize: 20,
  },
  badgeCount: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: spacing.md,
  },
  statusCard: {
    marginBottom: spacing.md,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  statusDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  emptyCard: {
    alignItems: "center",
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  emptyDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    textAlign: "center",
    marginTop: 4,
  },
});
