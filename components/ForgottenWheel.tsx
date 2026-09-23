import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Button, Icon, Text } from "react-native-paper";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { CATEGORY_LABELS } from "../constants";
import { useAppTheme } from "../hooks/useAppTheme";
import type { Link } from "../types";
import { daysSince } from "../utils/forgotten";
import PrimaryButton from "./PrimaryButton";

/**
 * "Unuttukların": the user's old, never-opened links on a slowly turning
 * wheel. It advances one card every few seconds, can be spun by dragging,
 * and the front card can be opened or dismissed; either way it leaves the
 * wheel (the parent drops it from `links`).
 *
 * React Native has no translateZ, so each card's place on the ring is
 * projected by hand: x = R·sinθ scaled by perspective, cards past the sides
 * fade out the way backfaces would.
 *
 * All gesture state lives in shared values: the Reanimated babel plugin
 * workletizes RNGH callbacks and copies plain closure variables by value.
 */

export interface ForgottenWheelProps {
  links: Link[];
  onOpen: (link: Link) => void;
  onDismiss: (link: Link) => void;
}

const CARD_W = 148;
const CARD_H = 212;
const GAP = 18;
const PERSPECTIVE = 620;
/** Radians of spin per dragged pixel. */
const DRAG = 0.006;
const AUTO_EVERY_MS = 3200;
/** No auto-turn for this long after the user touched the wheel. */
const IDLE_MS = 5000;

const stepFor = (n: number) => (2 * Math.PI) / Math.max(n, 3);
const radiusFor = (n: number) => (CARD_W + GAP) / (2 * Math.tan(Math.PI / Math.max(n, 3)));

export default function ForgottenWheel({ links, onOpen, onDismiss }: ForgottenWheelProps) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  // Only turn while the home screen is the one on top.
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const n = links.length;

  const angle = useSharedValue(0);
  const step = useSharedValue(stepFor(n));
  const radius = useSharedValue(radiusFor(n));
  const dragStart = useSharedValue(0);
  const leaving = useSharedValue(0);
  const [front, setFront] = useState(0);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const lastTouch = useRef(0);
  const previousCount = useRef(n);
  // Set only when the user cleared the last card here, not when there were none to begin with.
  const emptiedHere = useRef(false);

  // The ring re-spaces smoothly when a card leaves, keeping the same card in front.
  useEffect(() => {
    const target = Math.min(front, Math.max(n - 1, 0));
    const duration = reduceMotion ? 0 : 450;
    step.value = withTiming(stepFor(n), { duration });
    radius.value = withTiming(radiusFor(n), { duration });
    angle.value = withTiming(-target * stepFor(n), { duration });
    leaving.value = 0;
    setLeavingId(null);
    if (n === 0 && previousCount.current > 0) emptiedHere.current = true;
    previousCount.current = n;
    // `front` is read, not tracked: only a change in the number of cards re-spaces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useAnimatedReaction(
    () => {
      const count = Math.max(n, 1);
      return (((Math.round(-angle.value / step.value) % count) + count) % count);
    },
    (index, previous) => {
      if (index !== previous) runOnJS(setFront)(index);
    },
    [n],
  );

  // Turns one card at a time while the screen is visible and nobody is touching it.
  useEffect(() => {
    if (reduceMotion || !focused || n < 2) return;
    const timer = setInterval(() => {
      if (Date.now() - lastTouch.current < IDLE_MS || leavingId) return;
      angle.value = withTiming(Math.round(angle.value / step.value) * step.value - step.value, {
        duration: 750,
        easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      });
    }, AUTO_EVERY_MS);
    return () => clearInterval(timer);
  }, [angle, focused, leavingId, n, reduceMotion, step]);

  const touched = useCallback(() => {
    lastTouch.current = Date.now();
  }, []);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .enabled(n > 1)
    .onStart(() => {
      dragStart.value = angle.value;
      runOnJS(touched)();
    })
    .onUpdate((e) => {
      angle.value = dragStart.value + e.translationX * DRAG;
    })
    .onEnd((e) => {
      const flung = angle.value + e.velocityX * DRAG * 0.12;
      angle.value = withSpring(Math.round(flung / step.value) * step.value, { damping: 18, stiffness: 140 });
      runOnJS(touched)();
    });

  const current = links[front];

  const leave = (kind: "open" | "dismiss") => {
    if (!current || leavingId) return;
    touched();
    setLeavingId(current._id);
    const done = () => (kind === "open" ? onOpen(current) : onDismiss(current));
    if (reduceMotion) return done();
    leaving.value = withTiming(1, { duration: 320, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(done)();
    });
  };

  if (n === 0) {
    if (!emptiedHere.current) return null;
    return (
      <View style={[styles.wrap, { paddingHorizontal: theme.spacing.md }]}>
        <Text style={[styles.title, { color: theme.colors.onBackground, fontFamily: theme.fontFamily.displayBold }]}>
          Unuttuğun link kalmadı.
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Bir ay sonra yenileri burada olur.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap} accessibilityLabel="Unuttukların">
      <View style={{ paddingHorizontal: theme.spacing.md, gap: 2 }}>
        <Text style={[styles.title, { color: theme.colors.onBackground, fontFamily: theme.fontFamily.displayBold }]}>
          Unuttukların
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Kaydettin ama hiç açmadın. {n} link.
        </Text>
      </View>

      <GestureDetector gesture={pan}>
        <View style={styles.stage} collapsable={false}>
          {links.map((link, i) => (
            <WheelCard
              key={link._id}
              link={link}
              index={i}
              angle={angle}
              step={step}
              radius={radius}
              leaving={leaving}
              isLeaving={link._id === leavingId}
            />
          ))}
        </View>
      </GestureDetector>

      {current && (
        <View style={{ alignItems: "center", gap: 2, paddingHorizontal: theme.spacing.md }}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.semibold }}>
            {daysSince(current.createdAt, Date.now())} gün önce kaydettin
          </Text>
          <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
            {[current.siteName, CATEGORY_LABELS[current.category ?? ""] ?? current.category].filter(Boolean).join(", ")}
          </Text>
        </View>
      )}

      <View style={[styles.actions, { gap: theme.spacing.sm }]}>
        <Button
          mode="outlined"
          onPress={() => leave("dismiss")}
          textColor={theme.colors.onSurface}
          style={{ borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }}
          accessibilityLabel="Gerekmez, çarktan çıkar"
        >
          Gerekmez
        </Button>
        <PrimaryButton icon="open-in-new" onPress={() => leave("open")}>
          Aç
        </PrimaryButton>
      </View>
    </View>
  );
}

