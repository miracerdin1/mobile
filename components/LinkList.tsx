import React, { useMemo } from "react";
import { RefreshControl, View } from "react-native";
import { ActivityIndicator, IconButton, Text } from "react-native-paper";
import Animated, { LinearTransition, useReducedMotion } from "react-native-reanimated";

import { useAppTheme } from "../hooks/useAppTheme";
import { useJustSaved } from "../hooks/useJustSaved";
import type { LinkListProps } from "../types/componentProps";
import LinkCard from "./LinkCard";
import PrimaryButton from "./PrimaryButton";
import StaggerIn from "./StaggerIn";

export default function LinkList({
  header,
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
  isAuthenticated = true,
  onSignIn,
  viewMode = "list",
  hasActiveFilters = false,
  onClearFilters,
  onOpened,
}: LinkListProps) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const isGrid = viewMode === "grid";
  const justSaved = useJustSaved();
  const foldersById = useMemo(
    () => new Map(folders.map((folder) => [folder._id, folder])),
    [folders],
  );

  const showLoadingSpinner = loading && filteredLinks.length === 0;

  return (
    <Animated.FlatList
      // FlatList doesn't support changing numColumns on the fly — remounting
      // via `key` is the documented workaround.
      key={viewMode}
      style={{ flex: 1 }}
      // The header (title, search, category/folder tabs) scrolls away with
      // the list instead of pinning above it — on a short viewport (a phone
      // in landscape) a fixed header left almost no room for the list.
      ListHeaderComponent={header}
      data={filteredLinks}
      // Re-render rows when a save starts or ends their highlight.
      extraData={justSaved}
      keyExtractor={(item) => item._id || item.url}
      numColumns={isGrid ? 2 : 1}
      // Reanimated's item layout animation only supports single-column lists,
      // so grid mode reorders instantly.
      itemLayoutAnimation={isGrid || reduceMotion ? undefined : LinearTransition}
      initialNumToRender={10}
      windowSize={7}
      columnWrapperStyle={isGrid ? { paddingHorizontal: theme.spacing.sm } : undefined}
      contentContainerStyle={listStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      renderItem={({ item, index }) => {
        const folder = item.folderId ? foldersById.get(item.folderId) : undefined;
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
            createdAt={item.createdAt}
            isBroken={item.isBroken}
            onDelete={() => handleDelete(item._id)}
            onEdit={() => onEdit(item._id)}
            onRemind={() => onRemind(item)}
            hasReminder={reminders.some((r) => r.linkId === item._id)}
            layout={viewMode}
            index={index}
            highlight={justSaved?.id === item._id}
            onOpened={onOpened ? () => onOpened(item) : undefined}
          />
        );
      }}
      ListEmptyComponent={
        showLoadingSpinner ? (
          <View style={centerStyle}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <StaggerIn style={[centerStyle, { paddingHorizontal: theme.spacing.xl }]}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.primaryContainer,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: theme.spacing.md,
              }}
            >
              <IconButton
                icon={
                  !isAuthenticated
                    ? "account-circle-outline"
                    : hasActiveFilters
                      ? "filter-variant-remove"
                      : "bookmark-plus-outline"
                }
                size={28}
                iconColor={theme.colors.onPrimaryContainer}
                style={{ margin: 0 }}
              />
            </View>
            <Text
              variant="titleMedium"
              style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface, marginBottom: theme.spacing.xs, textAlign: "center" }}
            >
              {!isAuthenticated
                ? "Arşivini görmek için giriş yap"
                : hasActiveFilters
                  ? "Bu filtrelerle sonuç bulunamadı"
                  : "İlk bağlantını arşivle"}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: "center", marginBottom: isAuthenticated ? 0 : theme.spacing.md }}
            >
              {!isAuthenticated
                ? "Kaydettiğin bağlantılar ve koleksiyonlar hesabınla birlikte her cihazda seni bekler."
                : hasActiveFilters
                  ? "Arama ifadesini değiştir veya tüm bağlantılarını yeniden görmek için filtreleri temizle."
                  : "Panondaki bağlantıyı tek dokunuşla kaydet veya + düğmesiyle ayrıntıları kendin ekle."}
            </Text>
            {isAuthenticated && hasActiveFilters && onClearFilters && (
              <PrimaryButton
                onPress={onClearFilters}
                icon="filter-variant-remove"
                compact
                style={{ marginTop: theme.spacing.md }}
              >
                Filtreleri temizle
              </PrimaryButton>
            )}
            {!isAuthenticated && onSignIn && (
              <PrimaryButton onPress={onSignIn} icon="login">
                Giriş Yap
              </PrimaryButton>
            )}
          </StaggerIn>
        )
      }
    />
  );
}
