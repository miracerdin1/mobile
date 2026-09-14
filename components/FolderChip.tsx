import React from "react";
import { Chip } from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import type { FolderChipProps } from "../types/componentProps";
import { withAlpha } from "../utils/color";

/**
 * Filter chip for folders — a neutral pill with a folder-colored icon when
 * unselected, and a light tint of the folder color (not a solid fill) when
 * selected. This keeps folder color meaningful without overpowering content.
 * Shared by FolderList and ClipboardPrompt so both stay visually identical.
 */
export default function FolderChip({
  label,
  icon,
  selected,
  onPress,
  color,
  compact,
  accessibilityLabel,
}: FolderChipProps) {
  const theme = useAppTheme();
  const fill = color || theme.colors.primary;

  const selectedBg = color ? withAlpha(fill, "18") : theme.colors.primaryContainer;
  const selectedBorder = color ? fill : theme.colors.primary;
  const selectedFg = color ? fill : theme.colors.onPrimaryContainer;

  return (
    <Chip
      selected={selected}
      onPress={onPress}
      icon={icon}
      compact={compact}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      showSelectedCheck={false}
      style={{
        marginRight: theme.spacing.sm,
        backgroundColor: selected ? selectedBg : theme.colors.surface,
        borderWidth: 1,
        borderColor: selected ? selectedBorder : theme.colors.outlineVariant,
        borderRadius: theme.radius.sm,
        minHeight: compact ? 36 : 40,
      }}
      textStyle={{
        color: selected ? selectedFg : theme.colors.onSurface,
        fontFamily: selected ? theme.fontFamily.semibold : theme.fontFamily.medium,
        fontSize: compact ? 12 : 13,
      }}
      // Tint the leading icon: folder color always, even when unselected.
      theme={{ colors: { onSurfaceVariant: selected ? selectedFg : fill } }}
    >
      {label}
    </Chip>
  );
}
