import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ExchangeDto, ExchangeStatus } from "@/types";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";
import { Badge, BadgeVariant } from "../common/Badge";

interface ExchangeCardProps {
  exchange: ExchangeDto;
  currentUserId: string;
  onPress: (exchangeId: string) => void;
}

export function ExchangeCard({
  exchange,
  currentUserId,
  onPress,
}: ExchangeCardProps) {
  const isRequester = exchange.requesterId === currentUserId;
  const partnerName = isRequester
    ? exchange.recipientName || "Barter Partner"
    : exchange.requesterName || "Barter Partner";

  const getStatusBadge = (status: ExchangeStatus): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case "PENDING":
        return { label: "Pending", variant: "warning" };
      case "ACCEPTED":
        return { label: "Accepted", variant: "primary" };
      case "SCHEDULED":
        return { label: "Scheduled", variant: "info" };
      case "IN_PROGRESS":
        return { label: "In Progress", variant: "primary" };
      case "COMPLETED":
        return { label: "Completed", variant: "secondary" };
      case "REJECTED":
        return { label: "Declined", variant: "danger" };
      case "CANCELLED":
        return { label: "Cancelled", variant: "neutral" };
      case "DISPUTED":
        return { label: "Disputed", variant: "danger" };
      default:
        return { label: status, variant: "neutral" };
    }
  };

  const statusBadge = getStatusBadge(exchange.status);

  return (
    <Pressable
      onPress={() => onPress(exchange.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.partnerInfo}>
          <Text style={styles.roleLabel}>{isRequester ? "Outgoing to" : "Incoming from"}</Text>
          <Text style={styles.partnerName}>{partnerName}</Text>
        </View>
        <Badge label={statusBadge.label} variant={statusBadge.variant} />
      </View>

      <View style={styles.skillsExchange}>
        <View style={styles.skillColumn}>
          <Text style={styles.skillSub}>Offering</Text>
          <Text style={styles.skillName} numberOfLines={1}>
            {exchange.offeredSkillName || "Skill"}
          </Text>
        </View>
        <Text style={styles.arrow}>⇄</Text>
        <View style={styles.skillColumn}>
          <Text style={styles.skillSub}>Requesting</Text>
          <Text style={styles.skillName} numberOfLines={1}>
            {exchange.wantedSkillName || "Skill"}
          </Text>
        </View>
      </View>

      {exchange.proposalDescription ? (
        <Text style={styles.proposal} numberOfLines={2}>
          "{exchange.proposalDescription}"
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.date}>
          {new Date(exchange.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </Text>
        <Text style={styles.viewDetails}>View details ›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: spacing.md,
  },
  pressed: {
    backgroundColor: colors.cardHoverDark,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  partnerInfo: {
    flex: 1,
  },
  roleLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
  },
  partnerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2,
  },
  skillsExchange: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
  },
  skillColumn: {
    flex: 1,
  },
  skillSub: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
  },
  skillName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    marginTop: 2,
  },
  arrow: {
    color: colors.primary,
    fontSize: 20,
    marginHorizontal: spacing.sm,
    fontWeight: "bold",
  },
  proposal: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
  },
  viewDetails: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
});
