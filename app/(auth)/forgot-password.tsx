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
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/utils/validators";
import { api } from "@/services/api";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, typography, spacing } from "@/constants/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      setErrorMsg(null);
      const res = await api.auth.forgotPassword(data.email);
      setInfoMsg(res.message);
      if (res.resetToken) {
        setDevResetToken(res.resetToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit request.");
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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the email associated with your account and we'll send you reset instructions.
          </Text>

          {errorMsg && <ErrorAlert message={errorMsg} />}

          {infoMsg && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>{infoMsg}</Text>
              {devResetToken && (
                <View style={styles.tokenBox}>
                  <Text style={styles.tokenLabel}>Development Token:</Text>
                  <Text style={styles.tokenVal} selectable>
                    {devResetToken}
                  </Text>
                  <Button
                    title="Continue to Reset with Token"
                    size="sm"
                    style={{ marginTop: 8 }}
                    onPress={() =>
                      router.push({
                        pathname: "/(auth)/reset-password",
                        params: { token: devResetToken },
                      })
                    }
                  />
                </View>
              )}
            </View>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Button
            title="Send Reset Instructions"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="lg"
            style={styles.submitBtn}
          />

          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back to Login</Text>
          </Pressable>
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
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  infoBanner: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
  },
  tokenBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  tokenLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
  },
  tokenVal: {
    color: colors.accent,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 2,
  },
  submitBtn: {
    width: "100%",
    marginTop: spacing.sm,
  },
  backBtn: {
    alignSelf: "center",
    marginTop: spacing.lg,
  },
  backText: {
    color: colors.primary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
});