function WheelCard({
  link,
  index,
  angle,
  step,
  radius,
  leaving,
  isLeaving,
}: {
  link: Link;
  index: number;
  angle: SharedValue<number>;
  step: SharedValue<number>;
  radius: SharedValue<number>;
  leaving: SharedValue<number>;
  isLeaving: boolean;
}) {
  const theme = useAppTheme();

  const style = useAnimatedStyle(() => {
    // θ in (-π, π]: 0 is the front of the ring.
    let theta = (index * step.value + angle.value) % (2 * Math.PI);
    if (theta > Math.PI) theta -= 2 * Math.PI;
    if (theta <= -Math.PI) theta += 2 * Math.PI;
    const depth = Math.cos(theta);
    const r = radius.value;
    const scale = PERSPECTIVE / (PERSPECTIVE + r * (1 - depth));
    const out = isLeaving ? leaving.value : 0;
    return {
      opacity: interpolate(depth, [-0.05, 0.35, 1], [0, 0.55, 1], "clamp") * (1 - out),
      zIndex: Math.round(depth * 100),
      transform: [
        { perspective: 900 },
        { translateX: r * Math.sin(theta) * scale },
        { translateY: out * 60 },
        { rotateY: `${theta}rad` },
        { rotateZ: `${out * -8}deg` },
        { scale },
      ] as const,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          borderRadius: theme.radius.lg,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}
    >
      {link.imageUrl ? (
        <Image source={{ uri: link.imageUrl }} style={[styles.image, { backgroundColor: theme.app.imagePlaceholder }]} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder, { backgroundColor: theme.app.imagePlaceholder }]}>
          <Icon source="link-variant" size={26} color={theme.colors.onSurfaceVariant} />
        </View>
      )}
      <View style={styles.body}>
        <Text numberOfLines={3} style={[styles.cardTitle, { color: theme.colors.onSurface, fontFamily: theme.fontFamily.display }]}>
          {link.title?.trim() || link.siteName || link.url}
        </Text>
        <Text numberOfLines={1} style={[styles.site, { color: theme.colors.onSurfaceVariant, fontFamily: theme.fontFamily.medium }]}>
          {link.siteName}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 18, paddingBottom: 14, gap: 10 },
  title: { fontSize: 22, lineHeight: 26, letterSpacing: -0.2 },
  stage: { height: CARD_H + 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  card: {
    position: "absolute",
    width: CARD_W,
    height: CARD_H,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  image: { width: "100%", aspectRatio: 4 / 3 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, padding: 10, justifyContent: "space-between" },
  cardTitle: { fontSize: 13, lineHeight: 16 },
  site: { fontSize: 10 },
  actions: { flexDirection: "row", justifyContent: "center" },
});
