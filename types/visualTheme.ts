export interface VisualThemePreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  mutedText: string;
  border: string;
}

export interface VisualThemeContextValue {
  themeId: string;
  setThemeId: (themeId: string) => void;
}
