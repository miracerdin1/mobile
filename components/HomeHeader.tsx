import React from "react";
import { View } from "react-native";
import { Searchbar, IconButton } from "react-native-paper";

interface HomeHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClipboardPress: () => void;
}

export default function HomeHeader({
  searchQuery,
  setSearchQuery,
  onClipboardPress,
}: HomeHeaderProps) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
        backgroundColor: "white",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Searchbar
        placeholder="Search links..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={{ flex: 1, marginRight: 8 }}
      />
      <IconButton
        icon="content-paste"
        mode="contained"
        containerColor="#6200ee"
        iconColor="white"
        size={24}
        onPress={onClipboardPress}
        style={{ margin: 0 }}
      />
    </View>
  );
}
