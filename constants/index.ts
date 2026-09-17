import Config from "./Config";
import type { VisualThemePreset } from "../types/visualTheme";

export const API_URL = Config.API_URL;

export const DEFAULT_CATEGORIES = [
  "All",
  "Video",
  "Article",
  "Product",
  "Social",
  "Other",
];

/** Turkish display names for the fixed category ids above. */
export const CATEGORY_LABELS: Record<string, string> = {
  All: "Tümü",
  Video: "Video",
  Article: "Makale",
  Product: "Ürün",
  Social: "Sosyal",
  Other: "Diğer",
};

/**
 * Accent per link category, used by the layered 3D archive. Kept separate from
 * the semantic theme colors (teal = collaboration, ochre = Pro, green = public)
 * so a category never reads as one of those states.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  Video: "#3157D5",
  Article: "#2F6F89",
  Product: "#B4652A",
  Social: "#B23A7A",
  Other: "#667085",
};

export const FOLDER_COLORS = [
  "#6200ee", // Purple
  "#ff5722", // Deep Orange
  "#2e7d32", // Emerald Green
  "#008080", // Teal
  "#d32f2f", // Sunset Red
  "#1976d2", // Ocean Blue
  "#fbc02d", // Gold
  "#e91e63", // Rose/Pink
];

export const FOLDER_ICONS = [
  "folder",
  "star",
  "heart",
  "briefcase",
  "book-open-variant",
  "cart",
  "gamepad-variant",
  "music",
  "lightbulb",
  "code-tags",
];

export const DEFAULT_VISUAL_THEME_ID = "purple-dark";

export const THEME_PRESETS: VisualThemePreset[] = [
  {
    id: "purple-dark",
    name: "Kobalt",
    description: "Net ve dengeli",
    primary: "#3157D5",
    onPrimary: "#FFFFFF",
    primaryContainer: "#E1E8FF",
    onPrimaryContainer: "#1C347F",
    background: "#F5F7FB",
    surface: "#FFFFFF",
    text: "#162033",
    muted: "#E9EDF5",
    mutedText: "#667085",
    border: "#DCE2EC",
  },
  {
    id: "sunset",
    name: "Mercan",
    description: "Sıcak ve enerjik",
    primary: "#D95D39",
    onPrimary: "#FFFFFF",
    primaryContainer: "#FFE2D8",
    onPrimaryContainer: "#7A2D19",
    background: "#FFF7F3",
    surface: "#FFFFFF",
    text: "#2A1C18",
    muted: "#F6EAE5",
    mutedText: "#75635D",
    border: "#EAD8D0",
  },
  {
    id: "nordic-light",
    name: "Adaçayı",
    description: "Sakin ve doğal",
    primary: "#34715A",
    onPrimary: "#FFFFFF",
    primaryContainer: "#DCEBE4",
    onPrimaryContainer: "#1B4636",
    background: "#F4F7F4",
    surface: "#FFFFFF",
    text: "#17251F",
    muted: "#E6EEE9",
    mutedText: "#5F7068",
    border: "#D5E1DA",
  },
  {
    id: "glassmorphic",
    name: "Lavanta",
    description: "Yumuşak ve zarif",
    primary: "#6D52B5",
    onPrimary: "#FFFFFF",
    primaryContainer: "#EAE3FA",
    onPrimaryContainer: "#3F2D76",
    background: "#F8F6FC",
    surface: "#FFFFFF",
    text: "#211A2D",
    muted: "#EFEAF6",
    mutedText: "#6E657C",
    border: "#E1DAEB",
  },
];
