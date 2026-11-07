import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, borderRadius, typography, spacing } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helper,
  containerStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputError : null,
          props.multiline ? styles.multilineWrapper : null,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor="#64748B"
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 0 } : null,
            rightIcon ? { paddingRight: 0 } : null,
            props.multiline ? styles.multilineInput : null,
            inputStyle,
          ]}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  multilineWrapper: {
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    minHeight: 96,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.base,
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSizes.xs,
    marginTop: 4,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
    marginTop: 4,
  },
});
