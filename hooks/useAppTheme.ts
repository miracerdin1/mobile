import { useTheme } from "react-native-paper";

import type { AppTheme } from "../constants/theme";

/** Typed access to the LinkFlow theme (MD3 colors + app tokens). */
export const useAppTheme = () => useTheme<AppTheme>();
