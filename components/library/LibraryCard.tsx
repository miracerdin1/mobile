import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, Surface, Text } from "react-native-paper";

import { touchTarget } from "../../constants/theme";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { Link } from "../../types";
import { formatFullDate } from "../../utils/date";
import { siteLabel } from "../../utils/url";
import PrimaryButton from "../PrimaryButton";
import { catalogNumber } from "./stage";

/**
 * The card a pulled book shows, styled after the checkout card tucked into
 * an old library book: catalogue number, ruled rows for shelf, source, date
 * added and the last link check, and a date stamp.
 */

export interface LibraryCardProps {
  link: Link;
  /** Category name of the book's shelf. */
  shelfLabel: string | null;
  onClose: () => void;
  onEdit: () => void;
  onOpen: () => void;
  /** Slight paper tilt; off when the user prefers reduced motion. */
  tilt: boolean;
}

/** Turkish-aware capitals: RN's textTransform would turn "fişi" into "FIŞI". */
const upper = (text: string) => text.toLocaleUpperCase("tr-TR");

export default function LibraryCard({ link, shelfLabel, onClose, onEdit, onOpen, tilt }: LibraryCardProps) {
  const theme = useAppTheme();
  const added = formatFullDate(link.createdAt);
  const checked = formatFullDate(link.lastCheckedAt);
  const source = siteLabel(link);

  const health = link.isBroken
    ? { text: checked ? `Açılmıyor, ${checked}` : "Açılmıyor", color: theme.colors.error }
    : checked
      ? { text: `Çalışıyor, ${checked}`, color: theme.app.success }
      : { text: "Henüz kontrol edilmedi", color: theme.colors.onSurfaceVariant };

  const rows: Array<{ label: string; value: string; color?: string }> = [];
  if (shelfLabel) rows.push({ label: "Raf", value: shelfLabel });
  if (source) rows.push({ label: "Kaynak", value: source });
  if (added) rows.push({ label: "Eklendi", value: added });
  rows.push({ label: "Kontrol", value: health.text, color: health.color });

  // "14 Eyl 2026" → "14 EYL" over "2026", like an inked due-date stamp.
  const parts = added?.split(" ") ?? [];
  const stamp = parts.length === 3 ? [upper(`${parts[0]} ${parts[1]}`), parts[2]] : added ? [upper(added)] : null;

  const caption = { color: theme.colors.onSurfaceVariant, fontFamily: theme.fontFamily.semibold, letterSpacing: 1.4 };

  return (
    <Surface
      elevation={3}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
          transform: tilt ? [{ rotate: "-1deg" }] : undefined,
        },
      ]}
      accessibilityLabel={`Kitaplık fişi: ${link.title?.trim() || source || link.url}`}
    >
      <View style={[styles.head, { borderBottomColor: theme.colors.onSurface }]}>
        <Text variant="labelSmall" style={caption}>
          {upper("Kitaplık fişi")}
        </Text>
        <View style={styles.headRight}>
          <Text variant="labelSmall" style={[caption, styles.tabular]}>
            No {catalogNumber(link._id)}
          </Text>
          <IconButton
            icon="close"
            size={18}
            onPress={onClose}
            accessibilityLabel="Kitabı yerine koy"
            style={styles.close}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>
      </View>

      <Text
        variant="titleMedium"
        numberOfLines={2}
        style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.display, paddingVertical: theme.spacing.sm }}
      >
        {link.title?.trim() || source || link.url}
      </Text>

      {rows.map((row) => (
        <View key={row.label} style={[styles.row, { borderTopColor: theme.colors.outlineVariant }]}>
          <Text variant="labelSmall" style={[styles.rowLabel, { color: theme.colors.onSurfaceVariant }]}>
            {upper(row.label)}
          </Text>
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={{
              flex: 1,
              color: row.color ?? theme.colors.onSurface,
              fontFamily: row.color ? theme.fontFamily.semibold : theme.fontFamily.regular,
            }}
          >
            {row.value}
          </Text>
        </View>
      ))}

      <View style={[styles.foot, { marginTop: theme.spacing.xs }]}>
        {stamp ? (
          <View
            style={[
              styles.stamp,
              { borderColor: theme.colors.primary, borderRadius: theme.radius.sm, transform: tilt ? [{ rotate: "-6deg" }] : undefined },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={[styles.stampText, { color: theme.colors.primary, fontFamily: theme.fontFamily.bold }]}>
              {stamp[0]}
            </Text>
            {stamp[1] && (
              <Text style={[styles.stampText, { color: theme.colors.primary, fontFamily: theme.fontFamily.bold }]}>{stamp[1]}</Text>
            )}
          </View>
        ) : (
          <View />
        )}
        <View style={styles.actions}>
          <Button mode="text" icon="pencil-outline" textColor={theme.colors.onSurfaceVariant} onPress={onEdit}>
            Düzenle
          </Button>
          <PrimaryButton compact icon="open-in-new" onPress={onOpen}>
            Aç
          </PrimaryButton>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", maxWidth: 520 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    minHeight: touchTarget,
  },
  headRight: { flexDirection: "row", alignItems: "center" },
  // Full 44pt hit area, pulled toward the card edge so the icon lines up with the text.
  close: { width: touchTarget, height: touchTarget, margin: 0, marginRight: -12 },
  tabular: { fontVariant: ["tabular-nums"], marginRight: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth },
  rowLabel: { width: 72, letterSpacing: 0.6 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stamp: { borderWidth: 2, paddingHorizontal: 7, paddingVertical: 3, alignItems: "center", opacity: 0.85 },
  stampText: { fontSize: 10, lineHeight: 12, letterSpacing: 0.8 },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
});
