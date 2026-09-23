import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ScrollView, View, type LayoutChangeEvent } from "react-native";
import { IconButton, Text } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { CATEGORY_LABELS } from "../constants";
import { useAppTheme } from "../hooks/useAppTheme";
import type { CategoryTabsProps } from "../types/componentProps";
import PressableScale from "./PressableScale";

export { CATEGORY_LABELS };

type TabLayout = { x: number; width: number };

/** A tab's box in window coordinates. */
export type TabRect = { x: number; y: number; width: number; height: number };

export interface CategoryTabsHandle {
  /** Where a category's tab sits on screen, or null if it has no tab. */
  measureTab: (category: string) => Promise<TabRect | null>;
}

const CategoryTabs = forwardRef<CategoryTabsHandle, CategoryTabsProps>(function CategoryTabs({
  categories,
  selectedCategory,
  setSelectedCategory,
  onManageCategories,
  viewMode,
  onToggleViewMode,
  onOpenLibrary,
  counts,
  bump,
}, ref) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const labelRefs = useRef<Record<string, View | null>>({});

  useImperativeHandle(ref, () => ({
    measureTab: (category) =>
      new Promise((resolve) => {
        const node = labelRefs.current[category];
        if (!node) return resolve(null);
        node.measureInWindow((x, y, width, height) => resolve(width ? { x, y, width, height } : null));
      }),
  }), []);

  // One shared underline slides between tabs instead of each tab owning its
  // own, so switching category reads as a single continuous movement.
  const [layouts, setLayouts] = useState<Record<string, TabLayout>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const placed = useSharedValue(false);

  const handleTabLayout = useCallback(
    (category: string) => (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      setLayouts((current) => {
        const previous = current[category];
        if (previous && previous.x === x && previous.width === width) return current;
        return { ...current, [category]: { x, width } };
      });
    },
    [],
  );

  const target = layouts[selectedCategory];

  useEffect(() => {
    if (!target) return;

    // The very first placement jumps: there is nothing to slide from yet.
    if (!placed.value || reduceMotion) {
      indicatorX.value = target.x;
      indicatorWidth.value = target.width;
      placed.value = true;
      return;
    }

    indicatorX.value = withSpring(target.x, theme.motion.springEnter);
    indicatorWidth.value = withSpring(target.width, theme.motion.springEnter);
  }, [indicatorWidth, indicatorX, placed, reduceMotion, target, theme.motion.springEnter]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    opacity: indicatorWidth.value > 0 ? 1 : 0,
    transform: [{ translateX: indicatorX.value }] as const,
  }));

  return (
    <View
      style={{
        // Transparent so AmbientBackground's drifting wash shows through here.
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 960,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <ScrollView
          horizontal
          accessibilityRole="tablist"
          accessibilityLabel="Bağlantı kategorileri"
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
        >
          {/* Unpadded track: tab `x` values and the indicator share this origin. */}
          <View style={{ flexDirection: "row" }}>
            {categories.map((category) => {
              const selected = selectedCategory === category;

              return (
                <PressableScale
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  onLayout={handleTabLayout(category)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  hoverLift={0}
                  style={{
                    minHeight: 46,
                    justifyContent: "center",
                    marginRight: theme.spacing.lg,
                  }}
                >
                  <TabLabel
                    ref={(node) => {
                      labelRefs.current[category] = node;
                    }}
                    label={CATEGORY_LABELS[category] ?? category}
                    count={counts?.[category]}
                    selected={selected}
                    bumpNonce={bump && (bump.category === category || category === "All") ? bump.nonce : 0}
                    reduceMotion={reduceMotion}
                  />
                </PressableScale>
              );
            })}
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: theme.colors.primary,
                },
                indicatorStyle,
              ]}
            />
          </View>
        </ScrollView>
        <View
          style={{
            flexDirection: "row",
            marginRight: theme.spacing.sm,
            borderLeftWidth: 1,
            borderLeftColor: theme.colors.outlineVariant,
            paddingLeft: theme.spacing.xs,
          }}
        >
          <IconButton
            icon={viewMode === "grid" ? "view-list-outline" : "view-grid-outline"}
            size={21}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={onToggleViewMode}
            accessibilityLabel={
              viewMode === "grid"
                ? "Liste görünümüne geç"
                : "Izgara görünümüne geç"
            }
            style={{ margin: 0, width: 44, height: 44 }}
          />
          <IconButton
            icon="bookshelf"
            size={21}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={onOpenLibrary}
            accessibilityLabel="Kitaplığı aç"
            style={{ margin: 0, width: 44, height: 44 }}
          />
          <IconButton
            icon="tune-variant"
            size={21}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={onManageCategories}
            accessibilityLabel="Kategorileri sırala"
            style={{ margin: 0, width: 44, height: 44 }}
          />
        </View>
      </View>
    </View>
  );
});

export default CategoryTabs;

interface TabLabelProps {
  label: string;
  count?: number;
  selected: boolean;
  /** A new value makes the label hop once: a link just landed in this tab. */
  bumpNonce: number;
  reduceMotion: boolean;
}

const TabLabel = forwardRef<View, TabLabelProps>(function TabLabel({ label, count, selected, bumpNonce, reduceMotion }, ref) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!bumpNonce || reduceMotion) return;
    scale.value = withSequence(
      withTiming(1.18, { duration: theme.motion.fast }),
      withSpring(1, theme.motion.springPop),
    );
  }, [bumpNonce, reduceMotion, scale, theme.motion.fast, theme.motion.springPop]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] as const }));

  return (
    <Animated.View ref={ref} collapsable={false} style={[{ flexDirection: "row", alignItems: "baseline", gap: 5 }, style]}>
      <Text
        variant="labelLarge"
        style={{
          color: selected ? theme.colors.primary : theme.colors.onSurfaceVariant,
          fontFamily: selected ? theme.fontFamily.semibold : theme.fontFamily.medium,
        }}
      >
        {label}
      </Text>
      {count !== undefined && (
        <Text
          variant="labelSmall"
          style={{
            color: selected ? theme.colors.primary : theme.colors.onSurfaceVariant,
            fontFamily: theme.fontFamily.medium,
            fontVariant: ["tabular-nums"],
            opacity: 0.75,
          }}
        >
          {count}
        </Text>
      )}
    </Animated.View>
  );
});
