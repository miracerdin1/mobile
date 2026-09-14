import React from "react";
import { ScrollView, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";

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
}: ClipboardPromptProps) {
  const theme = useAppTheme();

  if (!visible || !clipboardUrl) return null;

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
      </View>
    </View>
  );
}
