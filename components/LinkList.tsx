import React from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import LinkCard from "./LinkCard";
import { Link, Folder, Reminder } from "../types";

interface LinkListProps {
  loading: boolean;
  filteredLinks: Link[];
  folders: Folder[];
  refreshing: boolean;
  onRefresh: () => void;
  handleDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onRemind: (link: Link) => void;
  reminders: Reminder[];
  listStyle?: any;
  centerStyle?: any;
}

export default function LinkList({
  loading,
  filteredLinks,
  folders,
  refreshing,
  onRefresh,
  handleDelete,
  onEdit,
  onRemind,
  reminders,
  listStyle,
  centerStyle,
}: LinkListProps) {
  if (loading && filteredLinks.length === 0) {
    return (
      <View style={centerStyle}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={filteredLinks}
      keyExtractor={(item) => item._id || item.url}
      contentContainerStyle={listStyle}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => {
        const folder = folders.find((f) => f._id === item.folderId);
        return (
          <LinkCard
            url={item.url}
            title={item.title}
            description={item.description}
            imageUrl={item.imageUrl}
            siteName={item.siteName}
            category={item.category}
            folderName={folder?.name}
            folderColor={folder?.color}
            folderIcon={folder?.icon}
            onDelete={() => handleDelete(item._id)}
            onEdit={() => onEdit(item._id)}
            onRemind={() => onRemind(item)}
            hasReminder={reminders.some((r) => r.linkId === item._id)}
          />
        );
      }}
      ListEmptyComponent={
        <View style={centerStyle}>
          <Text variant="bodyLarge">Bağlantı bulunamadı.</Text>
        </View>
      }
    />
  );
}
