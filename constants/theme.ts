export const colors = {
  primary: "#6366F1", // Indigo 500
  primaryDark: "#4F46E5", // Indigo 600
  primaryLight: "#EEF2FF", // Indigo 50
  secondary: "#10B981", // Emerald 500
  secondaryLight: "#ECFDF5",
  accent: "#F59E0B", // Amber 500
  danger: "#EF4444", // Red 500
  dangerLight: "#FEF2F2",
  warning: "#F59E0B",
  info: "#3B82F6",
  
  // Neutral colors
  background: "#0F172A", // Dark Slate 900
  backgroundLight: "#F8FAFC", // Light Slate 50
  cardDark: "#1E293B", // Dark Slate 800
  cardLight: "#FFFFFF",
  cardHoverDark: "#334155",
  cardHoverLight: "#F1F5F9",
  
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textDarkPrimary: "#0F172A",
  textDarkSecondary: "#475569",
  textDarkMuted: "#94A3B8",

  borderDark: "#334155",
  borderLight: "#E2E8F0",
  
  status: {
    pending: "#F59E0B",
    accepted: "#3B82F6",
    scheduled: "#8B5CF6",
    in_progress: "#6366F1",
    completed: "#10B981",
    cancelled: "#64748B",
    disputed: "#EF4444",
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 30,
    huge: 36,
  },
  fontWeights: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};
