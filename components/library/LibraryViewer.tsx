import { Canvas } from "@react-three/fiber";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Text } from "react-native-paper";
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from "react-native-reanimated";

import { useAppTheme } from "../../hooks/useAppTheme";
import LibraryScene from "./LibraryScene";
import {
  MAX_SHELF_LABELS,
  VIEW,
  createStageState,
  type LabelAnchor,
  type Library,
  type Shelf,
  type StageBridge,
} from "./stage";

/**
 * Gesture + canvas + shelf labels for the library. This is the lazy
 * boundary (first module to import `three`), so the renderer only ships
 * once the screen opens.
 *
 * Drag sideways to move along a shelf (with a fling), up/down to move
 * between shelves (snaps to one), tap a book to pull it out.
 *
 * Gesture scratch state lives in `stage.current.gesture`, not in closure
 * variables: the Reanimated babel plugin workletizes these callbacks and
 * copies closures by value, so writes in onStart never reach onEnd.
 */

export interface LibraryViewerProps {
  library: Library;
  pulled: number | null;
  onPick: (index: number | null) => void;
  onFirstInteraction?: () => void;
  reduceMotion: boolean;
}

const HIDDEN: LabelAnchor = { x: 0, y: 0, visible: false };
/** Movement under this (px) counts as a tap. */
const TAP_SLOP = 8;

export default function LibraryViewer({ library, pulled, onPick, onFirstInteraction, reduceMotion }: LibraryViewerProps) {
  const theme = useAppTheme();
  const stage = useRef(createStageState(library));
  const bridge = useRef<StageBridge | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const interacted = useRef(false);
  const libraryRef = useRef(library);
  libraryRef.current = library;

  const a0 = useSharedValue<LabelAnchor>(HIDDEN);
  const a1 = useSharedValue<LabelAnchor>(HIDDEN);
  const a2 = useSharedValue<LabelAnchor>(HIDDEN);
  const a3 = useSharedValue<LabelAnchor>(HIDDEN);
  const a4 = useSharedValue<LabelAnchor>(HIDDEN);
  const a5 = useSharedValue<LabelAnchor>(HIDDEN);
  const a6 = useSharedValue<LabelAnchor>(HIDDEN);
  const a7 = useSharedValue<LabelAnchor>(HIDDEN);
  const anchors = useMemo(() => [a0, a1, a2, a3, a4, a5, a6, a7], [a0, a1, a2, a3, a4, a5, a6, a7]);

  useEffect(() => {
    stage.current.pulled = pulled;
    // Bring the pulled book's shelf into view.
    if (pulled !== null) {
      const book = library.books[pulled];
      if (book) {
        stage.current.targetY = library.shelves[book.shelfIndex].y;
      }
    }
    bridge.current?.invalidate();
  }, [pulled, library]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const gesture = useMemo(() => {
    const s = stage;
    const setTouch = (x: number, y: number) => {
      const { width, height } = sizeRef.current;
      if (width && height) s.current.touch = { x: x / width, y: y / height };
    };

    return Gesture.Pan()
      .minDistance(0)
      .runOnJS(true)
      .onStart((e) => {
        const c = s.current;
        c.interacting = true;
        c.velX = 0;
        c.gesture.startX = c.targetX;
        c.gesture.startY = c.targetY;
        c.gesture.moved = false;
        setTouch(e.x, e.y);
        bridge.current?.invalidate();
      })
      .onUpdate((e) => {
        const c = s.current;
        setTouch(e.x, e.y);
        if (!c.gesture.moved && Math.hypot(e.translationX, e.translationY) < TAP_SLOP) {
          bridge.current?.invalidate();
          return;
        }
        c.gesture.moved = true;
        if (!interacted.current) {
          interacted.current = true;
          onFirstInteraction?.();
        }
        // Dragging the scene left moves the view right, like scrolling.
        c.targetX = c.gesture.startX - e.translationX * VIEW.panPerPx;
        c.targetY = c.gesture.startY + e.translationY * VIEW.panPerPx;
        bridge.current?.invalidate();
      })
      .onEnd((e) => {
        const c = s.current;
        if (!c.gesture.moved) {
          onPick(bridge.current?.pick(e.x, e.y) ?? null);
          return;
        }
        if (!reduceMotion) c.velX = (-e.velocityX * VIEW.panPerPx) / 60;
        // Settle on the nearest shelf vertically.
        c.targetY = nearestShelf(libraryRef.current.shelves, c.targetY + (reduceMotion ? 0 : (e.velocityY * VIEW.panPerPx) / 8));
      })
      .onFinalize(() => {
        s.current.interacting = false;
        s.current.touch = null;
        bridge.current?.invalidate();
      });
  }, [onFirstInteraction, onPick, reduceMotion]);

  const palette = useMemo(
    () => ({
      background: theme.colors.background,
      paper: theme.colors.surface,
      ink: theme.colors.onSurfaceVariant,
      wood: "#E7DCCB",
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
    }),
    [theme.colors],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.root} onLayout={onLayout} accessible accessibilityLabel="Kitaplık">
        {size.width > 0 && (
          <Canvas
            style={styles.canvas}
            frameloop={reduceMotion ? "demand" : "always"}
            dpr={[1, 2]}
            shadows
            // No filmic tone mapping: category colours should stay the category colours.
            flat
            camera={{ fov: VIEW.fov, near: 0.5, far: 80, position: [0, 2, VIEW.offset.z] }}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          >
            <LibraryScene
              library={library}
              stage={stage}
              bridge={bridge}
              labelAnchors={anchors}
              reduceMotion={reduceMotion}
              palette={palette}
            />
          </Canvas>
        )}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {library.shelves.slice(0, MAX_SHELF_LABELS).map((shelf, i) => (
            <ShelfLabel key={shelf.id} shelf={shelf} anchor={anchors[i]} />
          ))}
        </View>
      </View>
    </GestureDetector>
  );
}

const nearestShelf = (shelves: Shelf[], y: number) =>
  shelves.reduce((best, shelf) => (Math.abs(shelf.y - y) < Math.abs(best - y) ? shelf.y : best), shelves[0]?.y ?? 0);

function ShelfLabel({ shelf, anchor }: { shelf: Shelf; anchor: SharedValue<LabelAnchor> }) {
  const theme = useAppTheme();
  const style = useAnimatedStyle(() => ({
    opacity: anchor.value.visible ? 1 : 0,
    transform: [{ translateX: anchor.value.x }, { translateY: anchor.value.y - 14 }] as const,
  }));
  // Continuation planks (a category spilling onto a second shelf) carry no
  // label of their own — the first plank's pill already named the category.
  if (!shelf.label) return null;
  return (
    <Animated.View style={[styles.label, style]}>
      <View
        style={[
          styles.pill,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.sm },
        ]}
      >
        <View style={[styles.swatch, { backgroundColor: shelf.color }]} />
        <Text variant="labelMedium" numberOfLines={1} style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.semibold }}>
          {shelf.label}
        </Text>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, fontFamily: theme.fontFamily.medium }}>
          {shelf.books.length}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: { flex: 1 },
  label: { position: "absolute", left: 0, top: 0 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, height: 28, borderWidth: 1, maxWidth: 200 },
  swatch: { width: 8, height: 8, borderRadius: 4 },
});
