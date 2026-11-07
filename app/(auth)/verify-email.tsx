import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, typography, spacing } from "@/constants/theme";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const { refreshUser } = useAuth();

  const [token, setToken] = useState(params.token || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const onVerify = async () => {
    if (!token.trim()) {
      setErrorMsg("Please enter the verification token");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.auth.verifyEmail(token.trim());
      setSuccessMsg("Email successfully verified! Proceeding to onboarding...");
      await refreshUser();
      setTimeout(() => {
        router.replace("/(onboarding)");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired verification token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✉</Text>
          </View>

          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            {params.email
              ? `We sent a verification code to ${params.email}`
              : "Enter the verification code sent to your email"}
          </Text>

          {errorMsg && <ErrorAlert message={errorMsg} />}

          {successMsg && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          <Input
            label="Verification Token"
            placeholder="Paste verification token here"
            autoCapitalize="none"
            autoCorrect={false}
            value={token}
            onChangeText={setToken}
            helper="In development mode, token was automatically provided."
          />

          <Button
            title="Verify Email"
            onPress={onVerify}
            loading={loading}
            size="lg"
            style={styles.verifyBtn}
          />

          <Button
            title="Skip for Now"
            variant="ghost"
            onPress={() => router.replace("/(onboarding)")}
            style={styles.skipBtn}
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  successBanner: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    width: "100%",
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.secondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    textAlign: "center",
  },
  verifyBtn: {
    width: "100%",
    marginTop: spacing.md,
  },
  skipBtn: {
    marginTop: spacing.sm,
  },
});
