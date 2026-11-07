import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from "react-native";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getBackgroundColor = (pressed: boolean) => {
    if (isDisabled) {
      return variant === "outline" || variant === "ghost" ? "transparent" : "#334155";
    }
    switch (variant) {
      case "primary":
        return pressed ? colors.primaryDark : colors.primary;
      case "secondary":
        return pressed ? "#059669" : colors.secondary;
      case "danger":
        return pressed ? "#DC2626" : colors.danger;
      case "outline":
      case "ghost":
        return pressed ? "#1E293B" : "transparent";
      default:
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") {
      return isDisabled ? "#475569" : colors.primary;
    }
    return "transparent";
  };

  const getTextColor = () => {
    if (isDisabled) return "#94A3B8";
    switch (variant) {
      case "primary":
      case "secondary":
      case "danger":
        return "#FFFFFF";
      case "outline":
        return colors.primary;
      case "ghost":
        return colors.textSecondary;
      default:
        return "#FFFFFF";
    }
  };

  const getHeight = () => {
    switch (size) {
      case "sm":
        return 36;
      case "lg":
        return 52;
      default:
        return 44;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 1 : 0,
          height: getHeight(),
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
                marginLeft: icon ? spacing.xs : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  text: {
    fontWeight: typography.fontWeights.semibold,
  },
});
