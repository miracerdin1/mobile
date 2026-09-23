import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Linking, Platform, Share, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ActivityIndicator, Button, IconButton, Text } from "react-native-paper";
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import PrimaryButton from "../components/PrimaryButton";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../constants";
import Config from "../constants/Config";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";
import { useArchiveData } from "../hooks/useArchiveData";
import { recordLinkActivity } from "../services/linkActivity";
import type { Link } from "../types";
import { showAlert } from "../utils/alert";
import { buildWeeklyRecap, daysSince, type WeeklyRecap } from "../utils/recap";
import { isWeeklyRecapScheduled, scheduleWeeklyRecap } from "../utils/recapNotification";
import { normalizeHttpUrl } from "../utils/url";

/**
 * Weekly recap, told as a story: tap right for the next page, left for the
 * previous one, hold to pause. Pages only appear when they have something
 * to say (no top site page for a week of one-offs, no forgotten page when
 * nothing is forgotten). The last page turns the week into a shareable card.
 */

const PAGE_MS = 5200;
/** A press longer than this is a hold (pause) rather than a tap (turn the page). */
const TAP_MS = 220;

type PageKind = "count" | "site" | "categories" | "forgotten" | "share" | "empty";

interface PageTheme {
  bg: string;
  fg: string;
  muted: string;
  track: string;
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const rangeLabel = (from: Date, to: Date) =>
  from.getMonth() === to.getMonth()
    ? `${from.getDate()} - ${to.getDate()} ${MONTHS[to.getMonth()]}`
    : `${from.getDate()} ${MONTHS[from.getMonth()]} - ${to.getDate()} ${MONTHS[to.getMonth()]}`;
const categoryName = (category: string) => CATEGORY_LABELS[category] ?? category;

export default function RecapScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { links, loading } = useArchiveData();
  const recap = useMemo(() => buildWeeklyRecap(links, user?.id), [links, user?.id]);

  const pages = useMemo<PageKind[]>(() => {
    if (recap.total === 0) return recap.oldestForgotten ? ["empty", "forgotten"] : ["empty"];
    const list: PageKind[] = ["count"];
    if (recap.topSite) list.push("site");
    if (recap.categories.length > 1) list.push("categories");
    if (recap.oldestForgotten) list.push("forgotten");
    list.push("share");
    return list;
  }, [recap]);

