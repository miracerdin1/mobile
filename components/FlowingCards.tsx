import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Icon, Text } from "react-native-paper";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { CATEGORY_COLORS, CATEGORY_LABELS } from "../constants";
import { useAppTheme } from "../hooks/useAppTheme";
import { withAlpha } from "../utils/color";

/**
 * The sign-in backdrop: three columns of example saved links, one per
 * category, drifting upward at different speeds. It shows what the app does
 * before anyone has an account. Each column renders its cards twice and
 * scrolls by exactly one copy, so the loop has no seam.
 */

interface Example {
  title: string;
  site: string;
}

const COLUMNS: Array<{ category: string; icon: string; seconds: number; items: Example[] }> = [
  {
    category: "Video",
    icon: "play",
    seconds: 34,
    items: [
      { title: "Kahve demlemenin fiziği: sıcaklık, öğütme ve zaman", site: "youtube.com" },
      { title: "Ekşi maya: ilk hafta, günlük besleme", site: "youtube.com" },
      { title: "Bir yazı tipinin doğuşu, 24 dakikalık belgesel", site: "vimeo.com" },
      { title: "10 dakikada Türk kahvesi köpüğü", site: "youtube.com" },
      { title: "Pour-over için su sertliği önemli mi?", site: "youtube.com" },
    ],
  },
  {
    category: "Article",
    icon: "text-long",
    seconds: 44,
    items: [
      { title: "Uzun metin okurken dikkat neden dağılır?", site: "evrimagaci.org" },
      { title: "Tipografide optik boyut nedir?", site: "medium.com" },
      { title: "Şehirde ağaç gölgesi sıcaklığı kaç derece düşürüyor?", site: "bbc.com" },
      { title: "Kütüphanelerin sessiz dönüşümü", site: "t24.com.tr" },
      { title: "Uyku ve hafıza arasındaki bağ", site: "nautil.us" },
    ],
  },
  {
    category: "Product",
    icon: "tag-outline",
    seconds: 38,
    items: [
      { title: "Seramik el değirmeni, 40 mm konik bıçak", site: "trendyol.com" },
      { title: "Katlanır bisiklet, 16 jant, 11 kg", site: "hepsiburada.com" },
      { title: "Duvar rafı, meşe kaplama, 80 cm", site: "ikea.com.tr" },
      { title: "Cam demlik, 600 ml", site: "trendyol.com" },
      { title: "Keten masa örtüsü, 140 × 180", site: "hepsiburada.com" },
    ],
  },
];

export const FLOWING_CATEGORIES = COLUMNS.map((c) => c.category);

export default function FlowingCards() {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.columns, { paddingHorizontal: theme.spacing.sm, gap: theme.spacing.sm }]}>
        {COLUMNS.map((column) => (
          <Column key={column.category} {...column} reduceMotion={reduceMotion} />
        ))}
      </View>
    </View>
  );
}

function Column({
  category,
  icon,
  seconds,
  items,
  reduceMotion,
}: (typeof COLUMNS)[number] & { reduceMotion: boolean }) {
  const theme = useAppTheme();
  const [copyHeight, setCopyHeight] = useState(0);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (!copyHeight || reduceMotion) return;
    offset.value = 0;
    offset.value = withRepeat(withTiming(-copyHeight, { duration: seconds * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(offset);
  }, [copyHeight, offset, reduceMotion, seconds]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  const onCopyLayout = (e: LayoutChangeEvent) => setCopyHeight(e.nativeEvent.layout.height);
  const color = CATEGORY_COLORS[category];

  const copy = (key: string, measure: boolean) => (
    <View key={key} onLayout={measure ? onCopyLayout : undefined} style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
      {items.map((item) => (
        <View
          key={item.title}
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.md },
          ]}
        >
          <LinearGradient
            colors={[withAlpha(color, "33"), withAlpha(color, "8C")]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cover}
          >
            <Icon source={icon} size={22} color={theme.colors.surface} />
          </LinearGradient>
          <Text numberOfLines={3} style={[styles.title, { color: theme.colors.onSurface, fontFamily: theme.fontFamily.display }]}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={[styles.site, { color: theme.colors.onSurfaceVariant, fontFamily: theme.fontFamily.medium }]}>
            {item.site}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.column}>
      <Text
        style={[styles.head, { color, fontFamily: theme.fontFamily.semibold }]}
        numberOfLines={1}
      >
        {(CATEGORY_LABELS[category] ?? category).toLocaleUpperCase("tr-TR")}
      </Text>
      <View style={styles.clip}>
        <Animated.View style={style}>
          {copy("a", true)}
          {copy("b", false)}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flex: 1, flexDirection: "row" },
  column: { flex: 1 },
  head: { fontSize: 10, letterSpacing: 1, textAlign: "center", paddingVertical: 8 },
  clip: { flex: 1, overflow: "hidden" },
  card: { borderWidth: 1, overflow: "hidden" },
  cover: { aspectRatio: 4 / 3, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 11, lineHeight: 14, paddingHorizontal: 8, paddingTop: 7 },
  site: { fontSize: 9, paddingHorizontal: 8, paddingTop: 3, paddingBottom: 8 },
});
