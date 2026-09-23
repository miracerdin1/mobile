import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { siteLabel } from "../utils/url";
import PrimaryButton from "./PrimaryButton";

/**
 * "Unuttukların": the user's old, never-opened links on a slowly turning
 * wheel. It advances one card every few seconds, can be spun by dragging,
 * and the front card can be opened or dismissed; either way it leaves the
 * wheel (the parent drops it from `links`).
 *
 * Laid out as a cover flow rather than a closed ring: a ring sized to the
 * card count collapsed with few cards (side cards stood edge-on behind the
 * front one). Here spacing is fixed; each card's place is its distance from
 * the front in card units, wrapped around so the wheel still loops, and
 * cards fade out before they wrap.
 *
 * All gesture state lives in shared values: the Reanimated babel plugin
 * workletizes RNGH callbacks and copies plain closure variables by value.
 */

export interface ForgottenWheelProps {
  links: Link[];
  onOpen: (link: Link) => void;
  onDismiss: (link: Link) => void;
}

const CARD_W = 156;
const CARD_H = 220;
/** Horizontal distance between neighbouring cards' centres. */
const SPACING = 112;
/** How far side cards turn inward, per card of distance. */
const TURN_DEG = 38;
/** Card units of travel per dragged pixel. */
const DRAG = 1 / 150;
const AUTO_EVERY_MS = 3200;
/** No auto-turn for this long after the user touched the wheel. */
const IDLE_MS = 5000;

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
  // Two cards cannot loop without one jumping across the front, so they just slide.
  const loops = n >= 3;

  /** Position of the wheel in card units: card i sits at i + offset (0 = front). */
  const offset = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const leaving = useSharedValue(0);
  const [front, setFront] = useState(0);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const lastTouch = useRef(0);
  const previousCount = useRef(n);
  // Set only when the user cleared the last card here, not when there were none to begin with.
  const emptiedHere = useRef(false);

  // When a card leaves, the next one slides into the front from where it stood.
  useLayoutEffect(() => {
    const removed = n < previousCount.current;
    if (n === 0 && previousCount.current > 0) emptiedHere.current = true;
    previousCount.current = n;
    leaving.value = 0;
    setLeavingId(null);
    if (!n) return;
    const target = Math.min(front, n - 1);
    if (removed && !reduceMotion) {
      // The new front card was one step to the right (or left, if the last card left).
      offset.value = (target === front ? 1 : -1) - target;
      offset.value = withTiming(-target, { duration: 420, easing: Easing.bezier(0.2, 0.7, 0.2, 1) });
    } else {
      offset.value = -target;
    }
    // `front` is read, not tracked: only a change in the number of cards re-seats the wheel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useAnimatedReaction(
    () => {
      const count = Math.max(n, 1);
      return ((Math.round(-offset.value) % count) + count) % count;
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
      const at = Math.round(offset.value);
      // Without a loop, the wheel runs back to the first card after the last.
      const next = !loops && -at >= n - 1 ? 0 : at - 1;
      offset.value = withTiming(next, { duration: 750, easing: Easing.bezier(0.2, 0.7, 0.2, 1) });
    }, AUTO_EVERY_MS);
    return () => clearInterval(timer);
  }, [focused, leavingId, loops, n, offset, reduceMotion]);

  const touched = useCallback(() => {
    lastTouch.current = Date.now();
  }, []);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .enabled(n > 1)
    .onStart(() => {
      dragStart.value = offset.value;
      runOnJS(touched)();
    })
    .onUpdate((e) => {
      offset.value = dragStart.value + e.translationX * DRAG;
    })
    .onEnd((e) => {
      let target = Math.round(offset.value + e.velocityX * DRAG * 0.15);
      if (!loops) target = Math.min(0, Math.max(-(n - 1), target));
      offset.value = withSpring(target, { damping: 18, stiffness: 140 });
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

  const caption = current
    ? [siteLabel(current), CATEGORY_LABELS[current.category ?? ""] ?? current.category].filter(Boolean).join(", ")
    : "";

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
              count={n}
              loops={loops}
              offset={offset}
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
            {caption}
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
  count,
  loops,
  offset,
  leaving,
  isLeaving,
}: {
  link: Link;
  index: number;
  count: number;
  loops: boolean;
  offset: SharedValue<number>;
  leaving: SharedValue<number>;
  isLeaving: boolean;
}) {
  const theme = useAppTheme();
  const site = siteLabel(link);
  const title = link.title?.trim() || site || link.url;
  // A title that is just the site name adds nothing; the description can use the room.
  const description = link.description?.trim();
  const showSite = !!site && site.toLocaleLowerCase("tr-TR") !== title.toLocaleLowerCase("tr-TR");

  const style = useAnimatedStyle(() => {
    // Distance from the front in card units; wrapped into (-count/2, count/2] when looping.
    let pos = index + offset.value;
    if (loops) {
      pos = ((pos % count) + count) % count;
      if (pos > count / 2) pos -= count;
    }
    const d = Math.abs(pos);
    const out = isLeaving ? leaving.value : 0;
    return {
      // Gone by 1.5 cards out, so a card never visibly jumps when it wraps around.
      opacity: interpolate(d, [0, 1, 1.5], [1, 0.62, 0], "clamp") * (1 - out),
      zIndex: Math.round(100 - d * 10),
      transform: [
        { perspective: 900 },
        { translateX: pos * SPACING },
        { translateY: out * 60 },
        { rotateY: `${interpolate(pos, [-2, 0, 2], [TURN_DEG * 2, 0, -TURN_DEG * 2], "clamp")}deg` },
        { rotateZ: `${out * -8}deg` },
        { scale: interpolate(d, [0, 1, 2], [1, 0.84, 0.7], "clamp") },
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
        <Image
          source={{ uri: link.imageUrl }}
          style={[styles.image, !description && styles.imageTall, { backgroundColor: theme.app.imagePlaceholder }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, !description && styles.imageTall, styles.placeholder, { backgroundColor: theme.app.imagePlaceholder }]}>
          <Icon source="link-variant" size={26} color={theme.colors.onSurfaceVariant} />
        </View>
      )}
      <View style={styles.body}>
        <View style={{ gap: 4 }}>
          <Text numberOfLines={3} style={[styles.cardTitle, { color: theme.colors.onSurface, fontFamily: theme.fontFamily.display }]}>
            {title}
          </Text>
          {description ? (
            <Text numberOfLines={title.length > 40 ? 1 : 3} style={[styles.desc, { color: theme.colors.onSurfaceVariant, fontFamily: theme.fontFamily.regular }]}>
              {description}
            </Text>
          ) : null}
        </View>
        {showSite && (
          <Text numberOfLines={1} style={[styles.site, { color: theme.colors.onSurfaceVariant, fontFamily: theme.fontFamily.medium }]}>
            {site}
          </Text>
        )}
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
  image: { width: "100%", aspectRatio: 16 / 10 },
  // Without a description the image takes the room, so short cards don't end in blank paper.
  // 5:4 still leaves room for a three-line title and the site name.
  imageTall: { aspectRatio: 5 / 4 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, padding: 10, justifyContent: "space-between" },
  cardTitle: { fontSize: 14, lineHeight: 18 },
  desc: { fontSize: 11, lineHeight: 15 },
  site: { fontSize: 10 },
  actions: { flexDirection: "row", justifyContent: "center" },
});
