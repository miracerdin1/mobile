import React from "react";
import { View, ScrollView } from "react-native";
import { Chip, IconButton } from "react-native-paper";

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onManageCategories: () => void;
}

export default function CategoryTabs({
  categories,
  selectedCategory,
  setSelectedCategory,
  onManageCategories,
}: CategoryTabsProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        paddingBottom: 8,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {categories.map((cat) => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
            style={{ marginRight: 8 }}
            showSelectedOverlay
          >
            {cat}
          </Chip>
        ))}
      </ScrollView>
      <IconButton
        icon="swap-vertical"
        size={24}
        onPress={onManageCategories}
      />
    </View>
  );
}
