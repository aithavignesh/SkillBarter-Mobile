import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, Phone, UserRound } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { registerSchema, RegisterFormData } from "@/utils/validators";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", phone: "", password: "" },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setErrorMsg(null);
      const res = await register(data.email, data.password, data.displayName, data.phone);
      router.push({
        pathname: "/(auth)/verify-email",
        params: res.verificationToken ? { token: res.verificationToken, email: data.email } : { email: data.email },
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. Please try again.");
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
          <Text style={styles.eyebrow}>START YOUR JOURNEY</Text>
          <Text style={styles.title}>Create your{ "\n" }SkillBarter account.</Text>
          <Text style={styles.tagline}>One community. Two-way learning. Endless possibilities.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Your details</Text>
          {errorMsg && <ErrorAlert message={errorMsg} />}
          <Controller control={control} name="displayName" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Full name" placeholder="e.g. Alex Rivers" autoCapitalize="words" autoComplete="name" textContentType="name" leftIcon={<UserRound color="#829FC5" size={18} />} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.displayName?.message} />
          )} />
          <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" leftIcon={<Mail color="#829FC5" size={18} />} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.email?.message} />
          )} />
          <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Mobile number" placeholder="+919876543210 or 9876543210" keyboardType="phone-pad" autoCapitalize="none" autoCorrect={false} leftIcon={<Phone color="#829FC5" size={18} />} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.phone?.message} helper="Use your 10-digit Indian number or an international number with country code." />
          )} />
          <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Password" placeholder="Create a strong password" secureTextEntry autoComplete="new-password" textContentType="newPassword" leftIcon={<LockKeyhole color="#829FC5" size={18} />} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.password?.message} helper="Use at least 8 characters with uppercase, lowercase and a number." />
          )} />
          <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" style={styles.submitBtn} icon={<ArrowRight color="#FFFFFF" size={18} />} />
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.push("/(auth)/login")}><Text style={styles.linkText}>Sign in</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050A14" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 20 },
  back: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, borderColor: "#263B58", alignItems: "center", justifyContent: "center", marginBottom: 22 },
  brandHeader: { alignItems: "flex-start", marginBottom: 24 },
  logoBadge: { width: 52, height: 52, borderRadius: 17, backgroundColor: "#1769E8", alignItems: "center", justifyContent: "center", marginBottom: 19 },
  logoText: { color: "#FFFFFF", fontSize: 30, fontWeight: "900" },
  eyebrow: { color: "#79AEFF", fontSize: 10, letterSpacing: 2.2, fontWeight: "800", marginBottom: 9 },
  title: { color: "#FFFFFF", fontSize: 34, lineHeight: 40, fontWeight: "900", letterSpacing: -1 },
  tagline: { color: "#9EADC2", fontSize: 13, lineHeight: 20, marginTop: 10 },
  formCard: { backgroundColor: "#101D30", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#263B58" },
  formTitle: { color: "#F5F8FF", fontSize: 16, fontWeight: "800", marginBottom: 18 },
  submitBtn: { width: "100%", backgroundColor: "#1769E8", borderRadius: 14, marginTop: 4 },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 21, gap: 6 },
  footerText: { color: "#8293AB", fontSize: 12 },
  linkText: { color: "#79AEFF", fontSize: 12, fontWeight: "800" },
});
