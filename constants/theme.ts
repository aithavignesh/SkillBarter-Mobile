export const colors = {
  primary: "#3B8BFF",
  primaryDark: "#1769E8",
  primaryLight: "#102D55",
  secondary: "#34D399",
  secondaryLight: "#0E302B",
  accent: "#A78BFA",
  danger: "#FB7185",
  dangerLight: "#3A1825",
  warning: "#FBBF24",
  info: "#60A5FA",

  background: "#050A14",
  backgroundLight: "#F8FAFC",
  cardDark: "#101D30",
  cardLight: "#FFFFFF",
  cardHoverDark: "#172941",
  cardHoverLight: "#F1F5F9",

  textPrimary: "#F5F8FF",
  textSecondary: "#A7B5CA",
  textMuted: "#71839D",
  textDarkPrimary: "#0F172A",
  textDarkSecondary: "#475569",
  textDarkMuted: "#94A3B8",

  borderDark: "#263B58",
  borderLight: "#E2E8F0",

  status: {
    pending: "#FBBF24",
    accepted: "#60A5FA",
    scheduled: "#A78BFA",
    in_progress: "#3B8BFF",
    completed: "#34D399",
    cancelled: "#71839D",
    disputed: "#FB7185",
  },
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