  const palette: Record<PageKind, PageTheme> = {
    count: { bg: theme.colors.primary, fg: "#FFFFFF", muted: "rgba(255,255,255,0.78)", track: "rgba(255,255,255,0.35)" },
    empty: { bg: theme.colors.primary, fg: "#FFFFFF", muted: "rgba(255,255,255,0.78)", track: "rgba(255,255,255,0.35)" },
    site: { bg: "#FBFAF7", fg: theme.colors.onSurface, muted: theme.colors.onSurfaceVariant, track: "rgba(22,32,51,0.16)" },
    categories: { bg: theme.colors.onSurface, fg: "#FFFFFF", muted: "rgba(255,255,255,0.72)", track: "rgba(255,255,255,0.3)" },
    forgotten: { bg: theme.app.warningContainer, fg: theme.app.onWarningContainer, muted: theme.app.onWarningContainer, track: "rgba(88,55,13,0.2)" },
    share: { bg: theme.colors.primary, fg: "#FFFFFF", muted: "rgba(255,255,255,0.78)", track: "rgba(255,255,255,0.35)" },
  };

  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);
  const width = useRef(1);

  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace("/")), [router]);

  const go = useCallback(
    (next: number) => {
      if (next >= pages.length) return; // the last page stays until closed
      setIndex(Math.max(0, next));
    },
    [pages.length],
  );

  // Runs the current page's bar; reaching the end turns the page.
  const run = useCallback(() => {
    if (reduceMotion) return;
    const remaining = PAGE_MS * (1 - progress.value);
    progress.value = withTiming(1, { duration: remaining, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(go)(index + 1);
    });
  }, [go, index, progress, reduceMotion]);

  useEffect(() => {
    progress.value = 0;
    if (!loading) run();
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, loading]);

  // One Pan with a duration check tells a tap from a hold. (A Pressable fired
  // twice per click on web and gave no locationX; Race(Tap, LongPress)-style
  // combos misfire on web too.) Press state lives in a ref: gesture callbacks
  // are workletized and copy plain closure variables by value.
  const press = useRef({ start: 0 });
  const tapOrHold = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin(() => {
      press.current.start = Date.now();
      cancelAnimation(progress);
    })
    .onFinalize((e) => {
      const tap = Date.now() - press.current.start < TAP_MS && Math.hypot(e.translationX, e.translationY) < 10;
      if (!tap) return run();
      if (e.x < width.current / 3) go(index - 1);
      else if (index < pages.length - 1) go(index + 1);
      else run();
    });

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.primary }]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  const kind = pages[Math.min(index, pages.length - 1)];
  const p = palette[kind];

  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      <GestureDetector gesture={tapOrHold}>
        <View
          style={StyleSheet.absoluteFill}
          onLayout={(e: LayoutChangeEvent) => (width.current = e.nativeEvent.layout.width || 1)}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Sonraki sayfa. Sol kenara dokunmak önceki sayfaya döner, basılı tutmak durdurur."
          accessibilityActions={[{ name: "activate" }, { name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => (e.nativeEvent.actionName === "decrement" ? go(index - 1) : go(index + 1))}
        />
      </GestureDetector>

      <View style={[styles.bars, { top: insets.top + 10 }]} pointerEvents="none">
        {pages.map((_, i) => (
          <ProgressBar key={i} state={i < index ? "done" : i > index ? "todo" : "current"} progress={progress} fill={p.fg} track={p.track} />
        ))}
      </View>
      <IconButton
        icon="close"
        iconColor={p.fg}
        size={22}
        onPress={close}
        accessibilityLabel="Özeti kapat"
        style={[styles.close, { top: insets.top + 18 }]}
      />

      <View
        key={index}
        style={[styles.page, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 26, paddingHorizontal: theme.spacing.lg }]}
        pointerEvents="box-none"
      >
        <Page kind={kind} recap={recap} p={p} reduceMotion={reduceMotion} username={user?.username} />
      </View>
    </View>
  );
}

function ProgressBar({
  state,
  progress,
  fill,
  track,
}: {
  state: "done" | "current" | "todo";
  progress: SharedValue<number>;
  fill: string;
  track: string;
}) {
  const style = useAnimatedStyle(() => ({
    width: `${(state === "done" ? 1 : state === "todo" ? 0 : progress.value) * 100}%`,
  }));
  return (
    <View style={[styles.bar, { backgroundColor: track }]}>
      <Animated.View style={[styles.barFill, { backgroundColor: fill }, style]} />
    </View>
  );
}

/** Staggered rise for a page's blocks. */
const rise = (reduceMotion: boolean, order: number) =>
  reduceMotion ? undefined : FadeInDown.duration(480).delay(order * 80).easing(Easing.bezier(0.2, 0.7, 0.2, 1));

