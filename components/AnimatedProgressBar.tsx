import React, { useEffect } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useAppTheme } from "../hooks/useAppTheme";

type AnimatedProgressBarProps = {
  /** 0–1. Values outside the range are clamped. */
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * A track whose fill springs to its new width — so quota changes are felt as
 * movement rather than appearing between renders.
 */
export default function AnimatedProgressBar({
  progress,
  color,
  trackColor,
  height = 4,
  style,
  accessibilityLabel,
}: AnimatedProgressBarProps) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const clamped = Math.min(Math.max(progress, 0), 1);
  const fill = useSharedValue(clamped);

  useEffect(() => {
    fill.value = reduceMotion ? clamped : withSpring(clamped, theme.motion.springEnter);
  }, [clamped, fill, reduceMotion, theme.motion.springEnter]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        {
          height,
          overflow: "hidden",
          borderRadius: height / 2,
          backgroundColor: trackColor ?? theme.colors.surfaceVariant,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          { height: "100%", backgroundColor: color ?? theme.colors.primary },
          fillStyle,
        ]}
      />
    </View>
  );
}
