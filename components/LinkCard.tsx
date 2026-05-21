import React from "react";
import { Animated, Image, Linking, Share, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Card, IconButton, Text, useTheme } from "react-native-paper";

interface LinkCardProps {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  category?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function LinkCard({
  url,
  title,
  description,
  imageUrl,
  siteName,
  onDelete,
  onEdit,
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
              {siteName && (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.primary }}
                >
                  {siteName.toUpperCase()}
                </Text>
              )}
              <View style={{ flex: 1 }} />
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

            <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
              {title || url}
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
  },
  image: {
    width: 100,
    height: "100%",
    resizeMode: "cover",
    backgroundColor: "#eee",
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginTop: -4,
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
