import Config from "./Config";

export const API_URL = Config.API_URL;

export const DEFAULT_CATEGORIES = [
  "All",
  "Video",
  "Article",
  "Product",
  "Social",
  "Other",
];

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

export const THEME_PRESETS = [
  {
    id: "purple-dark",
    name: "Mor Karanlık",
    bg: "#1f1c2c",
    text: "#fff",
  },
  {
    id: "sunset",
    name: "Günbatımı",
    bg: "#ff5e62",
    text: "#fff",
  },
  {
    id: "nordic-light",
    name: "Kuzey Işığı",
    bg: "#eef2f3",
    text: "#2c3e50",
  },
  {
    id: "glassmorphic",
    name: "Buzlu Cam",
    bg: "#1a1a2e",
    text: "#fff",
  },
];
