import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, LoginFormData } from "@/utils/validators";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMsg(null);
      await login(data.email, data.password);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please verify your credentials.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft color="#DCE8FA" size={21} />
        </Pressable>
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}><Text style={styles.logoText}>S</Text></View>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.title}>Sign in to{ "\n" }SkillBarter.</Text>
          <Text style={styles.tagline}>Pick up where your next skill exchange begins.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Your account</Text>
          {errorMsg && <ErrorAlert message={errorMsg} />}
          <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" leftIcon={<Mail color="#829FC5" size={18} />} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.email?.message} />
          )} />
          <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Password" placeholder="Enter your password" secureTextEntry autoComplete="password" textContentType="password" leftIcon={<LockKeyhole color="#829FC5" size={18} />} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.password?.message} />
          )} />
          <Pressable onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgotBtn} accessibilityRole="button">
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
          <Button title="Sign In" onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" style={styles.submitBtn} icon={<ArrowRight color="#FFFFFF" size={18} />} />
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to SkillBarter?</Text>
            <Pressable onPress={() => router.push("/(auth)/signup")}><Text style={styles.linkText}>Create account</Text></Pressable>
          </View>
        </View>
        <View style={styles.secureNote}><Sparkles color="#78ABF4" size={13} /><Text style={styles.secureText}>Your skills. Your community. Your growth.</Text></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050A14" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 20 },
  back: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, borderColor: "#263B58", alignItems: "center", justifyContent: "center", marginBottom: 23 },
  brandHeader: { alignItems: "flex-start", marginBottom: 26 },
  logoBadge: { width: 52, height: 52, borderRadius: 17, backgroundColor: "#1769E8", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  logoText: { color: "#FFFFFF", fontSize: 30, fontWeight: "900" },
  eyebrow: { color: "#79AEFF", fontSize: 10, letterSpacing: 2.2, fontWeight: "800", marginBottom: 9 },
  title: { color: "#FFFFFF", fontSize: 36, lineHeight: 42, fontWeight: "900", letterSpacing: -1 },
  tagline: { color: "#9EADC2", fontSize: 13, lineHeight: 20, marginTop: 10 },
  formCard: { backgroundColor: "#101D30", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#263B58" },
  formTitle: { color: "#F5F8FF", fontSize: 16, fontWeight: "800", marginBottom: 18 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 17, marginTop: -4 },
  forgotText: { color: "#79AEFF", fontSize: 12, fontWeight: "700" },
  submitBtn: { width: "100%", backgroundColor: "#1769E8", borderRadius: 14 },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 21, gap: 6 },
  footerText: { color: "#8293AB", fontSize: 12 },
  linkText: { color: "#79AEFF", fontSize: 12, fontWeight: "800" },
  secureNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 20 },
  secureText: { color: "#71839D", fontSize: 10 },
});
