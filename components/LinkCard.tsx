import React, { useEffect } from "react";
import { Animated, Image, Linking, Share, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Card, Icon, IconButton, Text } from "react-native-paper";
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { CATEGORY_LABELS } from "../constants";
import { useAppTheme } from "../hooks/useAppTheme";
import { usePressAnimation } from "../hooks/usePressAnimation";
import StaggerIn from "./StaggerIn";
import { LinkCardProps } from "../types";
import { showAlert } from "../utils/alert";
import { formatMetaDate } from "../utils/date";
import { normalizeHttpUrl } from "../utils/url";

export default function LinkCard({
  url,
  title,
  description,
  imageUrl,
  siteName,
  category,
  folderName,
  folderColor,
  folderIcon,
  createdAt,
  isBroken,
  onDelete,
  onEdit,
  onRemind,
  hasReminder,
  layout = "list",
  index = 0,
  highlight = false,
  onOpened,
}: LinkCardProps) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();

  // A just-saved link glows in the brand tint, then fades back to normal.
  const glow = useSharedValue(0);
  useEffect(() => {
    if (!highlight) return;
    glow.value = reduceMotion
      ? withSequence(withTiming(0.6, { duration: 0 }), withTiming(0, { duration: 2200 }))
      : withSequence(
          withTiming(0.75, { duration: theme.motion.base }),
          withTiming(0, { duration: 2200, easing: Easing.out(Easing.quad) }),
        );
  }, [glow, highlight, reduceMotion, theme.motion.base]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const { animatedStyle, pressHandlers, hoverHandlers } = usePressAnimation({
    // Cards are large, so they need a gentler squeeze than a button does.
    pressScale: 0.985,
    hoverScale: 1.012,
  });
  const metaDate = formatMetaDate(createdAt);
  const isGrid = layout === "grid";
  const safeUrl = normalizeHttpUrl(url);

  const handlePress = () => {
    if (!safeUrl) {
      showAlert("Geçersiz bağlantı", "Bu bağlantı güvenli bir şekilde açılamıyor.");
      return;
    }

    Linking.openURL(safeUrl)
      .then(() => onOpened?.())
      .catch(() => showAlert("Hata", "Bağlantı açılamadı."));
  };

  const handleShare = async () => {
    if (!safeUrl) {
      showAlert("Geçersiz bağlantı", "Bu bağlantı güvenli bir şekilde paylaşılamıyor.");
      return;
    }

    try {
      await Share.share({
        message: title ? `${title}\n${safeUrl}` : safeUrl,
        url: safeUrl,
      });
    } catch (error) {
      console.error("Error sharing link:", error);
    }
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <View
        style={{
          backgroundColor: theme.colors.error,
          justifyContent: "center",
          alignItems: "center",
          marginVertical: isGrid ? 0 : theme.spacing.sm,
          marginRight: isGrid ? 0 : theme.spacing.md,
          borderTopRightRadius: theme.radius.md,
          borderBottomRightRadius: theme.radius.md,
          width: 84,
        }}
      >
        <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
          <IconButton
            icon="delete-outline"
            iconColor={theme.colors.onError}
            size={26}
            onPress={onDelete}
            accessibilityLabel="Bağlantıyı sil"
            style={{ margin: 0 }}
          />
          <Text style={{ color: theme.colors.onError, fontFamily: theme.fontFamily.semibold, fontSize: 12, marginTop: -4 }}>
            Sil
          </Text>
        </Animated.View>
      </View>
    );
  };

  const actionIcons = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      {onRemind && (
        <IconButton
          icon={hasReminder ? "bell" : "bell-outline"}
          size={18}
          onPress={onRemind}
          iconColor={hasReminder ? theme.app.warning : theme.colors.onSurfaceVariant}
          accessibilityLabel={hasReminder ? "Hatırlatıcı kuruldu" : "Hatırlatıcı ekle"}
          style={{ margin: 0, width: 40, height: 40 }}
        />
      )}
      {onEdit && (
        <IconButton
          icon="pencil-outline"
          size={18}
          onPress={onEdit}
          iconColor={theme.colors.onSurfaceVariant}
          accessibilityLabel="Düzenle"
          style={{ margin: 0, width: 40, height: 40 }}
        />
      )}
      <IconButton
        icon="share-variant-outline"
        size={18}
        onPress={handleShare}
        iconColor={theme.colors.onSurfaceVariant}
        accessibilityLabel="Paylaş"
        style={{ margin: 0, width: 40, height: 40 }}
      />
    </View>
  );

  const brokenBadge = isBroken && (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: theme.colors.errorContainer,
        borderRadius: theme.radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 1,
        marginBottom: theme.spacing.xs,
      }}
    >
      <Icon source="link-off" size={12} color={theme.colors.onErrorContainer} />
      <Text style={{ color: theme.colors.onErrorContainer, fontSize: 10, fontFamily: theme.fontFamily.semibold, marginLeft: 2 }}>
        Erişilemiyor
      </Text>
    </View>
  );

  const metaRow = (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: theme.spacing.xs, flexWrap: "wrap" }}>
      {!!siteName && (
        <Text variant="labelSmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
          {siteName}
        </Text>
      )}
      {!!siteName && !!metaDate && (
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 4 }}>
          ·
        </Text>
      )}
      {!!metaDate && (
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {metaDate}
        </Text>
      )}
      {!!folderName && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginLeft: theme.spacing.sm,
            maxWidth: "55%",
            borderWidth: 1,
            borderColor: folderColor || theme.colors.primary,
            borderRadius: theme.radius.sm,
            paddingHorizontal: 6,
            paddingVertical: 1,
          }}
        >
          {folderIcon && (
            <Icon source={folderIcon} size={10} color={folderColor || theme.colors.primary} />
          )}
          <Text
            variant="labelSmall"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              color: folderColor || theme.colors.primary,
              fontFamily: theme.fontFamily.semibold,
              fontSize: 10,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              marginLeft: folderIcon ? 3 : 0,
            }}
          >
            {folderName}
          </Text>
        </View>
      )}
      {!folderName && category && category !== "All" && (
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.primary,
            marginLeft: theme.spacing.sm,
            fontFamily: theme.fontFamily.semibold,
          }}
        >
          {CATEGORY_LABELS[category] ?? category}
        </Text>
      )}
    </View>
  );

  const thumbnail = (size: number) =>
    imageUrl ? (
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.app.imagePlaceholder,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
        }}
        resizeMode="cover"
      />
    ) : (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.app.imagePlaceholder,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconButton icon="link-variant" size={size > 100 ? 28 : 20} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
      </View>
    );

  const spineColor = folderColor || theme.colors.primary;
  const cardStyle = isGrid
    ? {
        flex: 1,
        margin: theme.spacing.xs,
        overflow: "hidden" as const,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        borderTopWidth: 3,
        borderTopColor: spineColor,
        borderRadius: theme.radius.lg,
      }
    : {
        marginHorizontal: theme.spacing.md,
        marginVertical: 6,
        overflow: "hidden" as const,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        borderLeftWidth: 3,
        borderLeftColor: spineColor,
        borderRadius: theme.radius.lg,
      };

  return (
    <StaggerIn index={index} style={isGrid ? { flex: 1 } : undefined}>
      <Swipeable renderRightActions={renderRightActions}>
        <Reanimated.View style={animatedStyle} {...hoverHandlers}>
          <Card
            mode="contained"
            style={cardStyle}
            onPress={handlePress}
            {...pressHandlers}
            accessibilityRole="link"
            accessibilityLabel={title || siteName || url}
          >
            {isGrid ? (
              <View>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={{
                      width: "100%",
                      aspectRatio: 1.5,
                      backgroundColor: theme.app.imagePlaceholder,
                      borderWidth: 1,
                      borderColor: theme.colors.outlineVariant,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      aspectRatio: 1.5,
                      backgroundColor: theme.app.imagePlaceholder,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconButton icon="link-variant" size={28} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
                  </View>
                )}
                <View style={{ padding: theme.spacing.sm + 2 }}>
                  {brokenBadge}
                  <Text
                    variant="labelLarge"
                    numberOfLines={2}
                    style={{
                      fontFamily: theme.fontFamily.display,
                      color: theme.colors.onSurface,
                      fontSize: 16,
                      lineHeight: 21,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    {title || (siteName ? siteName : "Bağlantı")}
                  </Text>
                  {metaRow}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      marginTop: theme.spacing.xs,
                      marginRight: -6,
                      marginBottom: -6,
                    }}
                  >
                    {actionIcons}
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: "row", padding: theme.spacing.sm + theme.spacing.xs }}>
                {thumbnail(68)}
                <View style={{ flex: 1, marginLeft: theme.spacing.sm + theme.spacing.xs }}>
                  <Text
                    variant="titleMedium"
                    numberOfLines={2}
                    style={{
                      fontFamily: theme.fontFamily.display,
                      color: theme.colors.onSurface,
                      fontSize: 17,
                      lineHeight: 22,
                    }}
                  >
                    {title || (siteName ? siteName : "Bağlantı")}
                  </Text>

                  {isBroken && <View style={{ marginTop: theme.spacing.xs }}>{brokenBadge}</View>}

                  {!!description && (
                    <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginTop: 2, marginBottom: theme.spacing.xs }}>
                      {description}
                    </Text>
                  )}

                  {metaRow}
                  <View style={{ marginTop: 2, marginRight: -6, marginBottom: -6 }}>
                    {actionIcons}
                  </View>
                </View>
              </View>
            )}
            <Reanimated.View
              pointerEvents="none"
              style={[
                { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.primaryContainer },
                glowStyle,
              ]}
            />
          </Card>
        </Reanimated.View>
      </Swipeable>
    </StaggerIn>
  );
}
