import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { colors, typography, spacing } from "@/constants/theme";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
}

export function LoadingSpinner({
  message = "Loading...",
  size = "large",
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.md,
  },
});
