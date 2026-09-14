import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import type { LogoProps } from "../types/componentProps";

/**
 * LinkFlow wordmark. A layered blue "drop" glyph (two overlapping rounded
 * shapes, echoing raindrop.io's mark) precedes a near-neutral wordmark — the
 * wordmark itself is never brand-colored, only the glyph is (no emoji per
 * skill rules).
 */
export default function Logo({ size = 22 }: LogoProps) {
  const theme = useAppTheme();
  const glyphWidth = size * 0.72;
  const glyphHeight = size * 0.92;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }} accessibilityRole="header">
      <View
        style={{
          width: glyphWidth,
          height: glyphHeight,
          marginRight: size * 0.32,
          backgroundColor: theme.colors.primary,
          borderTopLeftRadius: theme.radius.sm,
          borderTopRightRadius: theme.radius.sm,
          alignItems: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: -1,
            width: 0,
            height: 0,
            borderLeftWidth: glyphWidth / 2,
            borderRightWidth: glyphWidth / 2,
            borderTopWidth: glyphWidth * 0.34,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: theme.colors.background,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: theme.fontFamily.displayBold,
          fontSize: size,
          color: theme.app.primaryText,
          letterSpacing: -0.5,
        }}
      >
        Link
        <Text
          style={{
            color: theme.colors.primary,
            fontFamily: theme.fontFamily.displayItalic,
          }}
        >
          Flow
        </Text>
      </Text>
    </View>
  );
}
