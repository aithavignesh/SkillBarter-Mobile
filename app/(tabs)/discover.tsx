import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Input } from "@/components/common/Input";
import { MatchCard } from "@/components/cards/MatchCard";
import { SkeletonCard } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

const CATEGORIES = [
  "All",
  "Software Development",
  "Languages",
  "Design & Creative",
  "Business & Marketing",
  "Music & Audio",
  "Academics & Science",
  "Health & Fitness",
  "Cooking & Culinary",
];

const FORMATS = [
  { label: "All Formats", value: "" },
  { label: "📹 Video", value: "video" },
  { label: "💬 Chat", value: "chat" },
  { label: "☕ In-Person", value: "in_person" },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFormat, setSelectedFormat] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      "matches",
      "discover",
      search,
      selectedCategory,
      selectedFormat,
    ],
    queryFn: () =>
      api.matches.discover({
        search: search.trim() || undefined,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        format: selectedFormat || undefined,
        limit: 20,
      }),
  });

  const matches = data?.matches || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover & Match</Text>
        <Text style={styles.subtitle}>
          Find barter partners with complementary skills
        </Text>

        <Input
          placeholder="Search by skill name, user, or topic..."
          value={search}
          onChangeText={setSearch}
          containerStyle={{ marginTop: spacing.md, marginBottom: spacing.xs }}
        />

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Format Selector */}
        <View style={styles.formatRow}>
          {FORMATS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setSelectedFormat(f.value)}
              style={[
                styles.formatBtn,
                selectedFormat === f.value && styles.formatBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.formatBtnText,
                  selectedFormat === f.value && styles.formatBtnTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isError && (
        <View style={{ paddingHorizontal: spacing.md }}>
          <ErrorAlert
            message={(error as any)?.message || "Failed to load matches"}
            onRetry={() => refetch()}
          />
        </View>
      )}

      {isLoading ? (
        <View style={{ padding: spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <MatchCard
              match={item}
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
          )}
          ListEmptyComponent={
            <EmptyState
              title="No Complementary Matches"
              description="No members found matching your exact filter criteria. Try adjusting your search or selecting 'All' categories."
              actionTitle="Reset Filters"
              onAction={() => {
                setSearch("");
                setSelectedCategory("All");
                setSelectedFormat("");
              }}
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
    paddingBottom: spacing.xs,
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
  filterScroll: {
    marginVertical: spacing.xs,
  },
  filterScrollContent: {
    paddingVertical: 4,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  formatRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.cardDark,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  formatBtnActive: {
    borderColor: colors.secondary,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  formatBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  formatBtnTextActive: {
    color: colors.secondary,
    fontWeight: "bold",
  },
  listContent: {
    padding: spacing.md,
  },
});
