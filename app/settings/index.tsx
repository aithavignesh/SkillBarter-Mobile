import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Header } from "@/components/navigation/Header";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  const [isPublic, setIsPublic] = useState(true);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  // Change Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePrivacyToggle = async (val: boolean) => {
    setIsPublic(val);
    setUpdatingPrivacy(true);
    try {
      await api.users.updateProfile({ isProfilePublic: val });
      await refreshUser();
    } catch {
      setIsPublic(!val);
      Alert.alert("Error", "Failed to update profile visibility.");
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }
    setPasswordLoading(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Success", "Password updated successfully!");
    } catch (err: any) {
      Alert.alert("Password Error", err.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of SkillBarter?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Details */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email Verified</Text>
            <Text style={[styles.value, { color: user?.isEmailVerified ? colors.secondary : colors.warning }]}>
              {user?.isEmailVerified ? "Verified" : "Unverified"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{user?.role?.toUpperCase()}</Text>
          </View>

          <Button
            title="Change Password"
            variant="outline"
            size="sm"
            style={{ marginTop: spacing.md }}
            onPress={() => setPasswordModalVisible(true)}
          />
        </Card>

        {/* Privacy & Discovery */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Privacy & Marketplace</Text>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={styles.switchLabel}>Public Profile</Text>
              <Text style={styles.switchSub}>
                Allow your profile and skills to appear in the community discover and matching engine.
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={handlePrivacyToggle}
              disabled={updatingPrivacy}
              trackColor={{ false: "#334155", true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* App Info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Application</Text>
            <Text style={styles.value}>SkillBarter Mobile</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0 (Expo SDK 52)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Backend Connection</Text>
            <Text style={styles.value}>Express.js REST + MongoDB</Text>
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          variant="danger"
          size="lg"
          style={styles.logoutBtn}
          onPress={handleLogout}
        />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <Input
              label="Current Password"
              placeholder="••••••••"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Input
              label="New Password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setPasswordModalVisible(false)}
              />
              <Button
                title="Update Password"
                variant="primary"
                style={{ flex: 1 }}
                loading={passwordLoading}
                onPress={handleChangePassword}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  switchSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  logoutBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
