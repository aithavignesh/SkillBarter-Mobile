import React from "react";
import { View, Text, StyleSheet, Linking, Pressable } from "react-native";
import { ExchangeSessionDto, SessionStatus } from "@/types";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";
import { Badge, BadgeVariant } from "../common/Badge";
import { Button } from "../common/Button";

interface SessionCardProps {
  session: ExchangeSessionDto;
  currentUserId: string;
  onUpdateStatus?: (sessionId: string, status: SessionStatus) => void;
}

export function SessionCard({
  session,
  currentUserId,
  onUpdateStatus,
}: SessionCardProps) {
  const getBadge = (status: SessionStatus): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case "PROPOSED":
        return { label: "Proposed", variant: "warning" };
      case "CONFIRMED":
        return { label: "Confirmed", variant: "secondary" };
      case "COMPLETED":
        return { label: "Completed", variant: "info" };
      case "CANCELLED":
        return { label: "Cancelled", variant: "neutral" };
      default:
        return { label: status, variant: "neutral" };
    }
  };

  const badge = getBadge(session.status);
  const startDate = new Date(session.startTime);
  const endDate = new Date(session.endTime);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (d: Date) =>
    d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  const handleOpenLink = () => {
    if (session.meetingLink) {
      Linking.openURL(session.meetingLink).catch(() => {});
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{session.title}</Text>
          <Text style={styles.dateTime}>
            📅 {formatDate(startDate)} • {formatTime(startDate)} - {formatTime(endDate)}
          </Text>
        </View>
        <Badge label={badge.label} variant={badge.variant} />
      </View>

      {session.notes ? (
        <Text style={styles.notes}>📝 {session.notes}</Text>
      ) : null}

      {session.meetingLink ? (
        <Pressable onPress={handleOpenLink} style={styles.linkButton}>
          <Text style={styles.linkText}>🔗 Join Meeting Link</Text>
        </Pressable>
      ) : null}

      {onUpdateStatus && session.status === "PROPOSED" && (
        <View style={styles.actionRow}>
          <Button
            title="Decline"
            variant="ghost"
            size="sm"
            onPress={() => onUpdateStatus(session.id, "CANCELLED")}
          />
          <Button
            title="Confirm Time"
            variant="secondary"
            size="sm"
            onPress={() => onUpdateStatus(session.id, "CONFIRMED")}
          />
        </View>
      )}

      {onUpdateStatus && session.status === "CONFIRMED" && (
        <View style={styles.actionRow}>
          <Button
            title="Cancel Session"
            variant="outline"
            size="sm"
            onPress={() => onUpdateStatus(session.id, "CANCELLED")}
          />
          <Button
            title="Mark Completed"
            variant="primary"
            size="sm"
            onPress={() => onUpdateStatus(session.id, "COMPLETED")}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleArea: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  dateTime: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 4,
  },
  notes: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  linkButton: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
});