function Page({
  kind,
  recap,
  p,
  reduceMotion,
  username,
}: {
  kind: PageKind;
  recap: WeeklyRecap;
  p: PageTheme;
  reduceMotion: boolean;
  username?: string;
}) {
  const theme = useAppTheme();
  const eyebrow = (text: string, order = 0) => (
    <Animated.Text entering={rise(reduceMotion, order)} style={[styles.eyebrow, { color: p.muted, fontFamily: theme.fontFamily.bold }]}>
      {text.toLocaleUpperCase("tr-TR")}
    </Animated.Text>
  );
  const headline = (text: string, order = 1, size = 28) => (
    <Animated.Text
      entering={rise(reduceMotion, order)}
      style={[styles.headline, { color: p.fg, fontFamily: theme.fontFamily.displayBold, fontSize: size, lineHeight: size * 1.15 }]}
    >
      {text}
    </Animated.Text>
  );
  const body = (text: string, order = 2) => (
    <Animated.Text entering={rise(reduceMotion, order)} style={[styles.body, { color: p.muted, fontFamily: theme.fontFamily.regular }]}>
      {text}
    </Animated.Text>
  );
  const range = rangeLabel(recap.from, recap.to);

  if (kind === "empty") {
    return (
      <>
        {eyebrow(range)}
        {headline("Bu hafta link kaydetmedin.", 1, 34)}
        {body(recap.oldestForgotten ? "Ama arşivinde seni bekleyen bir şey var." : "Bir sonraki pazar yeniden bakarız.")}
      </>
    );
  }

  if (kind === "count") {
    const max = Math.max(...recap.days.map((d) => d.count), 1);
    return (
      <>
        {eyebrow(range)}
        <Animated.Text entering={rise(reduceMotion, 1)} style={[styles.big, { color: p.fg, fontFamily: theme.fontFamily.displayBold }]}>
          {recap.total}
        </Animated.Text>
        {headline("link kaydettin.", 2)}
        {recap.busiestDay && recap.busiestDay.count > 1
          ? body(`${recap.busiestDay.longLabel} en yoğun günündü: ${recap.busiestDay.count} link.`, 3)
          : null}
        <Animated.View entering={rise(reduceMotion, 4)} style={styles.week}>
          {recap.days.map((day, i) => (
            <View key={i} style={styles.weekDay}>
              <Text style={[styles.weekCount, { color: p.fg, fontFamily: theme.fontFamily.semibold }]}>{day.count}</Text>
              <View
                style={{
                  width: "100%",
                  height: Math.max(3, (day.count / max) * 110),
                  borderTopLeftRadius: 5,
                  borderTopRightRadius: 5,
                  borderBottomLeftRadius: 2,
                  borderBottomRightRadius: 2,
                  backgroundColor: day.count === max ? p.fg : p.track,
                }}
              />
              <Text style={[styles.weekLabel, { color: p.muted, fontFamily: theme.fontFamily.medium }]}>{day.label}</Text>
            </View>
          ))}
        </Animated.View>
      </>
    );
  }

  if (kind === "site" && recap.topSite) {
    const withImages = recap.topSite.links.filter((l) => l.imageUrl).slice(0, 5);
    const spots = [
      { left: "2%", top: 0, rotate: "-7deg" },
      { left: "40%", top: 22, rotate: "5deg" },
      { left: "14%", top: 92, rotate: "-2deg" },
      { left: "46%", top: 126, rotate: "8deg" },
      { left: "6%", top: 176, rotate: "-5deg" },
    ] as const;
    return (
      <>
        {eyebrow("En çok kaydettiğin yer")}
        {headline(recap.topSite.name, 1, 36)}
        {body(`${recap.total} linkin ${recap.topSite.count} tanesi buradan.`)}
        <Animated.View entering={rise(reduceMotion, 3)} style={styles.collage}>
          {withImages.map((link, i) => (
            <Image
              key={link._id}
              source={{ uri: link.imageUrl }}
              style={[
                styles.collageImage,
                { left: spots[i].left, top: spots[i].top, transform: [{ rotate: spots[i].rotate }], borderColor: "#FFFFFF" },
              ]}
            />
          ))}
        </Animated.View>
      </>
    );
  }

  if (kind === "categories") {
    const top = recap.categories[0];
    return (
      <>
        {eyebrow("Kategoriler")}
        {headline(`Bu hafta en çok ${categoryName(top.category).toLocaleLowerCase("tr-TR")} kaydettin.`)}
        {recap.previousTopCategory ? body(`Geçen hafta ${categoryName(recap.previousTopCategory).toLocaleLowerCase("tr-TR")} öndeydi.`) : null}
        <Animated.View entering={rise(reduceMotion, 3)} style={styles.stack}>
          {recap.categories.map((c) => (
            <View
              key={c.category}
              style={{ flex: c.count, backgroundColor: CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.Other }}
            />
          ))}
        </Animated.View>
        <Animated.View entering={rise(reduceMotion, 4)} style={styles.legend}>
          {recap.categories.map((c) => (
            <View key={c.category} style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.Other }]} />
              <Text style={[styles.legendName, { color: p.fg, fontFamily: theme.fontFamily.medium }]}>{categoryName(c.category)}</Text>
              <Text style={[styles.legendCount, { color: p.fg, fontFamily: theme.fontFamily.displayBold }]}>{c.count}</Text>
            </View>
          ))}
        </Animated.View>
      </>
    );
  }

  if (kind === "forgotten" && recap.oldestForgotten) {
    return <ForgottenPage link={recap.oldestForgotten} p={p} reduceMotion={reduceMotion} eyebrow={eyebrow} headline={headline} />;
  }

  return <SharePage recap={recap} p={p} reduceMotion={reduceMotion} username={username} eyebrow={eyebrow} headline={headline} />;
}

