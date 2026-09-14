import React from "react";
import { Button } from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import type { PrimaryButtonProps } from "../types/componentProps";

/**
 * The single primary CTA style for the app (brand amber fill).
 * Use for the one dominant action per screen; secondary actions should use
 * react-native-paper's `mode="text"` or `mode="outlined"` instead.
 */
export default function PrimaryButton({
  onPress,
  children,
  disabled,
  loading,
  icon,
  style,
  labelStyle,
  compact,
}: PrimaryButtonProps) {
  const theme = useAppTheme();

  return (
    <Button
      mode="contained"
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      compact={compact}
      buttonColor={theme.colors.primary}
      textColor={theme.colors.onPrimary}
      style={[{ borderRadius: theme.radius.md }, style]}
      contentStyle={{ height: compact ? 40 : 48 }}
      labelStyle={[{ fontFamily: theme.fontFamily.semibold, fontSize: 15 }, labelStyle]}
    >
      {children}
    </Button>
  );
}
