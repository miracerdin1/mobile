/**
 * LinkFlow design tokens.
 *
 * Visual direction: clean editorial archive. Every selectable palette stays
 * light, neutral, and content-first while changing the primary accent and
 * supporting surfaces. Teal remains reserved for collaboration, ochre for
 * Pro/premium, and green for public states.
 *
 * Components must consume these via `useAppTheme()` (hooks/useAppTheme.ts)
 * rather than hardcoding hex values, so light/dark stay in sync.
 */
import {
  MD3LightTheme,
  type MD3Theme,
} from "react-native-paper";

import { DEFAULT_VISUAL_THEME_ID, THEME_PRESETS } from "./index";

// ---------------------------------------------------------------------------
// Spacing / radius / motion (scheme-independent)
// ---------------------------------------------------------------------------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  full: 999,
} as const;

/** Durations in ms. Exit animations should use ~60-70% of the enter value. */
export const motion = {
  fast: 150,
  base: 200,
  slow: 300,
} as const;

/** Minimum touch target (Apple HIG 44pt / Material 48dp). */
export const touchTarget = 44;

// ---------------------------------------------------------------------------
// Typography — Inter for UI, Fraunces for content and editorial headings.
// ---------------------------------------------------------------------------

export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  displayItalic: "Fraunces_600SemiBold_Italic",
} as const;

// Static (per-weight) Google Font files already bake in their weight, so we
// keep every MD3 role's fontSize/lineHeight/letterSpacing and only swap the
// fontFamily + neutralize fontWeight (avoids RN synthesizing a fake bold on
// top of an already-bold font file).
const VARIANT_FONT_FAMILY: Record<keyof typeof MD3LightTheme.fonts, string> = {
  displayLarge: fontFamily.displayBold,
  displayMedium: fontFamily.displayBold,
  displaySmall: fontFamily.displayBold,
  headlineLarge: fontFamily.displayBold,
  headlineMedium: fontFamily.displayBold,
  headlineSmall: fontFamily.display,
  titleLarge: fontFamily.display,
  titleMedium: fontFamily.display,
  titleSmall: fontFamily.semibold,
  labelLarge: fontFamily.medium,
  labelMedium: fontFamily.medium,
  labelSmall: fontFamily.medium,
  bodyLarge: fontFamily.regular,
  bodyMedium: fontFamily.regular,
  bodySmall: fontFamily.regular,
  default: fontFamily.regular,
};

const paperFonts = (
  Object.keys(MD3LightTheme.fonts) as Array<keyof typeof MD3LightTheme.fonts>
).reduce<Record<string, unknown>>((acc, variant) => {
  acc[variant] = {
    ...MD3LightTheme.fonts[variant],
    fontFamily: VARIANT_FONT_FAMILY[variant],
    fontWeight: "normal",
  };
  return acc;
}, {}) as typeof MD3LightTheme.fonts;

// ---------------------------------------------------------------------------
// Semantic color tokens (per scheme)
// ---------------------------------------------------------------------------

/**
 * App-level semantic colors beyond what MD3 provides.
 * Every value is chosen so text roles meet 4.5:1 on their intended surface.
 *
 * Color meaning:
 *  - colors.primary (preset) → brand, primary CTAs, active filters
 *  - app.accent (deep teal)  → collaboration and shared folders
 *  - app.success (green)     → public / shared-via-link state
 *  - app.warning (ochre)         → Pro / premium
 *  - colors.error (brick)        → destructive actions
 */
export type AppColors = {
  /** Wordmark/logo text color. */
  primaryText: string;
  /** Deep teal — collaboration and shared-folder features. */
  accent: string;
  accentContainer: string;
  onAccentContainer: string;
  /** Green — public / shared-via-link state. */
  success: string;
  successContainer: string;
  onSuccessContainer: string;
  /** Ochre — Pro / premium. */
  warning: string;
  warningContainer: string;
  onWarningContainer: string;
  /** Text on top of user-chosen folder colors (always white; folder colors are saturated). */
  onFolderColor: string;
  /** Neutral placeholder for image thumbnails while loading / missing. */
  imagePlaceholder: string;
};

const getVisualThemePreset = (themeId: string) =>
  THEME_PRESETS.find((preset) => preset.id === themeId) ?? THEME_PRESETS[0];

const createColors = (themeId: string) => {
  const preset = getVisualThemePreset(themeId);

  return {
    primary: preset.primary,
    onPrimary: preset.onPrimary,
    primaryContainer: preset.primaryContainer,
    onPrimaryContainer: preset.onPrimaryContainer,
    secondary: "#2F6F89",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#DDEEF4",
    onSecondaryContainer: "#173F4E",
    tertiary: "#A16A24",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#F5E7CF",
    onTertiaryContainer: "#58370D",
    error: "#B42318",
    onError: "#FFFFFF",
    errorContainer: "#FEE4E2",
    onErrorContainer: "#7A271A",
    background: preset.background,
    onBackground: preset.text,
    surface: preset.surface,
    onSurface: preset.text,
    surfaceVariant: preset.muted,
    onSurfaceVariant: preset.mutedText,
    outline: preset.mutedText,
    outlineVariant: preset.border,
    inverseSurface: preset.text,
    inverseOnSurface: preset.surface,
    inversePrimary: preset.primaryContainer,
    surfaceDisabled: "rgba(22, 32, 51, 0.12)",
    onSurfaceDisabled: "rgba(22, 32, 51, 0.38)",
    backdrop: "rgba(15, 23, 42, 0.46)",
    shadow: "#101828",
    scrim: "#101828",
    elevation: {
      level0: "transparent",
      level1: preset.surface,
      level2: preset.background,
      level3: preset.muted,
      level4: preset.muted,
      level5: preset.border,
    },
  };
};

const createAppColors = (themeId: string): AppColors => {
  const preset = getVisualThemePreset(themeId);

  return {
    primaryText: preset.text,
    accent: "#2F6F89",
    accentContainer: "#DDEEF4",
    onAccentContainer: "#173F4E",
    success: "#397A4A",
    successContainer: "#DFF1E4",
    onSuccessContainer: "#1F4D2C",
    warning: "#A16A24",
    warningContainer: "#F5E7CF",
    onWarningContainer: "#58370D",
    onFolderColor: "#FFFFFF",
    imagePlaceholder: preset.muted,
  };
};

// ---------------------------------------------------------------------------
// Assembled themes
// ---------------------------------------------------------------------------

export type AppTheme = MD3Theme & {
  app: AppColors;
  spacing: typeof spacing;
  radius: typeof radius;
  motion: typeof motion;
  fontFamily: typeof fontFamily;
};

export const createLightTheme = (
  themeId = DEFAULT_VISUAL_THEME_ID,
): AppTheme => ({
  ...MD3LightTheme,
  roundness: 3,
  fonts: paperFonts,
  colors: { ...MD3LightTheme.colors, ...createColors(themeId) },
  app: createAppColors(themeId),
  spacing,
  radius,
  motion,
  fontFamily,
});

export const lightTheme = createLightTheme();

/** Default color used when a folder has no color set. */
export const DEFAULT_FOLDER_COLOR = getVisualThemePreset(
  DEFAULT_VISUAL_THEME_ID,
).primary;
