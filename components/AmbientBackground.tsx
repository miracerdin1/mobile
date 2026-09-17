import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, type ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "../hooks/useAppTheme";
import { withAlpha } from "../utils/color";

type Intensity = "subtle" | "vivid";

/**
 * Each layer is a single diagonal band of colour that fades out at both ends.
 * They are drawn oversized (see OVERSCAN) and drift, so their own edges never
 * reach the viewport — you see moving colour, never a moving shape.
 */
const LAYERS = [
  { start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, dx: 38, dy: -26, rotate: -8, speed: 1 },
  { start: { x: 1, y: 0.1 }, end: { x: 0, y: 1 }, dx: -30, dy: 30, rotate: 6, speed: 1.45 },
  { start: { x: 0.25, y: 1 }, end: { x: 0.75, y: 0 }, dx: 24, dy: 20, rotate: -3, speed: 1.9 },
] as const;

/** How much larger than the screen each layer is drawn. */
const OVERSCAN = 2.2;

/**
 * Colour washes that drift slowly behind content — the app's only ambient
 * (always-running) motion. Kept at low opacity so the editorial light palette
 * still reads as paper rather than as a gradient poster.
 *
 * Deliberately not WebGL: this wraps the home screen, and a full-screen
 * shader there cost more frame time than the list could spare. The GPU ink
 * lives inside the library screen instead (components/library/InkBackdrop).
 *
 * Freezes into a static gradient when the OS asks for reduced motion.
 */
export default function AmbientBackground({
  intensity = "subtle",
  style,
  children,
}: {
  intensity?: Intensity;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const size = Math.max(width, height) * OVERSCAN;
  const alpha = intensity === "vivid" ? "2e" : "14";

  // Cool hues only: mixing the warm ochre in turns the overlaps grey.
  const tints = [theme.colors.primary, theme.colors.secondary, theme.colors.primary];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {LAYERS.map((layer, i) => (
          <Wash
            key={i}
            tint={tints[i]}
            alpha={alpha}
            size={size}
            offsetX={(width - size) / 2}
            offsetY={(height - size) / 2}
            layer={layer}
            duration={theme.motion.ambient * layer.speed}
            delay={i * 600}
            frozen={reduceMotion}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

function Wash({
  tint,
  alpha,
  size,
  offsetX,
  offsetY,
  layer,
  duration,
  delay,
  frozen,
}: {
  tint: string;
  alpha: string;
  size: number;
  offsetX: number;
  offsetY: number;
  layer: (typeof LAYERS)[number];
  duration: number;
  delay: number;
  frozen: boolean;
}) {
  const progress = useSharedValue(0.5);

  useEffect(() => {
    if (frozen) {
      progress.value = 0.5;
      return;
    }

    // Ping-pong rather than looping 0→1, so the drift never snaps back.
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, frozen, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-layer.dx, layer.dx]) },
      { translateY: interpolate(progress.value, [0, 1], [layer.dy, -layer.dy]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-layer.rotate, layer.rotate])}deg` },
      { scale: interpolate(progress.value, [0, 1], [1, 1.08]) },
    ] as const,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", width: size, height: size, left: offsetX, top: offsetY },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[withAlpha(tint, "00"), withAlpha(tint, alpha), withAlpha(tint, "00")]}
        // A narrow band: most of the screen stays clean paper, and what moves
        // across it reads as a streak of colour rather than a tinted overlay.
        locations={[0.3, 0.5, 0.7]}
        start={layer.start}
        end={layer.end}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
});
