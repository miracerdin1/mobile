import { useCallback } from "react";

import type { ViewMode } from "../types/viewMode";
import { usePersistedState } from "./usePersistedState";

const STORAGE_KEY = "linkflow_view_mode";

const isViewMode = (value: string): value is ViewMode =>
  value === "list" || value === "grid";

/** Persists the link list's list/grid view preference across app launches. */
export function useViewMode() {
  const [viewMode, setViewMode] = usePersistedState<ViewMode>(
    STORAGE_KEY,
    "list",
    isViewMode,
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((current) => (current === "list" ? "grid" : "list"));
  }, [setViewMode]);

  return { viewMode, setViewMode, toggleViewMode };
}
