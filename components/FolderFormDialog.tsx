import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Dialog, IconButton, Switch, Text, TextInput } from "react-native-paper";

import { FOLDER_COLORS, FOLDER_ICONS } from "../constants";
import { useAppTheme } from "../hooks/useAppTheme";
import { FolderFormDialogProps } from "../types";

export default function FolderFormDialog({
  visible,
  onDismiss,
  editingFolder,
  folderName,
  setFolderName,
  folderColor,
  setFolderColor,
  folderIcon,
  setFolderIcon,
  folderIsPublic,
  setFolderIsPublic,
  onSave,
}: FolderFormDialogProps) {
  const theme = useAppTheme();

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={{ borderRadius: theme.radius.lg }}>
      <Dialog.Title>
        {editingFolder ? "Klasörü Düzenle" : "Yeni Klasör Ekle"}
      </Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Klasör Adı"
          value={folderName}
          onChangeText={setFolderName}
          mode="outlined"
          outlineColor={theme.colors.outlineVariant}
          activeOutlineColor={theme.colors.primary}
          style={{ marginBottom: theme.spacing.md }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: theme.spacing.md,
          }}
        >
          <IconButton
            icon="earth"
            size={20}
            iconColor={theme.colors.onSurfaceVariant}
            style={{ margin: 0, marginRight: theme.spacing.xs }}
          />
          <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <Text variant="labelLarge" style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}>
              Herkese Açık Yap
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Bu seçeneği açarak klasörünüzü ve içindeki linkleri Bio sayfanızda
              herkesle paylaşabilirsiniz.
            </Text>
          </View>
          <Switch
            value={folderIsPublic}
            onValueChange={setFolderIsPublic}
            color={folderColor || theme.colors.primary}
          />
        </View>

        <Text variant="labelLarge" style={{ marginBottom: theme.spacing.sm, fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}>
          Renk Seçin
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: theme.spacing.md,
          }}
        >
          {FOLDER_COLORS.map((c) => {
            const selected = folderColor === c;
            return (
              <Pressable
                key={c}
                onPress={() => setFolderColor(c)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Renk ${c}`}
                hitSlop={8}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: theme.radius.full,
                    backgroundColor: c,
                    borderWidth: selected ? 3 : 0,
                    borderColor: theme.colors.onSurface,
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        <Text variant="labelLarge" style={{ marginBottom: theme.spacing.sm, fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}>
          İkon Seçin
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: theme.spacing.sm }}
        >
          {FOLDER_ICONS.map((i) => {
            const selected = folderIcon === i;
            return (
              <IconButton
                key={i}
                icon={i}
                size={24}
                selected={selected}
                onPress={() => setFolderIcon(i)}
                accessibilityLabel={`İkon ${i}`}
                iconColor={selected ? theme.app.onFolderColor : theme.colors.onSurfaceVariant}
                style={{
                  backgroundColor: selected ? folderColor || theme.colors.primary : theme.colors.surfaceVariant,
                  marginRight: theme.spacing.sm,
                }}
              />
            );
          })}
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={theme.colors.onSurfaceVariant}>
          İptal
        </Button>
        <Button
          mode="contained"
          onPress={onSave}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
        >
          Kaydet
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
