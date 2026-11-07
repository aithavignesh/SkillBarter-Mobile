import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Header } from "@/components/navigation/Header";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function NewExchangeScreen() {
  const router = useRouter();
  const { recipientId, recipientName } = useLocalSearchParams<{
    recipientId: string;
    recipientName?: string;
  }>();

  // Fetch current user's skills
  const { data: mySkillsData, isLoading: mySkillsLoading } = useQuery({
    queryKey: ["skills", "my"],
    queryFn: () => api.skills.getMySkills(),
  });

  // Fetch recipient's public profile to get their offered skills
  const { data: recipientData, isLoading: recipientLoading } = useQuery({
    queryKey: ["profile", recipientId],
    queryFn: () => api.users.getProfile(recipientId!),
    enabled: !!recipientId,
  });

  const [selectedOfferedSkillId, setSelectedOfferedSkillId] = useState<string>("");
  const [selectedWantedSkillId, setSelectedWantedSkillId] = useState<string>("");
  const [proposal, setProposal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const myOffered = (mySkillsData?.skills || []).filter((s) => s.type === "offered");
  const theirOffered = recipientData?.profile?.offeredSkills || [];

  // Auto-select if options exist
  React.useEffect(() => {
    if (myOffered.length > 0 && !selectedOfferedSkillId) {
      setSelectedOfferedSkillId(myOffered[0].skillId || myOffered[0].id);
    }
  }, [myOffered, selectedOfferedSkillId]);

  React.useEffect(() => {
    if (theirOffered.length > 0 && !selectedWantedSkillId) {
      setSelectedWantedSkillId(theirOffered[0].skillId || theirOffered[0].id);
    }
  }, [theirOffered, selectedWantedSkillId]);

  const handleSubmit = async () => {
    if (!selectedOfferedSkillId) {
      setErrorMsg("Please select a skill you will offer");
      return;
    }
    if (!selectedWantedSkillId) {
      setErrorMsg("Please select a skill you want to learn from this member");
      return;
    }
    if (proposal.trim().length < 10) {
      setErrorMsg("Please explain your barter proposal in at least 10 characters");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.exchanges.create({
        recipientId: recipientId!,
        offeredSkillId: selectedOfferedSkillId,
        wantedSkillId: selectedWantedSkillId,
        proposalDescription: proposal.trim(),
      });
      router.replace(`/exchanges/${res.exchange.id}` as any);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit exchange proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  if (mySkillsLoading || recipientLoading) {
    return <LoadingSpinner message="Preparing exchange options..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Header
        title="Propose Exchange"
        subtitle={`Trading with ${recipientName || "Member"}`}
        showBack
      />

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg && <ErrorAlert message={errorMsg} />}

        {/* 1. Skill Offered */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>1. Skill You Are Offering</Text>
          <Text style={styles.cardSub}>
            Select which of your skills you will teach in return.
          </Text>

          {myOffered.length === 0 ? (
            <View style={styles.emptySkillsBox}>
              <Text style={styles.emptySkillsText}>
                You have not added any offered skills yet.
              </Text>
              <Button
                title="Add Skills to Profile"
                size="sm"
                variant="outline"
                onPress={() => router.push("/(tabs)/profile")}
              />
            </View>
          ) : (
            <View style={styles.chipGrid}>
              {myOffered.map((s) => {
                const sId = s.skillId || s.id;
                const isSelected = selectedOfferedSkillId === sId;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSelectedOfferedSkillId(sId)}
                    style={[styles.skillChip, isSelected && styles.skillChipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {s.name} ({s.proficiency})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>

        {/* 2. Skill Wanted */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>2. Skill You Want to Learn</Text>
          <Text style={styles.cardSub}>
            Select a skill offered by {recipientName || "this member"}.
          </Text>

          {theirOffered.length === 0 ? (
            <Text style={styles.emptySkillsText}>
              This member has not listed specific offered skills.
            </Text>
          ) : (
            <View style={styles.chipGrid}>
              {theirOffered.map((s) => {
                const sId = s.skillId || s.id;
                const isSelected = selectedWantedSkillId === sId;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSelectedWantedSkillId(sId)}
                    style={[styles.skillChip, isSelected && styles.skillChipActiveSecondary]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {s.name} ({s.proficiency})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>

        {/* 3. Proposal Details */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>3. Barter Proposal</Text>
          <Text style={styles.cardSub}>
            Explain what you hope to achieve, your preferred meeting times, or format.
          </Text>

          <Input
            placeholder="e.g. Hi! I'd love to help you with React Native architecture in exchange for Spanish conversation sessions on weekends..."
            value={proposal}
            onChangeText={setProposal}
            multiline
            numberOfLines={4}
            helper="Minimum 10 characters."
          />
        </Card>

        <Button
          title="Send Barter Request"
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          style={styles.submitBtn}
        />
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
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  cardSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  emptySkillsBox: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  emptySkillsText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.sm,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  skillChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  skillChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skillChipActiveSecondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  submitBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
