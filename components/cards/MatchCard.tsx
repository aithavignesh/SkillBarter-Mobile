import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MatchResult } from "@/types";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";
import { Avatar } from "../common/Avatar";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";

interface MatchCardProps {
  match: MatchResult;
  onViewProfile: (userId: string) => void;
  onProposeExchange: (match: MatchResult) => void;
}

export function MatchCard({
  match,
  onViewProfile,
  onProposeExchange,
}: MatchCardProps) {
  const { user, compatibilityScore, explanation, reciprocalMatch, theyTeachYouLearn, youTeachTheyLearn } = match;

  return (
    <View style={styles.card}>
      <Pressable onPress={() => onViewProfile(user.id)} style={styles.header}>
        <Avatar name={user.displayName} url={user.avatarUrl} size={48} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.displayName}</Text>
            <View
              style={[
                styles.scoreBadge,
                compatibilityScore >= 90
                  ? styles.scoreHigh
                  : compatibilityScore >= 70
                  ? styles.scoreMedium
                  : styles.scoreLow,
              ]}
            >
              <Text style={styles.scoreText}>{compatibilityScore}% Match</Text>
            </View>
          </View>
          <Text style={styles.meta}>
            {user.location ? `${user.location} • ` : ""}Rep: {user.reputationScore}
          </Text>
        </View>
      </Pressable>

      <Text style={styles.explanation}>{explanation}</Text>

      {/* Skills Overlap */}
      <View style={styles.skillsSection}>
        {theyTeachYouLearn.length > 0 && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Teaches you:</Text>
            <View style={styles.badgeRow}>
              {theyTeachYouLearn.map((s, idx) => (
                <Badge
                  key={idx}
                  label={`${s.name} (${s.proficiency})`}
                  variant="secondary"
                  style={styles.skillBadge}
                />
              ))}
            </View>
          </View>
        )}

        {youTeachTheyLearn.length > 0 && (
          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>Wants from you:</Text>
            <View style={styles.badgeRow}>
              {youTeachTheyLearn.map((s, idx) => (
                <Badge
                  key={idx}
                  label={`${s.name} (${s.proficiency})`}
                  variant="primary"
                  style={styles.skillBadge}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title="View Profile"
          variant="outline"
          size="sm"
          style={styles.actionBtn}
          onPress={() => onViewProfile(user.id)}
        />
        <Button
          title={reciprocalMatch ? "Barter Skills" : "Propose Exchange"}
          variant="primary"
          size="sm"
          style={styles.actionBtn}
          onPress={() => onProposeExchange(match)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  scoreHigh: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  scoreMedium: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  scoreLow: {
    backgroundColor: "rgba(148, 163, 184, 0.2)",
  },
  scoreText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  explanation: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginVertical: spacing.sm,
  },
  skillsSection: {
    marginVertical: spacing.xs,
  },
  skillRow: {
    marginBottom: spacing.xs,
  },
  skillLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillBadge: {
    marginRight: 6,
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  actionBtn: {
    flex: 1,
  },
});
