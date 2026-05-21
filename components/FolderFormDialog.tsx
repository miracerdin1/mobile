import React from "react";
import { ScrollView, View } from "react-native";
import {
  Dialog,
  TextInput,
  Text,
  Switch,
  IconButton,
  Button,
} from "react-native-paper";
import { FOLDER_COLORS, FOLDER_ICONS } from "../constants";
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
  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>
        {editingFolder ? "Klasörü Düzenle" : "Yeni Klasör Ekle"}
      </Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Klasör Adı"
          value={folderName}
          onChangeText={setFolderName}
          mode="outlined"
          style={{ marginBottom: 16 }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text variant="labelLarge" style={{ fontWeight: "bold" }}>
              🌐 Herkese Açık Yap
            </Text>
            <Text variant="bodySmall" style={{ color: "#666" }}>
              Bu seçeneği açarak klasörünüzü ve içindeki linkleri Bio sayfanızda
              herkesle paylaşabilirsiniz.
            </Text>
          </View>
          <Switch
            value={folderIsPublic}
            onValueChange={setFolderIsPublic}
            color={folderColor}
          />
        </View>

        <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: "bold" }}>
          Renk Seçin
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: 16,
            justifyContent: "space-between",
          }}
        >
          {FOLDER_COLORS.map((c) => (
            <View
              key={c}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: c,
                margin: 4,
                borderWidth: folderColor === c ? 3 : 0,
                borderColor: "#333",
              }}
              onTouchEnd={() => setFolderColor(c)}
            />
          ))}
        </View>

        <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: "bold" }}>
          İkon Seçin
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
        >
          {FOLDER_ICONS.map((i) => (
            <IconButton
              key={i}
              icon={i}
              size={24}
              selected={folderIcon === i}
              onPress={() => setFolderIcon(i)}
              iconColor={folderIcon === i ? "white" : "#666"}
              style={{
                backgroundColor: folderIcon === i ? folderColor : "#f0f0f0",
                marginRight: 8,
              }}
            />
          ))}
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>İptal</Button>
        <Button mode="contained" onPress={onSave}>
          Kaydet
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
