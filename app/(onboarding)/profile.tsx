import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { onboardingStore } from "@/services/onboarding/store";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Header } from "@/components/navigation/Header";
import { colors, typography, spacing } from "@/constants/theme";

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const draft = onboardingStore.getDraft();

  const [displayName, setDisplayName] = useState(
    draft.displayName || user?.displayName || ""
  );
  const [bio, setBio] = useState(draft.bio || "");
  const [location, setLocation] = useState(draft.location || "");
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      setError("Please provide a name with at least 2 characters");
      return;
    }
    setError(null);
    onboardingStore.updateDraft({
      displayName: displayName.trim(),
      bio: bio.trim(),
      location: location.trim(),
    });
    router.push("/(onboarding)/skills");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Header title="Step 1 of 3" subtitle="Basic Profile" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This information will be displayed on your barter profile.
          </Text>

          <Input
            label="Display Name *"
            placeholder="e.g. Alex Rivers"
            value={displayName}
            onChangeText={setDisplayName}
            error={error || undefined}
          />

          <Input
            label="Location (City, Country)"
            placeholder="e.g. San Francisco, CA"
            value={location}
            onChangeText={setLocation}
            helper="Optional. Helps match with members in compatible time zones."
          />

          <Input
            label="Bio & Background"
            placeholder="Briefly introduce your background, interests, and what you're excited to trade..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            helper="Max 1,000 characters."
          />

          <Button
            title="Next: Skills Setup →"
            onPress={handleNext}
            size="lg"
            style={styles.nextBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  nextBtn: {
    marginTop: spacing.md,
  },
});
