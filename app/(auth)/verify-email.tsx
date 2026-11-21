import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MailCheck, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";

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
      setErrorMsg("Paste the verification link token from your email.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.auth.verifyEmail(token.trim());
      setSuccessMsg("Email verified. Taking you to profile setup…");
      await refreshUser();
      router.replace("/(onboarding)");
    } catch (err: any) {
      setErrorMsg(err.message || "This verification token is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconCircle}><MailCheck color="#8DBBFF" size={30} /></View>
          <Text style={styles.eyebrow}>ONE LAST STEP</Text>
          <Text style={styles.title}>Check your{ "\n" }inbox.</Text>
          <Text style={styles.subtitle}>
            {params.email ? "We sent a verification message to" : "Enter the verification token from your email"}
          </Text>
          {!!params.email && <Text style={styles.email}>{params.email}</Text>}
          <View style={styles.infoBox}>
            <ShieldCheck color="#83B5FF" size={17} />
            <Text style={styles.infoText}>Open the email from SkillBarter and paste its verification token below. This screen uses the existing secure email-verification API.</Text>
          </View>
          {errorMsg && <ErrorAlert message={errorMsg} />}
          {successMsg && <View style={styles.successBanner}><Text style={styles.successText}>{successMsg}</Text></View>}
          <Input label="Email verification token" placeholder="Paste token here" autoCapitalize="none" autoCorrect={false} value={token} onChangeText={setToken} helper="The current backend verifies an email token, not a numeric SMS code." />
          <Button title="Verify email" onPress={onVerify} loading={loading} size="lg" style={styles.verifyBtn} />
          <Button title="Continue to profile setup" variant="ghost" onPress={() => router.replace("/(onboarding)")} style={styles.skipBtn} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050A14" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 24 },
  card: { backgroundColor: "#101D30", borderRadius: 22, padding: 23, borderWidth: 1, borderColor: "#263B58", alignItems: "center" },
  iconCircle: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#102D55", borderWidth: 1, borderColor: "#28528A", alignItems: "center", justifyContent: "center", marginBottom: 22 },
  eyebrow: { color: "#79AEFF", fontSize: 10, letterSpacing: 2.2, fontWeight: "800", marginBottom: 10 },
  title: { color: "#FFFFFF", fontSize: 36, lineHeight: 42, fontWeight: "900", letterSpacing: -1, textAlign: "center" },
  subtitle: { color: "#A7B5CA", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 12 },
  email: { color: "#8DBBFF", fontSize: 14, fontWeight: "800", marginTop: 5, textAlign: "center" },
  infoBox: { width: "100%", flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#0C1B30", borderWidth: 1, borderColor: "#23446E", borderRadius: 13, padding: 13, marginTop: 22, marginBottom: 18 },
  infoText: { flex: 1, color: "#A7B5CA", fontSize: 11, lineHeight: 17 },
  successBanner: { width: "100%", backgroundColor: "#0E302B", borderColor: "#168B6A", borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  successText: { color: "#6EE7B7", fontSize: 12, fontWeight: "700", textAlign: "center" },
  verifyBtn: { width: "100%", marginTop: 8, backgroundColor: "#1769E8", borderRadius: 14 },
  skipBtn: { marginTop: 8 },
});
