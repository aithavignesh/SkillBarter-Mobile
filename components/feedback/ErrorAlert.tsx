import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Error</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.danger,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.sm,
    marginBottom: 2,
  },
  message: {
    color: "#FCA5A5",
    fontSize: typography.fontSizes.xs,
  },
  retryButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
});
