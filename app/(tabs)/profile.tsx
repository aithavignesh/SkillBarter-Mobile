import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { UserSkillDto, ProficiencyLevel } from "@/types";
import { Avatar } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

const PROFICIENCIES: ProficiencyLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export default function MyProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch My Skills
  const {
    data: skillsData,
    isLoading: skillsLoading,
    refetch: refetchSkills,
    isRefetching,
  } = useQuery({
    queryKey: ["skills", "my"],
    queryFn: () => api.skills.getMySkills(),
  });

  // Modal State for Add / Edit Skill
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkillDto | null>(null);
  const [skillType, setSkillType] = useState<"offered" | "wanted">("offered");
  const [skillName, setSkillName] = useState("");
  const [category, setCategory] = useState("Software Development");
  const [proficiency, setProficiency] = useState<ProficiencyLevel>("intermediate");
  const [years, setYears] = useState("2");
  const [description, setDescription] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Profile Edit Modal
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editLocation, setEditLocation] = useState(user?.location || "");
  const [profileSaving, setProfileSaving] = useState(false);

  const mySkills = skillsData?.skills || [];
  const offeredSkills = mySkills.filter((s) => s.type === "offered");
  const wantedSkills = mySkills.filter((s) => s.type === "wanted");

  const openAddModal = (type: "offered" | "wanted") => {
    setEditingSkill(null);
    setSkillType(type);
    setSkillName("");
    setCategory("Software Development");
    setProficiency(type === "offered" ? "intermediate" : "beginner");
    setYears(type === "offered" ? "2" : "0");
    setDescription("");
    setModalError(null);
    setSkillModalVisible(true);
  };

  const openEditModal = (skill: UserSkillDto) => {
    setEditingSkill(skill);
    setSkillType(skill.type);
    setSkillName(skill.name);
    setCategory(skill.category);
    setProficiency(skill.proficiency);
    setYears(String(skill.yearsExperience));
    setDescription(skill.description || "");
    setModalError(null);
    setSkillModalVisible(true);
  };

  const handleSaveSkill = async () => {
    if (!skillName.trim()) {
      setModalError("Please enter skill name");
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      if (editingSkill) {
        await api.skills.updateMySkill(editingSkill.id, {
          proficiency,
          description: description.trim(),
          yearsExperience: parseInt(years, 10) || 1,
        });
      } else {
        await api.skills.addMySkill({
          name: skillName.trim(),
          category,
          type: skillType,
          proficiency,
          description: description.trim(),
          yearsExperience: parseInt(years, 10) || 1,
        });
      }
      setSkillModalVisible(false);
      await refetchSkills();
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      setModalError(err.message || "Failed to save skill.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSkill = async (id: string, name: string) => {
    Alert.alert("Delete Skill", `Are you sure you want to remove ${name} from your profile?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.skills.deleteMySkill(id);
            await refetchSkills();
            await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete skill.");
          }
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editDisplayName.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    setProfileSaving(true);
    try {
      await api.users.updateProfile({
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
        location: editLocation.trim(),
      });
      await refreshUser();
      setEditProfileVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>My Profile</Text>
        <Pressable
          onPress={() => router.push("/settings")}
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={async () => {
              await Promise.all([refetchSkills(), refreshUser()]);
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* User Info Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <Avatar
              name={user?.displayName || "Member"}
              url={user?.avatarUrl}
              size={64}
            />
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>{user?.displayName}</Text>
              <Text style={styles.emailText}>{user?.email}</Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={`Rep: ${user?.reputationScore ?? 100}`}
                  variant="primary"
                  style={{ marginRight: 6 }}
                />
                <Badge
                  label={`${user?.completedExchangesCount ?? 0} barters`}
                  variant="secondary"
                />
              </View>
            </View>
          </View>

          {user?.bio ? <Text style={styles.bioText}>{user.bio}</Text> : null}

          {user?.location ? (
            <Text style={styles.locationText}>📍 {user.location}</Text>
          ) : null}

          <View style={styles.profileActions}>
            <Button
              title="Edit Profile"
              size="sm"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => {
                setEditDisplayName(user?.displayName || "");
                setEditBio(user?.bio || "");
                setEditLocation(user?.location || "");
                setEditProfileVisible(true);
              }}
            />
            <Button
              title="Public View"
              size="sm"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() => router.push(`/profiles/${user?.id}` as any)}
            />
          </View>
        </Card>

        {/* Quick Hub Navigation */}
        <View style={styles.hubGrid}>
          <Pressable
            onPress={() => router.push("/community")}
            style={styles.hubItem}
          >
            <Text style={styles.hubIcon}>👥</Text>
            <Text style={styles.hubTitle}>Community</Text>
            <Text style={styles.hubSub}>Posts & Connections</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/safety")}
            style={styles.hubItem}
          >
            <Text style={styles.hubIcon}>🛡</Text>
            <Text style={styles.hubTitle}>Safety Center</Text>
            <Text style={styles.hubSub}>Blocked & Reports</Text>
          </Pressable>
        </View>

        {/* Admin Dashboard Pill (if admin) */}
        {user?.role === "admin" && (
          <Pressable
            onPress={() => router.push("/admin")}
            style={styles.adminBanner}
          >
            <Text style={styles.adminBannerIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminBannerTitle}>Administrator Portal</Text>
              <Text style={styles.adminBannerSub}>
                Moderation reports, user suspensions, and platform stats
              </Text>
            </View>
            <Text style={styles.adminBannerArrow}>›</Text>
          </Pressable>
        )}

        {/* Skills Offered Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Skills I Teach ({offeredSkills.length})
            </Text>
            <Button
              title="+ Add"
              size="sm"
              variant="secondary"
              onPress={() => openAddModal("offered")}
            />
          </View>

          {offeredSkills.map((s) => (
            <Card key={s.id} style={styles.skillCard}>
              <View style={styles.skillTop}>
                <View>
                  <Text style={styles.skillName}>{s.name}</Text>
                  <Text style={styles.skillMeta}>
                    {s.category} • {s.proficiency}
                  </Text>
                </View>
                <View style={styles.skillActions}>
                  <Button
                    title="Edit"
                    size="sm"
                    variant="ghost"
                    onPress={() => openEditModal(s)}
                  />
                  <Button
                    title="✕"
                    size="sm"
                    variant="ghost"
                    textStyle={{ color: colors.danger }}
                    onPress={() => handleDeleteSkill(s.id, s.name)}
                  />
                </View>
              </View>
              {s.description ? (
                <Text style={styles.skillDesc}>{s.description}</Text>
              ) : null}
            </Card>
          ))}
        </View>

        {/* Skills Wanted Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Skills I Want ({wantedSkills.length})
            </Text>
            <Button
              title="+ Add"
              size="sm"
              variant="primary"
              onPress={() => openAddModal("wanted")}
            />
          </View>

          {wantedSkills.map((s) => (
            <Card key={s.id} style={styles.skillCard}>
              <View style={styles.skillTop}>
                <View>
                  <Text style={styles.skillName}>{s.name}</Text>
                  <Text style={styles.skillMeta}>
                    {s.category} • {s.proficiency}
                  </Text>
                </View>
                <View style={styles.skillActions}>
                  <Button
                    title="Edit"
                    size="sm"
                    variant="ghost"
                    onPress={() => openEditModal(s)}
                  />
                  <Button
                    title="✕"
                    size="sm"
                    variant="ghost"
                    textStyle={{ color: colors.danger }}
                    onPress={() => handleDeleteSkill(s.id, s.name)}
                  />
                </View>
              </View>
              {s.description ? (
                <Text style={styles.skillDesc}>{s.description}</Text>
              ) : null}
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Add / Edit Skill Modal */}
      <Modal visible={skillModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingSkill
                ? `Edit ${editingSkill.name}`
                : `Add Skill to ${skillType === "offered" ? "Teach" : "Learn"}`}
            </Text>

            {modalError && <ErrorAlert message={modalError} />}

            {!editingSkill && (
              <Input
                label="Skill Name"
                placeholder="e.g. Node.js, UI Design, Japanese"
                value={skillName}
                onChangeText={setSkillName}
              />
            )}

            <Text style={styles.inputLabel}>Proficiency Level</Text>
            <View style={styles.proficiencyRow}>
              {PROFICIENCIES.map((lvl) => (
                <Pressable
                  key={lvl}
                  onPress={() => setProficiency(lvl)}
                  style={[
                    styles.profBtn,
                    proficiency === lvl && styles.profBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.profBtnText,
                      proficiency === lvl && styles.profBtnTextActive,
                    ]}
                  >
                    {lvl}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Input
              label="Years of Experience"
              keyboardType="numeric"
              value={years}
              onChangeText={setYears}
            />

            <Input
              label="Description / Goals"
              placeholder="What specifically can you teach or want to learn?"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setSkillModalVisible(false)}
              />
              <Button
                title="Save"
                variant="primary"
                style={{ flex: 1 }}
                loading={modalLoading}
                onPress={handleSaveSkill}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile Details</Text>

            <Input
              label="Display Name"
              value={editDisplayName}
              onChangeText={setEditDisplayName}
            />

            <Input
              label="Location"
              placeholder="e.g. London, UK"
              value={editLocation}
              onChangeText={setEditLocation}
            />

            <Input
              label="Bio"
              placeholder="Write a brief intro..."
              value={editBio}
              onChangeText={setEditBio}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setEditProfileVisible(false)}
              />
              <Button
                title="Save Changes"
                variant="primary"
                style={{ flex: 1 }}
                loading={profileSaving}
                onPress={handleSaveProfile}
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
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  topTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardDark,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    color: colors.textPrimary,
    fontSize: 20,
  },
  content: {
    padding: spacing.md,
  },
  profileCard: {
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
  emailText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  bioText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
    marginTop: 4,
  },
  profileActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  hubGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  hubItem: {
    flex: 1,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  hubIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  hubTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  hubSub: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  adminBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  adminBannerIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  adminBannerTitle: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.sm,
  },
  adminBannerSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  adminBannerArrow: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: spacing.xs,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
  skillCard: {
    marginBottom: spacing.xs,
    padding: spacing.sm + 2,
  },
  skillTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skillName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  skillMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  skillActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  skillDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
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
  inputLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs,
  },
  proficiencyRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  profBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: borderRadius.sm,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  profBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  profBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: "capitalize",
  },
  profBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
