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
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Avatar } from "@/components/common/Avatar";
import { SkeletonCard } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function MessagesListScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.messages.listConversations(),
    refetchInterval: 8000, // Poll every 8 seconds for new messages
  });

  const conversations = data?.conversations || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Direct conversations with barter partners</Text>
      </View>

      {isError && (
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
          <ErrorAlert
            message={(error as any)?.message || "Failed to load conversations"}
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
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const partner = item.participants.find((p) => p.id !== user?.id) || {
              id: "peer",
              displayName: "Member",
              avatarUrl: "",
            };

            return (
              <Pressable
                onPress={() => router.push(`/conversations/${item.id}` as any)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <Avatar
                  name={partner.displayName}
                  url={partner.avatarUrl}
                  size={50}
                />
                <View style={styles.cardInfo}>
                  <View style={styles.topRow}>
                    <Text style={styles.name}>{partner.displayName}</Text>
                    {item.lastMessage?.createdAt && (
                      <Text style={styles.timeText}>
                        {new Date(item.lastMessage.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    )}
                  </View>
                  <View style={styles.msgRow}>
                    <Text
                      style={[
                        styles.lastMsg,
                        item.unreadCount > 0 && styles.lastMsgUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {item.lastMessage?.content || "No messages yet"}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="No Conversations Yet"
              description="When you initiate an exchange or message another barter partner, your message threads will appear here."
              actionTitle="Discover Members"
              onAction={() => router.push("/(tabs)/discover")}
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
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  cardPressed: {
    backgroundColor: colors.cardHoverDark,
  },
  cardInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
  },
  msgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  lastMsg: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  lastMsgUnread: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.bold,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});