function ForgottenPage({
  link,
  p,
  reduceMotion,
  eyebrow,
  headline,
}: {
  link: Link;
  p: PageTheme;
  reduceMotion: boolean;
  eyebrow: (text: string, order?: number) => React.ReactNode;
  headline: (text: string, order?: number, size?: number) => React.ReactNode;
}) {
  const theme = useAppTheme();
  const [opened, setOpened] = useState(false);
  const open = () => {
    const safeUrl = normalizeHttpUrl(link.url);
    if (!safeUrl) return showAlert("Geçersiz bağlantı", "Bu bağlantı güvenli bir şekilde açılamıyor.");
    Linking.openURL(safeUrl)
      .then(() => {
        recordLinkActivity(link._id, "opened");
        setOpened(true);
      })
      .catch(() => showAlert("Hata", "Bağlantı açılamadı."));
  };
  return (
    <>
      {eyebrow("Unuttuğun en eski link")}
      {headline(`${daysSince(link.createdAt, Date.now())} gün önce kaydettin, hiç açmadın.`)}
      <Animated.View entering={rise(reduceMotion, 3)} style={{ marginTop: "auto" }}>
        <View style={[styles.oldCard, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }]}>
          {link.imageUrl ? (
            <Image source={{ uri: link.imageUrl }} style={styles.oldImage} resizeMode="cover" />
          ) : (
            <View style={[styles.oldImage, { backgroundColor: theme.app.imagePlaceholder }]} />
          )}
          <View style={{ padding: theme.spacing.md, gap: 4 }}>
            <Text numberOfLines={3} style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.display, fontSize: 16, lineHeight: 21 }}>
              {link.title?.trim() || link.siteName || link.url}
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{link.siteName}</Text>
          </View>
        </View>
      </Animated.View>
      <Animated.View entering={rise(reduceMotion, 4)} style={{ marginTop: theme.spacing.md }}>
        <PrimaryButton icon={opened ? "check" : "open-in-new"} onPress={open}>
          {opened ? "Açıldı" : "Şimdi aç"}
        </PrimaryButton>
      </Animated.View>
    </>
  );
}

