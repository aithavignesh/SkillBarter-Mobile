import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SessionFormat } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { onboardingStore } from "@/services/onboarding/store";
import { api } from "@/services/api";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Header } from "@/components/navigation/Header";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

const SESSION_FORMATS: { format: SessionFormat; title: string; desc: string; icon: string }[] = [
  { format: "video", title: "Video Call", desc: "Interactive remote sessions over Zoom or Google Meet", icon: "📹" },
  { format: "chat", title: "Chat / Messaging", desc: "Asynchronous or direct text-based mentoring", icon: "💬" },
  { format: "in_person", title: "In Person", desc: "Meet locally at cafes, libraries, or co-working spaces", icon: "☕" },
  { format: "any", title: "Any Format", desc: "Open to video, chat, or in-person exchanges", icon: "✨" },
];

export default function OnboardingPreferencesScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const draft = onboardingStore.getDraft();

  const [preferredFormat, setPreferredFormat] = useState<SessionFormat>(
    draft.preferredSessionFormat || "video"
  );
  const [availability, setAvailability] = useState(draft.availability || "Flexible (Weekends & Evenings)");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        displayName: draft.displayName,
        bio: draft.bio,
        location: draft.location,
        preferredSessionFormat: preferredFormat,
        availability: availability.trim(),
        offeredSkills: draft.offeredSkills,
        wantedSkills: draft.wantedSkills,
      };

      const res = await api.users.completeOnboarding(payload);
      setUser(res.user);
      onboardingStore.reset();
      router.replace("/(tabs)");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Step 3 of 3" subtitle="Exchange Preferences" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg && <ErrorAlert message={errorMsg} />}

        <View style={styles.card}>
          <Text style={styles.title}>Preferred Session Format</Text>
          <Text style={styles.subtitle}>
            How would you prefer to conduct your skill barter sessions?
          </Text>

          <View style={styles.formatList}>
            {SESSION_FORMATS.map((f) => (
              <Pressable
                key={f.format}
                onPress={() => setPreferredFormat(f.format)}
                style={[
                  styles.formatItem,
                  preferredFormat === f.format && styles.formatItemActive,
                ]}
              >
                <Text style={styles.formatIcon}>{f.icon}</Text>
                <View style={styles.formatInfo}>
                  <Text
                    style={[
                      styles.formatTitle,
                      preferredFormat === f.format && styles.formatTitleActive,
                    ]}
                  >
                    {f.title}
                  </Text>
                  <Text style={styles.formatDesc}>{f.desc}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    preferredFormat === f.format && styles.radioActive,
                  ]}
                >
                  {preferredFormat === f.format && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            ))}
          </View>

          <Input
            label="General Availability"
            placeholder="e.g. Weekday evenings, Saturday mornings, Flexible"
            value={availability}
            onChangeText={setAvailability}
            helper="Helps other members know when you are generally free."
            containerStyle={{ marginTop: spacing.md }}
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Ready to Barter?</Text>
            <Text style={styles.summaryText}>
              • {draft.offeredSkills.length} skill(s) ready to teach{"\n"}
              • {draft.wantedSkills.length} skill(s) eager to learn{"\n"}
              • Name: {draft.displayName}
            </Text>
          </View>

          <Button
            title="Complete Setup & Enter SkillBarter"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
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
  formatList: {
    gap: spacing.sm,
  },
  formatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  formatItemActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  formatIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  formatInfo: {
    flex: 1,
  },
  formatTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  formatTitleActive: {
    color: colors.primary,
  },
  formatDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  summaryBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  summaryTitle: {
    color: colors.secondary,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.sm,
  },
  summaryText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    marginTop: 4,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: spacing.lg,
  },
});
