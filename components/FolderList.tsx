import React from "react";
import { View, ScrollView } from "react-native";
import { Text, Chip, Button } from "react-native-paper";
import { Folder, User } from "../types";

interface FolderListProps {
  folders: Folder[];
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  onManageFolders: () => void;
  onCreateFolder: () => void;
  currentUser: User | null;
  theme: any;
}

export default function FolderList({
  folders,
  selectedFolderId,
  setSelectedFolderId,
  onManageFolders,
  onCreateFolder,
  currentUser,
  theme,
}: FolderListProps) {
  return (
    <View
      style={{
        backgroundColor: "white",
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 4,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          variant="titleMedium"
          style={{ fontWeight: "bold", color: "#333" }}
        >
          Klasörler
        </Text>
        <Button
          icon="folder-edit-outline"
          compact
          mode="text"
          onPress={onManageFolders}
        >
          Yönet
        </Button>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <Chip
          selected={selectedFolderId === null}
          onPress={() => setSelectedFolderId(null)}
          style={{
            marginRight: 8,
            backgroundColor:
              selectedFolderId === null
                ? theme.colors.primaryContainer
                : "#f5f5f5",
          }}
          textStyle={{
            color:
              selectedFolderId === null
                ? theme.colors.onPrimaryContainer
                : "#666",
          }}
          showSelectedOverlay
          icon="folder-open"
        >
          Tümü
        </Chip>
        {folders.map((folder) => {
          const isCollaborated =
            folder.owner && folder.owner._id !== currentUser?.id;
          const isShared =
            folder.collaborators && folder.collaborators.length > 0;
          const chipIcon =
            isCollaborated || isShared
              ? "account-multiple"
              : folder.isPublic
                ? "earth"
                : folder.icon || "folder";

          return (
            <Chip
              key={folder._id}
              selected={selectedFolderId === folder._id}
              onPress={() => setSelectedFolderId(folder._id)}
              style={{
                marginRight: 8,
                backgroundColor:
                  selectedFolderId === folder._id ? folder.color : "#f5f5f5",
                borderColor: folder.color,
                borderWidth: selectedFolderId === folder._id ? 0 : 1,
              }}
              textStyle={{
                color: selectedFolderId === folder._id ? "#fff" : "#333",
                fontWeight:
                  selectedFolderId === folder._id ? "bold" : "normal",
              }}
              showSelectedOverlay
              icon={chipIcon}
            >
              {folder.name}
            </Chip>
          );
        })}
        <Chip
          onPress={onCreateFolder}
          style={{ backgroundColor: "#f0f0f0" }}
          icon="plus"
        >
          Yeni Ekle
        </Chip>
      </ScrollView>
    </View>
  );
}
