import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Avatar } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Header } from "@/components/navigation/Header";
import { ReviewCard } from "@/components/cards/ReviewCard";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  const isSelf = currentUser?.id === id;

  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
    isRefetching,
  } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => api.users.getProfile(id!),
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", "user", id],
    queryFn: () => api.reviews.getUserReviews(id!),
    enabled: !!id,
  });

  const profile = profileData?.profile;
  const reviews = reviewsData?.reviews || [];

  const handleStartMessage = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await api.messages.getOrCreateConversation(profile.id);
      router.push(`/conversations/${res.conversation.id}` as any);
    } catch (err: any) {
      Alert.alert("Messaging Error", err.message || "Failed to start conversation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = () => {
    if (!profile) return;
    Alert.alert(
      "Block Member",
      `Are you sure you want to block ${profile.displayName}? You will no longer see each other in matches or be able to exchange messages.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await api.safety.blockUser(profile.id, "Blocked by user from profile");
              Alert.alert("Member Blocked", `${profile.displayName} has been blocked.`);
              router.back();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to block user.");
            }
          },
        },
      ]
    );
  };

  if (profileLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (profileError || !profile) {
    return (
      <View style={styles.container}>
        <Header title="Profile" showBack />
        <View style={{ padding: spacing.md }}>
          <ErrorAlert
            message={(profileError as any)?.message || "Profile not found or inaccessible."}
            onRetry={() => refetchProfile()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={profile.displayName}
        showBack
        rightAction={
          !isSelf ? (
            <Button
              title="Block"
              variant="ghost"
              size="sm"
              onPress={handleBlockUser}
              textStyle={{ color: colors.danger }}
            />
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetchProfile()}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Card Header */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.avatarRow}>
            <Avatar
              name={profile.displayName}
              url={profile.avatarUrl}
              size={72}
            />
            <View style={styles.mainInfo}>
              <Text style={styles.displayName}>{profile.displayName}</Text>
              {profile.location ? (
                <Text style={styles.location}>📍 {profile.location}</Text>
              ) : null}
              <View style={styles.statsRow}>
                <Badge
                  label={`Reputation: ${profile.reputationScore}`}
                  variant="primary"
                  style={{ marginRight: 6 }}
                />
                <Badge
                  label={`${profile.completedExchangesCount} completed`}
                  variant="secondary"
                />
              </View>
            </View>
          </View>

          {profile.bio ? (
            <Text style={styles.bioText}>{profile.bio}</Text>
          ) : null}

          <View style={styles.prefGrid}>
            <View style={styles.prefItem}>
              <Text style={styles.prefLabel}>Session Format</Text>
              <Text style={styles.prefVal}>
                {profile.preferredSessionFormat.toUpperCase()}
              </Text>
            </View>
            <View style={styles.prefItem}>
              <Text style={styles.prefLabel}>Availability</Text>
              <Text style={styles.prefVal}>{profile.availability || "Flexible"}</Text>
            </View>
          </View>

          {!isSelf && (
            <View style={styles.actionRow}>
              <Button
                title="Send Message"
                variant="outline"
                size="md"
                style={{ flex: 1 }}
                loading={actionLoading}
                onPress={handleStartMessage}
              />
              <Button
                title="Propose Barter"
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                onPress={() =>
                  router.push({
                    pathname: "/exchanges/new",
                    params: {
                      recipientId: profile.id,
                      recipientName: profile.displayName,
                    },
                  })
                }
              />
            </View>
          )}
        </Card>

        {/* Skills Offered */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Skills Offered ({profile.offeredSkills.length})
          </Text>
          {profile.offeredSkills.map((s) => (
            <Card key={s.id} style={styles.skillCard}>
              <View style={styles.skillTop}>
                <Text style={styles.skillName}>{s.name}</Text>
                <Badge label={s.proficiency} variant="secondary" />
              </View>
              <Text style={styles.skillCategory}>{s.category}</Text>
              {s.description ? (
                <Text style={styles.skillDesc}>{s.description}</Text>
              ) : null}
            </Card>
          ))}
        </View>

        {/* Skills Wanted */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Skills Wanted ({profile.wantedSkills.length})
          </Text>
          {profile.wantedSkills.map((s) => (
            <Card key={s.id} style={styles.skillCard}>
              <View style={styles.skillTop}>
                <Text style={styles.skillName}>{s.name}</Text>
                <Badge label={s.proficiency} variant="primary" />
              </View>
              <Text style={styles.skillCategory}>{s.category}</Text>
              {s.description ? (
                <Text style={styles.skillDesc}>{s.description}</Text>
              ) : null}
            </Card>
          ))}
        </View>

        {/* Member Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Card style={{ alignItems: "center", padding: spacing.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                No barter reviews submitted for this member yet.
              </Text>
            </Card>
          ) : (
            reviews.map((rev) => <ReviewCard key={rev.id} review={rev} />)
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
  content: {
    padding: spacing.md,
  },
  profileHeaderCard: {
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
  location: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  bioText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  prefGrid: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  prefItem: {
    flex: 1,
  },
  prefLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
  },
  prefVal: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  skillCard: {
    marginBottom: spacing.xs,
    padding: spacing.sm + 2,
  },
  skillTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skillName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  skillCategory: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  skillDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
