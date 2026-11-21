import React from "react";
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, BookOpen, Code2, Palette, Sparkles } from "lucide-react-native";
import { colors, spacing, typography } from "@/constants/theme";

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 380;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topLine}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
          <Text style={styles.brandName}>SKILLBARTER</Text>
          <View style={styles.topPill}><Sparkles color="#8DB5FF" size={13} /><Text style={styles.topPillText}>LEARN • SHARE</Text></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.glowOne} />
          <View style={styles.glowTwo} />
          <Text style={[styles.eyebrow, compact && styles.eyebrowCompact]}>YOUR KNOWLEDGE HAS VALUE</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>Trade skills.{ "\n" }Grow together.</Text>
          <Text style={styles.subtitle}>Share what you know. Learn what you love. Build meaningful connections without money getting in the way.</Text>

          <View style={styles.artboard} accessibilityLabel="Illustration of people exchanging skills">
            <View style={styles.artHalo} />
            <View style={styles.orbit} />
            <View style={[styles.skillCard, styles.cardTop]}>
              <View style={[styles.iconTile, { backgroundColor: "#173D77" }]}><Code2 color="#8FC0FF" size={20} /></View>
              <View style={styles.skillText}><Text style={styles.skillName}>Development</Text><Text style={styles.skillMeta}>I can teach</Text></View>
              <Text style={styles.cardArrow}>↗</Text>
            </View>
            <View style={[styles.skillCard, styles.cardBottom]}>
              <View style={[styles.iconTile, { backgroundColor: "#392B70" }]}><Palette color="#C5AEFF" size={20} /></View>
              <View style={styles.skillText}><Text style={styles.skillName}>UI Design</Text><Text style={styles.skillMeta}>I want to learn</Text></View>
              <Text style={styles.cardArrow}>↗</Text>
            </View>
            <View style={styles.centerBadge}><BookOpen color="#FFFFFF" size={25} /><Text style={styles.centerBadgeText}>SKILL{ "\n" }SWAP</Text></View>
            <View style={styles.sparkleA}><Sparkles color="#8DB5FF" size={17} /></View>
            <View style={styles.sparkleB}><Sparkles color="#B59AFF" size={13} /></View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.pagination}><View style={styles.activeDot} /><View style={styles.dot} /><View style={styles.dot} /></View>
          <Text style={styles.footerHint}>A community built on sharing knowledge</Text>
          <View style={styles.cta}>
            <Text onPress={() => router.push("/(auth)/auth-options")} style={styles.ctaText} accessibilityRole="button">Get Started</Text>
            <ArrowRight color="#061226" size={20} />
          </View>
          <Text style={styles.legal}>By continuing, you agree to our Terms of Service and Privacy Policy.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#050A14" },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 18 },
  topLine: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#1769E8", alignItems: "center", justifyContent: "center" },
  brandMarkText: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  brandName: { color: "#F5F8FF", fontSize: 12, letterSpacing: 2.1, fontWeight: "800" },
  topPill: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "#233A5C", backgroundColor: "#0D192B", paddingHorizontal: 9, paddingVertical: 7, borderRadius: 20 },
  topPillText: { color: "#9DBBEB", fontSize: 8, letterSpacing: 1, fontWeight: "800" },
  hero: { flex: 1, justifyContent: "center", paddingTop: 32 },
  glowOne: { position: "absolute", width: 240, height: 240, borderRadius: 120, backgroundColor: "#0B3674", opacity: 0.22, top: 110, left: 10 },
  glowTwo: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "#432477", opacity: 0.18, bottom: 25, right: 0 },
  eyebrow: { color: "#76A9FF", fontSize: 10, letterSpacing: 2.2, fontWeight: "800", marginBottom: 13 },
  eyebrowCompact: { fontSize: 9 },
  title: { color: "#FFFFFF", fontSize: 43, lineHeight: 49, fontWeight: "900", letterSpacing: -1.6 },
  titleCompact: { fontSize: 37, lineHeight: 43 },
  subtitle: { color: "#A7B5CA", fontSize: 14, lineHeight: 22, marginTop: 13, maxWidth: 330 },
  artboard: { height: 255, marginTop: 20, alignItems: "center", justifyContent: "center" },
  artHalo: { position: "absolute", width: 210, height: 210, borderRadius: 105, backgroundColor: "#123B79", opacity: 0.32 },
  orbit: { position: "absolute", width: 245, height: 165, borderRadius: 100, borderWidth: 1, borderColor: "#244B82", transform: [{ rotate: "-18deg" }] },
  skillCard: { position: "absolute", width: "78%", minHeight: 66, borderRadius: 16, backgroundColor: "#101D30", borderColor: "#294365", borderWidth: 1, flexDirection: "row", alignItems: "center", padding: 12, gap: 11, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 14, elevation: 7 },
  cardTop: { top: 28, left: 4, transform: [{ rotate: "-5deg" }] },
  cardBottom: { bottom: 24, right: 2, transform: [{ rotate: "5deg" }] },
  iconTile: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  skillText: { flex: 1 },
  skillName: { color: "#F5F8FF", fontWeight: "800", fontSize: 13 },
  skillMeta: { color: "#8FA2BE", fontSize: 10, marginTop: 3 },
  cardArrow: { color: "#8CB9FF", fontSize: 21, fontWeight: "700" },
  centerBadge: { width: 86, height: 86, borderRadius: 28, backgroundColor: "#1769E8", borderWidth: 5, borderColor: "#0A1C35", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }], shadowColor: "#1672FF", shadowOpacity: 0.5, shadowRadius: 18, elevation: 10 },
  centerBadgeText: { color: "#FFFFFF", fontSize: 8, lineHeight: 10, fontWeight: "900", letterSpacing: 1, textAlign: "center", marginTop: 3 },
  sparkleA: { position: "absolute", top: 20, right: 40 },
  sparkleB: { position: "absolute", bottom: 22, left: 45 },
  footer: { alignItems: "center", paddingTop: 8 },
  pagination: { flexDirection: "row", gap: 7, marginBottom: 12 },
  activeDot: { width: 22, height: 6, borderRadius: 3, backgroundColor: "#3986FF" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34445C" },
  footerHint: { color: "#8293AB", fontSize: 11, marginBottom: 15 },
  cta: { width: "100%", minHeight: 54, borderRadius: 15, backgroundColor: "#3B8BFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  ctaText: { color: "#061226", fontSize: 15, fontWeight: "900" },
  legal: { color: "#61718A", fontSize: 9, textAlign: "center", lineHeight: 14, marginTop: 12, maxWidth: 280 },
});
