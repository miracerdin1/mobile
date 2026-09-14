import React from "react";
import { ScrollView, View } from "react-native";
import { Button, Chip, Text } from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import type { FolderListProps } from "../types/componentProps";
import FolderChip from "./FolderChip";

export default function FolderList({
  folders,
  selectedFolderId,
  setSelectedFolderId,
  onManageFolders,
  onCreateFolder,
  currentUser,
}: FolderListProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 960,
          alignSelf: "center",
        }}
      >
        <View
          style={{
            paddingHorizontal: theme.spacing.md,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              variant="titleSmall"
              style={{
                color: theme.colors.onSurface,
                fontFamily: theme.fontFamily.semibold,
              }}
            >
              Koleksiyonlar
            </Text>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}
            >
              {folders.length === 0
                ? "İlk klasörünü oluştur"
                : `${folders.length} klasör`}
            </Text>
          </View>
          <Button
            icon="folder-edit-outline"
            compact
            mode="text"
            textColor={theme.colors.primary}
            onPress={onManageFolders}
            contentStyle={{ minHeight: 40 }}
          >
            Düzenle
          </Button>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.md,
            paddingTop: theme.spacing.sm,
          }}
        >
          <FolderChip
            label="Tümü"
            icon="archive-outline"
            selected={selectedFolderId === null}
            onPress={() => setSelectedFolderId(null)}
          />
          {folders.map((folder) => {
            const isCollaborated =
              folder.owner && folder.owner._id !== currentUser?.id;
            const isShared =
              folder.collaborators && folder.collaborators.length > 0;
            const chipIcon =
              isCollaborated || isShared
                ? "account-multiple-outline"
                : folder.isPublic
                  ? "earth"
                  : folder.icon || "folder-outline";

            return (
              <FolderChip
                key={folder._id}
                label={folder.name}
                icon={chipIcon}
                color={folder.color}
                selected={selectedFolderId === folder._id}
                onPress={() => setSelectedFolderId(folder._id)}
              />
            );
          })}
          <Chip
            onPress={onCreateFolder}
            icon="plus"
            mode="outlined"
            style={{
              backgroundColor: "transparent",
              borderColor: theme.colors.outline,
              borderStyle: "dashed",
              borderRadius: theme.radius.sm,
              minHeight: 40,
            }}
            textStyle={{
              color: theme.colors.onSurfaceVariant,
              fontFamily: theme.fontFamily.medium,
              fontSize: 13,
            }}
          >
            Yeni klasör
          </Chip>
        </ScrollView>
      </View>
    </View>
  );
}
