import React from "react";
import { Animated, Image, Linking, Share, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Card, IconButton, Text, useTheme } from "react-native-paper";

import { LinkCardProps } from "../types";

export default function LinkCard({
  url,
  title,
  description,
  imageUrl,
  siteName,
  folderName,
  folderColor,
  folderIcon,
  onDelete,
  onEdit,
  onRemind,
  hasReminder,
}: LinkCardProps) {
  const theme = useTheme();

  const handlePress = () => {
    Linking.openURL(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: title ? `${title}\n${url}` : url,
        url: url, // iOS only
      });
    } catch (error) {
      console.error("Error sharing link:", error);
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.deleteActionContainer}>
        <Animated.View
          style={[styles.deleteActionContent, { transform: [{ scale }] }]}
        >
          <IconButton
            icon="delete-outline"
            iconColor="white"
            size={30}
            onPress={onDelete}
          />
          <Text style={{ color: "white", fontWeight: "bold" }}>Delete</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Card style={styles.card} onPress={handlePress}>
        <View style={styles.row}>
          {/* Left Image */}
          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          )}

          {/* Right Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              {/* Left Side: Site Name & Folder Badge (Flex-constrained to avoid pushing icons off-screen) */}
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", marginRight: 8, overflow: "hidden" }}>
                {siteName && (
                  <Text
                    variant="labelSmall"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ color: theme.colors.primary, marginRight: 8, maxWidth: "55%", fontWeight: "600" }}
                  >
                    {siteName.toUpperCase()}
                  </Text>
                )}
                {folderName && (
                  <View style={[styles.folderBadge, { backgroundColor: folderColor || theme.colors.primary, maxWidth: "45%" }]}>
                    <IconButton
                      icon={folderIcon || "folder"}
                      size={10}
                      iconColor="white"
                      style={{ margin: 0, padding: 0, width: 12, height: 12 }}
                    />
                    <Text style={styles.folderBadgeText} numberOfLines={1} ellipsizeMode="tail">
                      {folderName}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right Side: Action Icons (Always visible) */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {onRemind && (
                  <IconButton
                    icon={hasReminder ? "bell" : "bell-outline"}
                    size={20}
                    onPress={onRemind}
                    iconColor={hasReminder ? "#ffb300" : undefined}
                    style={{ margin: 0, marginRight: -8 }}
                  />
                )}
                {onEdit && (
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    onPress={onEdit}
                    style={{ margin: 0, marginRight: -8 }}
                  />
                )}
                <IconButton
                  icon="share-variant"
                  size={20}
                  onPress={handleShare}
                  style={{ margin: 0, marginRight: -8 }}
                />
              </View>
            </View>

            <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
              {title || (siteName ? siteName : "Bağlantı")}
            </Text>

            {description && (
              <Text
                variant="bodySmall"
                numberOfLines={2}
                style={styles.description}
              >
                {description}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    backgroundColor: "white", // Ensure background is white for swipe contrast
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: "#eee",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginTop: -4,
  },
  folderBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    height: 18,
  },
  folderBadgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 2,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    opacity: 0.7,
  },
  deleteActionContainer: {
    backgroundColor: "#dd2c00",
    justifyContent: "center",
    alignItems: "flex-end",
    marginVertical: 8,
    marginRight: 16, // Align with card margin
    borderTopRightRadius: 12, // Match card radius usually
    borderBottomRightRadius: 12,
    width: 100,
  },
  deleteActionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
});
