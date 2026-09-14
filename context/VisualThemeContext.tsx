import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { PaperProvider } from "react-native-paper";

import {
  DEFAULT_VISUAL_THEME_ID,
  THEME_PRESETS,
} from "../constants";
import { createLightTheme } from "../constants/theme";
import { usePersistedState } from "../hooks/usePersistedState";
import type { VisualThemeContextValue } from "../types/visualTheme";

const STORAGE_KEY = "linkflow_visual_theme";

const VisualThemeContext = createContext<VisualThemeContextValue | null>(null);

const isKnownTheme = (themeId: string): themeId is string =>
  THEME_PRESETS.some((preset) => preset.id === themeId);

export function VisualThemeProvider({ children }: PropsWithChildren) {
  const [themeId, setPersistedThemeId] = usePersistedState(
    STORAGE_KEY,
    DEFAULT_VISUAL_THEME_ID,
    isKnownTheme,
  );

  const setThemeId = useCallback(
    (nextThemeId: string) => {
      if (isKnownTheme(nextThemeId)) setPersistedThemeId(nextThemeId);
    },
    [setPersistedThemeId],
  );

  const theme = useMemo(() => createLightTheme(themeId), [themeId]);
  const value = useMemo(
    () => ({ themeId, setThemeId }),
    [setThemeId, themeId],
  );

  return (
    <VisualThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </VisualThemeContext.Provider>
  );
}

export function useVisualTheme() {
  const context = useContext(VisualThemeContext);
  if (!context)
    throw new Error("useVisualTheme must be used within VisualThemeProvider");

  return context;
}
