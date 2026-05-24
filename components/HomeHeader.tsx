import React from "react";
import { View } from "react-native";
import { Searchbar } from "react-native-paper";

interface HomeHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function HomeHeader({
  searchQuery,
  setSearchQuery,
}: HomeHeaderProps) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
        backgroundColor: "white",
      }}
    >
      <Searchbar
        placeholder="Search links..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={{ marginBottom: 4 }}
      />
    </View>
  );
}
