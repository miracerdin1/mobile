import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  IconButton,
  Text,
  Chip,
  Button,
} from "react-native-paper";

import { ClipboardPromptProps } from "../types";

export default function ClipboardPrompt({
  visible,
  clipboardUrl,
  clipboardFolderId,
  setClipboardFolderId,
  folders,
  savingClipboard,
  onSave,
  onDismiss,
  theme,
}: ClipboardPromptProps) {
  if (!visible || !clipboardUrl) return null;

  return (
    <View style={styles.clipboardCardContainer}>
      <View style={styles.clipboardCard}>
        <View style={styles.clipboardHeader}>
          <IconButton
            icon="content-copy"
            size={24}
            iconColor={theme.colors.primary}
            style={{ margin: 0 }}
          />
          <Text variant="titleMedium" style={styles.clipboardTitle}>
            Panoda Link Algılandı
          </Text>
        </View>
        <Text
          variant="bodyMedium"
          numberOfLines={1}
          style={styles.clipboardUrlText}
        >
          {clipboardUrl}
        </Text>

        {folders.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text
              variant="labelSmall"
              style={{ marginBottom: 6, fontWeight: "bold", color: "#666" }}
            >
              Klasör Seçin (İsteğe Bağlı):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chip
                selected={clipboardFolderId === null}
                onPress={() => setClipboardFolderId(null)}
                style={{
                  marginRight: 6,
                  height: 32,
                  backgroundColor:
                    clipboardFolderId === null
                      ? theme.colors.primaryContainer
                      : "#f5f5f5",
                }}
                textStyle={{
                  fontSize: 11,
                  color:
                    clipboardFolderId === null
                      ? theme.colors.onPrimaryContainer
                      : "#666",
                }}
                showSelectedOverlay
                compact
              >
                Yok
              </Chip>
              {folders.map((f) => (
                <Chip
                  key={f._id}
                  selected={clipboardFolderId === f._id}
                  onPress={() => setClipboardFolderId(f._id)}
                  style={{
                    marginRight: 6,
                    height: 32,
                    backgroundColor:
                      clipboardFolderId === f._id ? f.color : "#f5f5f5",
                    borderColor: f.color,
                    borderWidth: clipboardFolderId === f._id ? 0 : 1,
                  }}
                  textStyle={{
                    color: clipboardFolderId === f._id ? "#fff" : "#333",
                    fontWeight:
                      clipboardFolderId === f._id ? "bold" : "normal",
                    fontSize: 11,
                  }}
                  showSelectedOverlay
                  compact
                  icon={f.icon || "folder"}
                >
                  {f.name}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.clipboardActions}>
          <Button
            mode="text"
            onPress={onDismiss}
            disabled={savingClipboard}
          >
            İptal
          </Button>
          <Button
            mode="contained"
            onPress={onSave}
            loading={savingClipboard}
            disabled={savingClipboard}
            style={{ marginLeft: 8 }}
          >
            Kaydet
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clipboardCardContainer: {
    position: "absolute",
    bottom: 90,
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 100,
  },
  clipboardCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  clipboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  clipboardTitle: {
    fontWeight: "bold",
    marginLeft: 8,
  },
  clipboardUrlText: {
    color: "#666",
    marginBottom: 16,
  },
  clipboardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
