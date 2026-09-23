import React, { useEffect, useRef } from "react";
import { Image, View } from "react-native";
import { Portal, Text } from "react-native-paper";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "../hooks/useAppTheme";
import type { Link } from "../types";
import type { TabRect } from "./CategoryTabs";

/**
 * The saved link's card flying from the clipboard prompt to its category
 * tab: it arcs up, shrinks and fades into the tab, then `onDone` fires so
 * the tab can hop. Rendered in a Portal because both rects are window
 * coordinates.
 */

export interface SaveFlightPlan {
  from: TabRect;
  to: TabRect;
  link: Link;
}

const DURATION = 720;

export default function SaveFlight({ plan, onDone }: { plan: SaveFlightPlan; onDone: () => void }) {
  const theme = useAppTheme();
  const t = useSharedValue(0);
  const { from, to, link } = plan;
  // The flight starts once per mount; a re-created callback must not restart it.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const done = () => onDoneRef.current();
    t.value = withTiming(1, { duration: DURATION, easing: Easing.bezier(0.45, 0.05, 0.3, 1) }, (finished) => {
      if (finished) runOnJS(done)();
    });
  }, [t]);

  // Quadratic arc between the two centres; the control point pulls the
  // path up and toward the start so the card lifts before it travels.
  const x0 = from.x + from.width / 2;
  const y0 = from.y + from.height / 2;
  const x1 = to.x + to.width / 2;
  const y1 = to.y + to.height / 2;
  const cx = x0 + (x1 - x0) * 0.2;
  const cy = y0 + (y1 - y0) * 0.55 - 50;
  const endScale = Math.max(0.12, (to.height / from.height) * 0.9);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    const q = 1 - p;
    const x = q * q * x0 + 2 * q * p * cx + p * p * x1;
    const y = q * q * y0 + 2 * q * p * cy + p * p * y1;
    return {
      opacity: interpolate(p, [0, 0.7, 1], [1, 1, 0.15]),
      transform: [
        { translateX: x - x0 },
        { translateY: y - y0 },
        { scale: interpolate(p, [0, 0.5, 1], [1, 0.55, endScale]) },
        { rotate: `${interpolate(p, [0, 0.5, 1], [0, -6, 0])}deg` },
      ] as const,
    };
  });

  return (
    <Portal>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: from.x,
            top: from.y,
            width: from.width,
            height: from.height,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
            padding: theme.spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm + 4,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 18,
            elevation: 12,
          },
          style,
        ]}
      >
        {link.imageUrl ? (
          <Image
            source={{ uri: link.imageUrl }}
            style={{ width: 72, height: 52, borderRadius: theme.radius.sm, backgroundColor: theme.app.imagePlaceholder }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: 72, height: 52, borderRadius: theme.radius.sm, backgroundColor: theme.app.imagePlaceholder }} />
        )}
        <Text
          variant="titleSmall"
          numberOfLines={2}
          style={{ flex: 1, color: theme.colors.onSurface, fontFamily: theme.fontFamily.display }}
        >
          {link.title?.trim() || link.siteName || link.url}
        </Text>
      </Animated.View>
    </Portal>
  );
}
