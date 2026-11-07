import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ReviewDto } from "@/types";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";
import { Avatar } from "../common/Avatar";

interface ReviewCardProps {
  review: ReviewDto;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Avatar
          name={review.reviewerName || "Reviewer"}
          url={review.reviewerAvatar}
          size={36}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.name}>{review.reviewerName || "Member"}</Text>
          <Text style={styles.stars}>{renderStars(review.rating)}</Text>
        </View>
        <Text style={styles.date}>
          {new Date(review.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
      <Text style={styles.comment}>"{review.comment}"</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  reviewerInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  stars: {
    color: colors.accent,
    fontSize: 14,
    marginTop: 1,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
  },
  comment: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
});
