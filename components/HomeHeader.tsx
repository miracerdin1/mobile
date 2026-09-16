import React from "react";
import { View } from "react-native";
import { IconButton, Searchbar, Text } from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import type { HomeHeaderProps } from "../types/componentProps";
import StaggerIn from "./StaggerIn";

export default function HomeHeader({
  searchQuery,
  setSearchQuery,
  onClipboardPress,
  totalCount,
  visibleCount,
  activeCollectionName,
}: HomeHeaderProps) {
  const theme = useAppTheme();
  const resultSummary =
    visibleCount === totalCount
      ? `${totalCount} bağlantı arşivlendi`
      : `${totalCount} bağlantıdan ${visibleCount} tanesi gösteriliyor`;

  return (
    <View
      style={{
        // Transparent so AmbientBackground's drifting wash shows through here.
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
      }}
    >
      <View style={{ width: "100%", maxWidth: 960, alignSelf: "center" }}>
        <StaggerIn index={0}>
          <Text
            variant="labelMedium"
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fontFamily.bold,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {activeCollectionName ?? "Kişisel arşiv"}
          </Text>
        </StaggerIn>
        <StaggerIn index={1}>
          <Text
            variant="headlineMedium"
            style={{
              color: theme.colors.onBackground,
              fontFamily: theme.fontFamily.displayBold,
              letterSpacing: -0.6,
              marginTop: 2,
            }}
          >
            Kaydettiklerin, tam burada.
          </Text>
        </StaggerIn>
        <StaggerIn index={2}>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.xs,
              fontVariant: ["tabular-nums"],
            }}
          >
            {resultSummary}
          </Text>
        </StaggerIn>

        <StaggerIn
          index={3}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: theme.spacing.md,
          }}
        >
          <Searchbar
            placeholder="Başlık, site veya bağlantı ara"
            onChangeText={setSearchQuery}
            value={searchQuery}
            mode="bar"
            elevation={0}
            style={{
              flex: 1,
              height: 52,
              marginRight: theme.spacing.sm,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: searchQuery
                ? theme.colors.primary
                : theme.colors.outlineVariant,
              borderRadius: theme.radius.md,
            }}
            inputStyle={{
              fontFamily: theme.fontFamily.regular,
              minHeight: 0,
              color: theme.colors.onSurface,
            }}
            iconColor={theme.colors.onSurfaceVariant}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            accessibilityLabel="Bağlantılarda ara"
            role="searchbox"
            nativeID="link-search"
          />
          <IconButton
            icon="clipboard-text-outline"
            mode="contained"
            containerColor={theme.colors.primary}
            iconColor={theme.colors.onPrimary}
            size={22}
            onPress={onClipboardPress}
            accessibilityLabel="Panodaki bağlantıyı kaydet"
            style={{
              margin: 0,
              width: 52,
              height: 52,
              borderRadius: theme.radius.md,
            }}
          />
        </StaggerIn>
      </View>
    </View>
  );
}
