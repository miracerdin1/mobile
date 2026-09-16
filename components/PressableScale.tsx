import React from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { usePressAnimation } from "../hooks/usePressAnimation";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while held down. Defaults to `theme.motion.pressScale`. */
  pressScale?: number;
  /** Scale on pointer hover (web only). Defaults to `theme.motion.hoverScale`. */
  hoverScale?: number;
  /** Pixels the element lifts on hover (web only). Defaults to `theme.motion.hoverLift`. */
  hoverLift?: number;
};

/**
 * A touchable that springs down on press and lifts on hover — the tactile
 * "button" feel used across the app. Use it for bespoke touchables; react-
 * native-paper components should spread `usePressAnimation()` instead of being
 * wrapped in one of these (a nested touchable would swallow their ripple).
 */
export default function PressableScale({
  style,
  pressScale,
  hoverScale,
  hoverLift,
  disabled,
  children,
  ...rest
}: PressableScaleProps) {
  const { animatedStyle, pressHandlers, hoverHandlers } = usePressAnimation({
    pressScale,
    hoverScale,
    hoverLift,
    disabled: disabled ?? false,
  });

  return (
    <AnimatedPressable
      {...rest}
      {...pressHandlers}
      {...hoverHandlers}
      disabled={disabled}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
