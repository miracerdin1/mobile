import { useCallback } from "react";
import { Platform } from "react-native";
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useAppTheme } from "./useAppTheme";

type PressAnimationOptions = {
  /** Scale while held down. Defaults to `theme.motion.pressScale`. */
  pressScale?: number;
  /** Scale on pointer hover (web only). Defaults to `theme.motion.hoverScale`. */
  hoverScale?: number;
  /** Pixels the element lifts on hover (web only). Defaults to `theme.motion.hoverLift`. */
  hoverLift?: number;
  /** Skip the animation entirely (disabled controls shouldn't react). */
  disabled?: boolean;
};

/**
 * The app's single source of press/hover motion.
 *
 * Spreading `pressHandlers` works on anything that takes `onPressIn`/
 * `onPressOut` — including react-native-paper's Button, Card and Chip — so
 * Paper components get the same feedback as our own `PressableScale` without
 * being rewrapped in another touchable. `hoverHandlers` goes on the wrapping
 * `Animated.View` and is empty off web.
 *
 * Honours the OS "reduce motion" setting: there the style is static and the
 * handlers are no-ops.
 */
export function usePressAnimation({
  pressScale,
  hoverScale,
  hoverLift,
  disabled = false,
}: PressAnimationOptions = {}) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const inert = disabled || reduceMotion;

  const pressed = useSharedValue(0);
  const hovered = useSharedValue(0);

  const down = pressScale ?? theme.motion.pressScale;
  const up = hoverScale ?? theme.motion.hoverScale;
  const lift = hoverLift ?? theme.motion.hoverLift;
  const spring = theme.motion.springPress;

  const setValue = useCallback(
    (target: typeof pressed, to: number) => {
      if (inert) return;
      target.value = withSpring(to, spring);
    },
    [inert, spring],
  );

  const onPressIn = useCallback(() => setValue(pressed, 1), [pressed, setValue]);
  const onPressOut = useCallback(() => setValue(pressed, 0), [pressed, setValue]);
  const onPointerEnter = useCallback(() => setValue(hovered, 1), [hovered, setValue]);
  const onPointerLeave = useCallback(() => setValue(hovered, 0), [hovered, setValue]);

  const animatedStyle = useAnimatedStyle(() => {
    // Hover sets the resting scale, press then pulls it back down from there,
    // so a pressed-while-hovered control still reads as pressed.
    const resting = 1 + (up - 1) * hovered.value;
    const scale = resting + (down - resting) * pressed.value;
    const translateY = -lift * hovered.value * (1 - pressed.value);

    return { transform: [{ scale }, { translateY }] as const };
  }, [up, down, lift]);

  return {
    /** Put this on an `Animated.View` wrapping (or being) the control. */
    animatedStyle: inert ? undefined : animatedStyle,
    pressHandlers: inert ? {} : { onPressIn, onPressOut },
    /**
     * Pointer events rather than Pressable's `onHoverIn`, so the same handlers
     * can go on a plain `Animated.View` wrapping a Paper component. Web only —
     * on touch platforms a pointer enter fires on tap, which would double up
     * with the press animation.
     */
    hoverHandlers:
      inert || Platform.OS !== "web" ? {} : { onPointerEnter, onPointerLeave },
  };
}
