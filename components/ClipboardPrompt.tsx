import React from "react";
import { Image, ScrollView, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";

import { CATEGORY_LABELS } from "../constants";
import { useAppTheme } from "../hooks/useAppTheme";
import type { ClipboardPromptProps } from "../types/componentProps";
import FolderChip from "./FolderChip";
import PrimaryButton from "./PrimaryButton";

export default function ClipboardPrompt({
  visible,
  clipboardUrl,
  clipboardFolderId,
  setClipboardFolderId,
  folders,
  savingClipboard,
  onSave,
  onDismiss,
  savedLink,
  cardRef,
}: ClipboardPromptProps) {
  const theme = useAppTheme();

  if (!visible || (!clipboardUrl && !savedLink)) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: 90,
        left: theme.spacing.md,
        right: theme.spacing.md,
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <View
        ref={cardRef}
        collapsable={false}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
          padding: theme.spacing.md,
          width: "100%",
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {savedLink ? (
          // Saved: the card becomes the link itself, ready to fly to its tab.
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm + 4 }}>
            {savedLink.imageUrl ? (
              <Image
                source={{ uri: savedLink.imageUrl }}
                style={{ width: 72, height: 52, borderRadius: theme.radius.sm, backgroundColor: theme.app.imagePlaceholder }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 72,
                  height: 52,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.app.imagePlaceholder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconButton icon="link-variant" size={20} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" numberOfLines={2} style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.display }}>
                {savedLink.title?.trim() || savedLink.siteName || savedLink.url}
              </Text>
              <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                {[CATEGORY_LABELS[savedLink.category ?? ""] ?? savedLink.category, savedLink.siteName].filter(Boolean).join(", ")}
              </Text>
            </View>
          </View>
        ) : (
          <>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.sm }}>
            <IconButton
              icon="content-copy"
              size={22}
              iconColor={theme.colors.primary}
              style={{ margin: 0 }}
            />
            <Text
              variant="titleMedium"
              style={{ fontFamily: theme.fontFamily.semibold, marginLeft: theme.spacing.sm, color: theme.colors.onSurface }}
            >
              Panoda Link Algılandı
            </Text>
          </View>
          <Text
            variant="bodyMedium"
            numberOfLines={1}
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.md }}
          >
            {clipboardUrl}
          </Text>

          {folders.length > 0 && (
            <View style={{ marginBottom: theme.spacing.md }}>
              <Text
                variant="labelSmall"
                style={{ marginBottom: theme.spacing.xs + 2, fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurfaceVariant }}
              >
                Klasör Seçin (İsteğe Bağlı):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <FolderChip
                  label="Yok"
                  icon="folder-off-outline"
                  compact
                  selected={clipboardFolderId === null}
                  onPress={() => setClipboardFolderId(null)}
                />
                {folders.map((f) => (
                  <FolderChip
                    key={f._id}
                    label={f.name}
                    icon={f.icon || "folder"}
                    color={f.color}
                    compact
                    selected={clipboardFolderId === f._id}
                    onPress={() => setClipboardFolderId(f._id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
            <Button
              mode="text"
              onPress={onDismiss}
              disabled={savingClipboard}
              textColor={theme.colors.onSurfaceVariant}
              labelStyle={{ fontFamily: theme.fontFamily.medium }}
            >
              İptal
            </Button>
            <PrimaryButton onPress={onSave} loading={savingClipboard} disabled={savingClipboard} compact style={{ marginLeft: theme.spacing.sm }}>
              Kaydet
            </PrimaryButton>
          </View>
          </>
        )}
      </View>
    </View>
  );
}
