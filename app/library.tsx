import { useRouter } from "expo-router";
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, IconButton, Surface, Text } from "react-native-paper";
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { buildLibrary } from "../components/library/stage";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";
import { useArchiveData } from "../hooks/useArchiveData";
import { useCategories } from "../hooks/useCategories";
import { showAlert } from "../utils/alert";
import { normalizeHttpUrl } from "../utils/url";

// `three` (~600 KB) only loads once someone opens this screen.
const LibraryViewer = lazy(() => import("../components/library/LibraryViewer"));

/**
 * Library: the archive as a room of shelves — one per category, one book per
 * link. Pan along the shelves, tap a book to pull it out, open or edit it.
 */
export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { links, loading, error, reload } = useArchiveData();
  const { categories } = useCategories();

  const library = useMemo(() => buildLibrary(categories, links), [categories, links]);
  const [pulled, setPulled] = useState<number | null>(null);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    if (pulled !== null && pulled >= library.books.length) setPulled(null);
  }, [library.books.length, pulled]);

  const handlePick = useCallback((index: number | null) => {
    setHintVisible(false);
    setPulled((current) => (current === index ? null : index));
  }, []);
  const hideHint = useCallback(() => setHintVisible(false), []);

  const book = pulled !== null ? library.books[pulled] : null;
  const shelf = book ? library.shelves[book.shelfIndex] : null;

  const openLink = useCallback((url: string) => {
    const safeUrl = normalizeHttpUrl(url);
    if (!safeUrl) {
      showAlert("Hata", "Bu bağlantı açılamıyor.");
      return;
    }
    Linking.openURL(safeUrl).catch(() => showAlert("Hata", "Bağlantı açılamadı."));
  }, []);

  const centered = (children: React.ReactNode) => (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>{children}</View>
  );
  const titleStyle = [styles.emptyTitle, { color: theme.colors.onSurface, fontFamily: theme.fontFamily.semibold }];

  if (!isAuthenticated) {
    return centered(
      <>
        <Text variant="titleMedium" style={titleStyle}>
          Kitaplığını görmek için giriş yap
        </Text>
        <PrimaryButton onPress={() => router.push("/auth")} icon="login">
          Giriş yap
        </PrimaryButton>
      </>,
    );
  }

  if (loading) return centered(<ActivityIndicator color={theme.colors.primary} />);

  if (error) {
    return centered(
      <>
        <Text variant="titleMedium" style={titleStyle}>
          Kitaplık yüklenemedi
        </Text>
        <Button mode="outlined" onPress={reload} textColor={theme.colors.primary}>
          Tekrar dene
        </Button>
      </>,
    );
  }

  if (links.length === 0) {
    return centered(
      <>
        <Text variant="titleMedium" style={titleStyle}>
          Raflar henüz boş
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
          Kaydettiğin her bağlantı burada bir kitaba dönüşür; kategorilerin de raflara.
        </Text>
      </>,
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Suspense fallback={centered(<ActivityIndicator color={theme.colors.primary} />)}>
        <LibraryViewer
          library={library}
          pulled={pulled}
          onPick={handlePick}
          onFirstInteraction={hideHint}
          reduceMotion={reduceMotion}
        />
      </Suspense>

      <View style={[styles.top, { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm }]} pointerEvents="none">
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.primary, fontFamily: theme.fontFamily.bold, letterSpacing: 1.2, textTransform: "uppercase" }}
        >
          Kitaplık
        </Text>
        <Text
          variant="headlineSmall"
          style={{ color: theme.colors.onBackground, fontFamily: theme.fontFamily.displayBold, letterSpacing: -0.4 }}
        >
          {library.shelves.length} raf · {links.length} kitap
        </Text>
        {hintVisible && (
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.delay(1200).duration(theme.motion.slow)}
            exiting={reduceMotion ? undefined : FadeOut.duration(theme.motion.fast)}
          >
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              Yana kaydır: raf boyunca · yukarı/aşağı: raflar arası · kitaba dokun: çek
            </Text>
          </Animated.View>
        )}
      </View>

      {book && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.duration(theme.motion.base)}
          exiting={reduceMotion ? undefined : FadeOutDown.duration(theme.motion.fast)}
          style={[styles.cardWrap, { bottom: insets.bottom + theme.spacing.md }]}
        >
          <Surface
            elevation={2}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                borderColor: theme.colors.outlineVariant,
                padding: theme.spacing.md,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.swatch, { backgroundColor: book.color }]} />
              <Text
                variant="labelMedium"
                numberOfLines={1}
                style={{ color: theme.colors.onSurfaceVariant, fontFamily: theme.fontFamily.medium, flex: 1 }}
              >
                {[shelf?.label, book.link.siteName].filter(Boolean).join(" · ")}
              </Text>
              <IconButton icon="close" size={18} onPress={() => setPulled(null)} accessibilityLabel="Kitabı yerine koy" style={{ margin: -8 }} />
            </View>
            <Text
              variant="titleMedium"
              numberOfLines={2}
              style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.display, marginTop: 2 }}
            >
              {book.link.title?.trim() || book.link.siteName || book.link.url}
            </Text>
            <View style={[styles.actions, { marginTop: theme.spacing.sm }]}>
              <Button
                mode="text"
                icon="pencil-outline"
                textColor={theme.colors.onSurfaceVariant}
                onPress={() => router.push(`/edit/${book.link._id}`)}
              >
                Düzenle
              </Button>
              <PrimaryButton compact icon="open-in-new" onPress={() => openLink(book.link.url)}>
                Aç
              </PrimaryButton>
            </View>
          </Surface>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { marginBottom: 8, textAlign: "center" },
  top: { position: "absolute", top: 0, left: 0, right: 0 },
  cardWrap: { position: "absolute", left: 16, right: 16, alignItems: "flex-start" },
  card: { borderWidth: 1, width: "100%", maxWidth: 520 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  actions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
});
