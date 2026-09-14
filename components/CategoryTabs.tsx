import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { IconButton, Text } from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import type { CategoryTabsProps } from "../types/componentProps";

const CATEGORY_LABELS: Record<string, string> = {
  All: "Tümü",
  Video: "Video",
  Article: "Makale",
  Product: "Ürün",
  Social: "Sosyal",
  Other: "Diğer",
};

export default function CategoryTabs({
  categories,
  selectedCategory,
  setSelectedCategory,
  onManageCategories,
  viewMode,
  onToggleViewMode,
}: CategoryTabsProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 960,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <ScrollView
          horizontal
          accessibilityRole="tablist"
          accessibilityLabel="Bağlantı kategorileri"
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
        >
          {categories.map((category) => {
            const selected = selectedCategory === category;

            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={({ pressed }) => ({
                  minHeight: 46,
                  justifyContent: "center",
                  marginRight: theme.spacing.lg,
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Text
                  variant="labelLarge"
                  style={{
                    color: selected
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant,
                    fontFamily: selected
                      ? theme.fontFamily.semibold
                      : theme.fontFamily.medium,
                  }}
                >
                  {CATEGORY_LABELS[category] ?? category}
                </Text>
                <View
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    left: 0,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: selected
                      ? theme.colors.primary
                      : "transparent",
                  }}
                />
              </Pressable>
            );
          })}
        </ScrollView>
        <View
          style={{
            flexDirection: "row",
            marginRight: theme.spacing.sm,
            borderLeftWidth: 1,
            borderLeftColor: theme.colors.outlineVariant,
            paddingLeft: theme.spacing.xs,
          }}
        >
          <IconButton
            icon={viewMode === "grid" ? "view-list-outline" : "view-grid-outline"}
            size={21}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={onToggleViewMode}
            accessibilityLabel={
              viewMode === "grid"
                ? "Liste görünümüne geç"
                : "Izgara görünümüne geç"
            }
            style={{ margin: 0, width: 44, height: 44 }}
          />
          <IconButton
            icon="tune-variant"
            size={21}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={onManageCategories}
            accessibilityLabel="Kategorileri sırala"
            style={{ margin: 0, width: 44, height: 44 }}
          />
        </View>
      </View>
    </View>
  );
}