function SharePage({
  recap,
  p,
  reduceMotion,
  username,
  eyebrow,
  headline,
}: {
  recap: WeeklyRecap;
  p: PageTheme;
  reduceMotion: boolean;
  username?: string;
  eyebrow: (text: string, order?: number) => React.ReactNode;
  headline: (text: string, order?: number, size?: number) => React.ReactNode;
}) {
  const theme = useAppTheme();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [reminder, setReminder] = useState<"unknown" | "on" | "off">("unknown");
  const bioUrl = username ? `${Config.API_URL}/bio/${username}` : Config.API_URL;
  const top = recap.categories[0];
  const summary = top
    ? `Bu hafta ${recap.total} link, en çok ${categoryName(top.category).toLocaleLowerCase("tr-TR")}.`
    : `Bu hafta ${recap.total} link.`;

  useEffect(() => {
    // Web has no local notifications, so it never offers the reminder.
    if (Platform.OS === "web") return;
    isWeeklyRecapScheduled().then((on) => setReminder(on ? "on" : "off"));
  }, []);

  const share = async () => {
    setSharing(true);
    try {
      // Native: the card itself as an image. Web cannot capture views, so it shares the link.
      if (Platform.OS !== "web" && (await Sharing.isAvailableAsync())) {
        const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Haftanı paylaş", UTI: "public.png" });
        return;
      }
      try {
        await Share.share({ message: `${summary} ${bioUrl}`, url: bioUrl });
      } catch {
        await Clipboard.setStringAsync(bioUrl);
        showAlert("Kopyalandı", "Bio sayfanın bağlantısı panoya kopyalandı.");
      }
    } catch (error) {
      console.warn("Recap share failed:", error);
      showAlert("Hata", "Paylaşım başlatılamadı.");
    } finally {
      setSharing(false);
    }
  };

  const remind = async () => {
    const on = await scheduleWeeklyRecap(true);
    setReminder(on ? "on" : "off");
    if (!on) showAlert("Bildirim izni yok", "Hatırlatma için telefon ayarlarından LinkFlow bildirimlerine izin ver.");
  };

  return (
    <>
      {eyebrow("Paylaş")}
      {headline("Koleksiyonun başkalarının da işine yarar.")}
      <Animated.View entering={rise(reduceMotion, 3)} style={{ marginTop: "auto" }}>
        <View
          ref={cardRef}
          collapsable={false}
          style={[styles.shareCard, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl }]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={{ color: theme.colors.primary, fontFamily: theme.fontFamily.displayBold, fontSize: 26 }}>
              {(username?.[0] ?? "L").toLocaleUpperCase("tr-TR")}
            </Text>
          </View>
          <Text style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.displayBold, fontSize: 19 }}>
            @{username ?? "linkflow"}
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, textAlign: "center" }}>{summary}</Text>
          <View style={[styles.shareStack, { borderRadius: 4 }]}>
            {recap.categories.map((c) => (
              <View key={c.category} style={{ flex: c.count, backgroundColor: CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.Other }} />
            ))}
          </View>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11, textAlign: "center" }}>{bioUrl}</Text>
        </View>
      </Animated.View>
      <Animated.View entering={rise(reduceMotion, 4)} style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Button
          mode="contained"
          onPress={share}
          loading={sharing}
          disabled={sharing}
          buttonColor="#FFFFFF"
          textColor={theme.colors.primary}
          icon="share-variant"
          contentStyle={{ minHeight: 48 }}
          labelStyle={{ fontFamily: theme.fontFamily.semibold }}
        >
          Hikayende paylaş
        </Button>
        {reminder === "off" && (
          <Button mode="text" onPress={remind} textColor={p.fg} icon="bell-outline" labelStyle={{ fontFamily: theme.fontFamily.medium }}>
            Her pazar akşamı hatırlat
          </Button>
        )}
        {reminder === "on" && (
          <Text style={{ color: p.muted, textAlign: "center", fontSize: 12 }}>Her pazar 19.00'da hatırlatacağız.</Text>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  bars: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 4, zIndex: 5 },
  bar: { flex: 1, height: 3, borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%" },
  close: { position: "absolute", right: 4, zIndex: 6, margin: 0 },
  page: { flex: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1.6 },
  headline: { marginTop: 10, letterSpacing: -0.4 },
  body: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  big: { fontSize: 124, lineHeight: 124, letterSpacing: -4, marginTop: 18 },
  week: { marginTop: "auto", flexDirection: "row", alignItems: "flex-end", gap: 8, height: 160 },
  weekDay: { flex: 1, alignItems: "center", gap: 5 },
  weekCount: { fontSize: 11 },
  weekLabel: { fontSize: 10 },
  collage: { marginTop: "auto", height: 250 },
  collageImage: { position: "absolute", width: "52%", aspectRatio: 16 / 10, borderRadius: 10, borderWidth: 3 },
  stack: { flexDirection: "row", height: 26, borderRadius: 8, overflow: "hidden", marginTop: 28 },
  legend: { marginTop: 18, gap: 12 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
  legendName: { flex: 1, fontSize: 14 },
  legendCount: { fontSize: 18 },
  oldCard: { overflow: "hidden", transform: [{ rotate: "-2deg" }] },
  oldImage: { width: "100%", aspectRatio: 16 / 9 },
  shareCard: { padding: 20, alignItems: "center", gap: 6 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  shareStack: { flexDirection: "row", alignSelf: "stretch", height: 8, overflow: "hidden", marginVertical: 6 },
});
