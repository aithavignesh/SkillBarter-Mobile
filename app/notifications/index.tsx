import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { NotificationDto } from "@/types";
import { Header } from "@/components/navigation/Header";
import { Button } from "@/components/common/Button";
import { SkeletonCard } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => api.notifications.list(),
  });

  const handleMarkRead = async (item: NotificationDto) => {
    if (!item.read) {
      await api.notifications.markRead(item.id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (item.link) {
      if (item.link.startsWith("/exchanges/")) {
        router.push(item.link as any);
      } else if (item.link.startsWith("/messages")) {
        router.push("/(tabs)/messages");
      }
    }
  };

  const handleMarkAllRead = async () => {
    await api.notifications.markAllRead().catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const getNotifIcon = (type: string) => {
    if (type.includes("EXCHANGE")) return "⇄";
    if (type.includes("SESSION")) return "📅";
    if (type.includes("MESSAGE")) return "💬";
    if (type.includes("REVIEW")) return "★";
    if (type.includes("CONNECTION")) return "👥";
    return "🔔";
  };

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        showBack
        rightAction={
          <Button
            title="Mark all read"
            variant="ghost"
            size="sm"
            onPress={handleMarkAllRead}
          />
        }
      />

      {isError && (
        <View style={{ padding: spacing.md }}>
          <ErrorAlert
            message={(error as any)?.message || "Failed to load notifications"}
            onRetry={() => refetch()}
          />
        </View>
      )}

      {isLoading ? (
        <View style={{ padding: spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={notifications || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }: { item: NotificationDto }) => (
            <Pressable
              onPress={() => handleMarkRead(item)}
              style={({ pressed }) => [
                styles.itemCard,
                !item.read && styles.itemCardUnread,
                pressed && styles.itemCardPressed,
              ]}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>{getNotifIcon(item.type)}</Text>
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemTop}>
                  <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemDate}>
                    {new Date(item.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <Text style={styles.itemMessage}>{item.message}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No Notifications"
              description="You're all caught up! Updates regarding your exchanges, sessions, and messages will appear here."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  itemCardUnread: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderColor: colors.primary,
  },
  itemCardPressed: {
    backgroundColor: colors.cardHoverDark,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
  },
  itemContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  itemTitleUnread: {
    fontWeight: typography.fontWeights.bold,
    color: "#FFFFFF",
  },
  itemDate: {
    color: colors.textMuted,
    fontSize: 10,
  },
  itemMessage: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});
