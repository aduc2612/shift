// Color palette - Black and white with subtle grays
export const colors = {
  // Light theme
  light: {
    primary: "#000000",
    onPrimary: "#FFFFFF",
    primaryContainer: "#F5F5F5",
    onPrimaryContainer: "#000000",

    secondary: "#666666",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#E8E8E8",
    onSecondaryContainer: "#000000",

    tertiary: "#4D4D4D",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#F0F0F0",
    onTertiaryContainer: "#000000",

    error: "#B3261E",
    onError: "#FFFFFF",
    errorContainer: "#F9DEDC",
    onErrorContainer: "#410E0B",

    success: "#4CAF50",
    onSuccess: "#FFFFFF",
    warning: "#FEF3C7",
    onWarning: "#92400E",

    background: "#f4f3f8",
    onBackground: "#1a1a1c",

    surface: "#FFFFFF",
    onSurface: "#1C1C1C",
    surfaceVariant: "#EBEBEB",
    onSurfaceVariant: "#666666",

    outline: "#D0D0D0",
    outlineVariant: "#E0E0E0",

    scrim: "#00000066",
    shadow: "#000000",
  },

  // Dark theme
  dark: {
    primary: "#FFFFFF",
    onPrimary: "#000000",
    primaryContainer: "#2C2C2C",
    onPrimaryContainer: "#FFFFFF",

    secondary: "#AAAAAA",
    onSecondary: "#000000",
    secondaryContainer: "#404040",
    onSecondaryContainer: "#FFFFFF",

    tertiary: "#B8B8B8",
    onTertiary: "#000000",
    tertiaryContainer: "#3A3A3A",
    onTertiaryContainer: "#FFFFFF",

    error: "#F2B8B5",
    onError: "#601410",
    errorContainer: "#8B1A16",
    onErrorContainer: "#F9DEDC",

    success: "#81C784",
    onSuccess: "#000000",
    warning: "#451A03",
    onWarning: "#FBBF24",

    background: "#121212",
    onBackground: "#E6E6E6",

    surface: "#1E1E1E",
    onSurface: "#E6E6E6",
    surfaceVariant: "#2C2C2C",
    onSurfaceVariant: "#AAAAAA",

    outline: "#808080",
    outlineVariant: "#535353",

    scrim: "#00000066",
    shadow: "#000000",
  },
};

// Typography scales
export const typography = {
  displayLarge: {
    fontSize: 57,
    fontWeight: "400" as const,
    lineHeight: 64,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: "400" as const,
    lineHeight: 52,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: "400" as const,
    lineHeight: 44,
  },
  headlineLarge: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: "700" as const,
    lineHeight: 24,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: "700" as const,
    lineHeight: 20,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: "700" as const,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: "700" as const,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: "700" as const,
    lineHeight: 16,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
} as const;

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 48,
  tabBar: 80,
};

// Border radius scale
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 28,
};

// Shadows (minimal for this aesthetic)
export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Interaction tokens
export const interaction = {
  pressedOpacity: 0.6,
};

// Common component styles
export const componentStyles = {
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 0,
    padding: spacing.lg,
  },
  input: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  modal: {
    borderTopLeftRadius: borderRadius.round,
    borderTopRightRadius: borderRadius.round,
  },
  chip: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
};

// Create theme object
export const createTheme = (isDark: boolean) => {
  const palette = isDark ? colors.dark : colors.light;

  return {
    isDark,
    colors: palette,
    typography,
    spacing,
    borderRadius,
    componentStyles,
    shadows,
    interaction,
  };
};

// Light theme
export const lightTheme = createTheme(false);

// Dark theme
export const darkTheme = createTheme(true);

// Theme type
export type Theme = ReturnType<typeof createTheme>;

export default {
  light: lightTheme,
  dark: darkTheme,
  colors,
  typography,
  spacing,
  borderRadius,
  componentStyles,
  shadows,
  interaction,
};
