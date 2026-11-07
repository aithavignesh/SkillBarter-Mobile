import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = "primary", style }: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case "primary":
        return { bg: "rgba(99, 102, 241, 0.15)", text: colors.primary };
      case "secondary":
        return { bg: "rgba(16, 185, 129, 0.15)", text: colors.secondary };
      case "warning":
        return { bg: "rgba(245, 158, 11, 0.15)", text: colors.warning };
      case "danger":
        return { bg: "rgba(239, 68, 68, 0.15)", text: colors.danger };
      case "info":
        return { bg: "rgba(59, 130, 246, 0.15)", text: colors.info };
      case "neutral":
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
});
