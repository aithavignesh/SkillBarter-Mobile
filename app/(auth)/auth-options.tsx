import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Mail, UserRoundPlus, ShieldCheck } from "lucide-react-native";

export default function AuthOptionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft color="#DCE8FA" size={21} />
        </Pressable>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
        <Text style={styles.eyebrow}>WELCOME TO SKILLBARTER</Text>
        <Text style={styles.title}>Your next skill{ "\n" }starts here.</Text>
        <Text style={styles.subtitle}>Create an account to exchange knowledge, or sign in to continue your journey.</Text>

        <View style={styles.illustration}>
          <View style={styles.orb} />
          <View style={styles.floatingCard}><UserRoundPlus color="#9CC5FF" size={22} /><Text style={styles.floatText}>Meet your community</Text></View>
          <View style={[styles.floatingCard, styles.floatRight]}><ShieldCheck color="#B9A5FF" size={22} /><Text style={styles.floatText}>Learn securely</Text></View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={() => router.push("/(auth)/signup")} accessibilityRole="button">
            <UserRoundPlus color="#061226" size={19} />
            <Text style={styles.primaryText}>Create an account</Text>
            <ArrowRight color="#061226" size={18} />
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push("/(auth)/login")} accessibilityRole="button">
            <Mail color="#A9C9F8" size={19} />
            <Text style={styles.secondaryText}>Continue with email</Text>
          </Pressable>
          <Text style={styles.footer}>Already have an account? <Text onPress={() => router.push("/(auth)/login")} style={styles.link}>Sign in</Text></Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050A14" },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 12, paddingBottom: 22 },
  back: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, borderColor: "#263B58", alignItems: "center", justifyContent: "center", marginBottom: 25 },
  brandMark: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#1769E8", alignItems: "center", justifyContent: "center", marginBottom: 22 },
  brandMarkText: { color: "#FFFFFF", fontSize: 29, fontWeight: "900" },
  eyebrow: { color: "#79AEFF", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 12 },
  title: { color: "#FFFFFF", fontSize: 37, lineHeight: 43, fontWeight: "900", letterSpacing: -1 },
  subtitle: { color: "#9EADC2", fontSize: 14, lineHeight: 22, marginTop: 12, maxWidth: 330 },
  illustration: { flex: 1, minHeight: 170, alignItems: "center", justifyContent: "center" },
  orb: { width: 150, height: 150, borderRadius: 75, backgroundColor: "#102D55", borderWidth: 1, borderColor: "#28528A" },
  floatingCard: { position: "absolute", left: 0, top: "27%", backgroundColor: "#111F33", borderWidth: 1, borderColor: "#2A4569", borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  floatRight: { left: undefined, right: 0, top: "58%" },
  floatText: { color: "#DCE8FA", fontSize: 10, fontWeight: "700" },
  actions: { gap: 12 },
  primary: { minHeight: 56, borderRadius: 15, backgroundColor: "#3B8BFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 17 },
  primaryText: { flex: 1, color: "#061226", fontSize: 14, fontWeight: "900", marginLeft: 10 },
  secondary: { minHeight: 56, borderRadius: 15, borderWidth: 1, borderColor: "#314968", backgroundColor: "#0C1728", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  secondaryText: { color: "#E5EEFC", fontSize: 14, fontWeight: "800" },
  footer: { color: "#8293AB", textAlign: "center", fontSize: 12, marginTop: 6 },
  link: { color: "#79AEFF", fontWeight: "800" },
});
