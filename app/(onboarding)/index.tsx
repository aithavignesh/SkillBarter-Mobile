import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/common/Button";
import { colors, typography, spacing } from "@/constants/theme";

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Welcome</Text>
          </View>
          <Text style={styles.title}>
            Welcome, {user?.displayName || "Skill Barterer"}!
          </Text>
          <Text style={styles.subtitle}>
            Let's set up your profile in 3 simple steps so you can start trading skills with members around the world.
          </Text>
        </View>

        <View style={styles.stepsCard}>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Your Profile</Text>
              <Text style={styles.stepDesc}>Tell others about yourself, your location, and background.</Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Skills Offered & Wanted</Text>
              <Text style={styles.stepDesc}>What can you teach? What would you love to learn?</Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Exchange Preferences</Text>
              <Text style={styles.stepDesc}>Choose video, chat, or in-person sessions and your availability.</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Start Profile Setup"
            size="lg"
            onPress={() => router.push("/(onboarding)/profile")}
          />
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
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  badge: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    marginBottom: spacing.md,
  },
  badgeText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    textTransform: "uppercase",
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
    maxWidth: 320,
  },
  stepsCard: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: spacing.xl,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    color: "#FFFFFF",
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  stepInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
  },
  stepDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    lineHeight: 18,
  },
  stepDivider: {
    height: 1,
    backgroundColor: colors.borderDark,
    marginVertical: spacing.md,
    marginLeft: 52,
  },
  actions: {
    width: "100%",
  },
});
