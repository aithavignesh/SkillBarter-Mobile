import React, { useState } from "react";
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
import { ExchangeCard } from "@/components/cards/ExchangeCard";
import { SkeletonCard } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function ExchangesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["exchanges", "list", selectedStatus],
    queryFn: () => api.exchanges.list(selectedStatus || undefined),
  });

  const exchanges = data?.exchanges || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skill Barter Exchanges</Text>
        <Text style={styles.subtitle}>
          Track incoming proposals, ongoing learning sessions, and completions
        </Text>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.value}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedStatus(item.value)}
              style={[
                styles.filterChip,
                selectedStatus === item.value && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedStatus === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {isError && (
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
          <ErrorAlert
            message={(error as any)?.message || "Failed to load exchanges"}
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
          data={exchanges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <ExchangeCard
              exchange={item}
              currentUserId={user?.id || ""}
              onPress={(id) => router.push(`/exchanges/${id}` as any)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No Exchanges Found"
              description={
                selectedStatus
                  ? `No exchanges with status "${selectedStatus}".`
                  : "You haven't participated in any skill exchanges yet. Discover compatible members and propose your first barter!"
              }
              actionTitle="Discover Partners"
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
    paddingBottom: spacing.sm,
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
    marginBottom: spacing.xs,
  },
  filterList: {
    marginTop: spacing.xs,
  },
  filterContent: {
    gap: spacing.xs,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  listContent: {
    padding: spacing.md,
  },
});
