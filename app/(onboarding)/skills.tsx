import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { UserSkillItem, ProficiencyLevel } from "@/types";
import { onboardingStore } from "@/services/onboarding/store";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { Header } from "@/components/navigation/Header";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

const CATEGORIES = [
  "Software Development",
  "Design & Creative",
  "Languages",
  "Business & Marketing",
  "Music & Audio",
  "Academics & Science",
  "Health & Fitness",
  "Cooking & Culinary",
  "Other",
];

const PROFICIENCIES: ProficiencyLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export default function OnboardingSkillsScreen() {
  const router = useRouter();
  const draft = onboardingStore.getDraft();

  const [offeredSkills, setOfferedSkills] = useState<UserSkillItem[]>(
    draft.offeredSkills || []
  );
  const [wantedSkills, setWantedSkills] = useState<UserSkillItem[]>(
    draft.wantedSkills || []
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"offered" | "wanted">("offered");
  const [skillName, setSkillName] = useState("");
  const [category, setCategory] = useState("Software Development");
  const [proficiency, setProficiency] = useState<ProficiencyLevel>("intermediate");
  const [years, setYears] = useState("2");
  const [desc, setDesc] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const openAddModal = (type: "offered" | "wanted") => {
    setModalType(type);
    setSkillName("");
    setCategory(type === "offered" ? "Software Development" : "Languages");
    setProficiency(type === "offered" ? "intermediate" : "beginner");
    setYears(type === "offered" ? "2" : "0");
    setDesc("");
    setModalError(null);
    setModalVisible(true);
  };

  const handleSaveSkill = () => {
    if (!skillName.trim()) {
      setModalError("Please enter a skill name");
      return;
    }
    const item: UserSkillItem = {
      skillName: skillName.trim(),
      category,
      proficiency,
      yearsExperience: parseInt(years, 10) || 1,
      description: desc.trim(),
    };

    if (modalType === "offered") {
      setOfferedSkills((prev) => [...prev, item]);
    } else {
      setWantedSkills((prev) => [...prev, item]);
    }
    setModalVisible(false);
  };

  const removeSkill = (type: "offered" | "wanted", index: number) => {
    if (type === "offered") {
      setOfferedSkills((prev) => prev.filter((_, i) => i !== index));
    } else {
      setWantedSkills((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleNext = () => {
    if (offeredSkills.length === 0) {
      setErrorMsg("Please add at least one skill you can teach (offered).");
      return;
    }
    if (wantedSkills.length === 0) {
      setErrorMsg("Please add at least one skill you want to learn (wanted).");
      return;
    }
    setErrorMsg(null);
    onboardingStore.updateDraft({ offeredSkills, wantedSkills });
    router.push("/(onboarding)/preferences");
  };

  return (
    <View style={styles.container}>
      <Header title="Step 2 of 3" subtitle="Skills Exchange" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg && <ErrorAlert message={errorMsg} />}

        {/* Offered Skills Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Skills You Can Teach</Text>
              <Text style={styles.sectionSubtitle}>
                Add skills you're confident mentoring others in.
              </Text>
            </View>
            <Button
              title="+ Add"
              size="sm"
              variant="secondary"
              onPress={() => openAddModal("offered")}
            />
          </View>

          {offeredSkills.length === 0 ? (
            <Text style={styles.emptyNote}>
              No skills added yet. Tap "+ Add" to list a skill you can offer.
            </Text>
          ) : (
            offeredSkills.map((s, idx) => (
              <View key={idx} style={styles.skillItem}>
                <View style={styles.skillItemInfo}>
                  <Text style={styles.skillItemName}>{s.skillName}</Text>
                  <View style={styles.badgeRow}>
                    <Badge label={s.category} variant="neutral" style={{ marginRight: 6 }} />
                    <Badge label={s.proficiency} variant="secondary" />
                  </View>
                  {s.description ? (
                    <Text style={styles.skillDesc}>{s.description}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => removeSkill("offered", idx)}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Wanted Skills Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Skills You Want to Learn</Text>
              <Text style={styles.sectionSubtitle}>
                What knowledge or capabilities are you seeking?
              </Text>
            </View>
            <Button
              title="+ Add"
              size="sm"
              variant="primary"
              onPress={() => openAddModal("wanted")}
            />
          </View>

          {wantedSkills.length === 0 ? (
            <Text style={styles.emptyNote}>
              No learning goals added yet. Tap "+ Add" to list a skill you want to learn.
            </Text>
          ) : (
            wantedSkills.map((s, idx) => (
              <View key={idx} style={styles.skillItem}>
                <View style={styles.skillItemInfo}>
                  <Text style={styles.skillItemName}>{s.skillName}</Text>
                  <View style={styles.badgeRow}>
                    <Badge label={s.category} variant="neutral" style={{ marginRight: 6 }} />
                    <Badge label={s.proficiency} variant="primary" />
                  </View>
                  {s.description ? (
                    <Text style={styles.skillDesc}>{s.description}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => removeSkill("wanted", idx)}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <Button
          title="Next: Preferences →"
          onPress={handleNext}
          size="lg"
          style={styles.nextBtn}
        />
      </ScrollView>

      {/* Add Skill Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalType === "offered" ? "Add Skill You Can Teach" : "Add Skill You Want to Learn"}
            </Text>

            {modalError && <ErrorAlert message={modalError} />}

            <Input
              label="Skill Name *"
              placeholder="e.g. React Native, Python, Spanish, Guitar"
              value={skillName}
              onChangeText={setSkillName}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.chip,
                    category === cat && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat && styles.chipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

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
              label="Description / Goals"
              placeholder="e.g. Experience with building native apps..."
              value={desc}
              onChangeText={setDesc}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Skill"
                variant="primary"
                onPress={handleSaveSkill}
                style={{ flex: 1 }}
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
  sectionCard: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    maxWidth: 220,
  },
  emptyNote: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
    fontStyle: "italic",
    paddingVertical: spacing.md,
    textAlign: "center",
  },
  skillItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  skillItemInfo: {
    flex: 1,
  },
  skillItemName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  skillDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  removeBtn: {
    padding: spacing.sm,
  },
  removeText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "bold",
  },
  nextBtn: {
    marginVertical: spacing.md,
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
    maxHeight: "90%",
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
  chipScroll: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    backgroundColor: "#0F172A",
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
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
