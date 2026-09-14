import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Dialog, Icon, Text, TextInput } from "react-native-paper";

import { THEME_PRESETS } from "../constants";
import { useAppTheme } from "../hooks/useAppTheme";
import { BioSettingsDialogProps } from "../types";

export default function BioSettingsDialog({
  visible,
  onDismiss,
  profileName,
  setProfileName,
  profileBio,
  setProfileBio,
  profileAvatarUrl,
  setProfileAvatarUrl,
  profileTheme,
  setProfileTheme,
  savingProfile,
  onSave,
}: BioSettingsDialogProps) {
  const theme = useAppTheme();

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={{ borderRadius: theme.radius.lg }}>
      <Dialog.Title>Bio Sayfası Ayarları</Dialog.Title>
      <Dialog.Content>
        <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
          <TextInput
            label="Ad Soyad"
            value={profileName}
            onChangeText={setProfileName}
            mode="outlined"
            style={{ marginBottom: theme.spacing.sm + theme.spacing.xs }}
          />

          <TextInput
            label="Kısa Açıklama (Bio)"
            value={profileBio}
            onChangeText={setProfileBio}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={{ marginBottom: theme.spacing.sm + theme.spacing.xs }}
          />

          <TextInput
            label="Profil Fotoğrafı URL (Avatar)"
            value={profileAvatarUrl}
            onChangeText={setProfileAvatarUrl}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="url"
            style={{ marginBottom: theme.spacing.md }}
          />

          <Text
            variant="labelLarge"
            style={{
              fontFamily: theme.fontFamily.semibold,
              color: theme.colors.onSurface,
            }}
          >
            Uygulama ve bio teması
          </Text>
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: 2,
              marginBottom: theme.spacing.sm,
            }}
          >
            Bir palete dokunarak arayüzde önizle; kaydederek kalıcı hâle getir.
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Renk paletleri"
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginBottom: theme.spacing.sm,
              gap: theme.spacing.sm,
            }}
          >
            {THEME_PRESETS.map((preset) => {
              const selected = profileTheme === preset.id;

              return (
                <Pressable
                  key={preset.id}
                  onPress={() => setProfileTheme(preset.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${preset.name}: ${preset.description}`}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => ({
                    width: "48%",
                    minHeight: 92,
                    padding: theme.spacing.sm + 2,
                    borderRadius: theme.radius.md,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected
                      ? preset.primary
                      : theme.colors.outlineVariant,
                    backgroundColor: preset.background,
                    opacity: pressed ? 0.72 : 1,
                  })}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    {[preset.primary, preset.primaryContainer, preset.surface].map(
                      (color) => (
                        <View
                          key={color}
                          style={{
                            width: 18,
                            height: 18,
                            marginRight: 5,
                            borderRadius: 9,
                            borderWidth: 1,
                            borderColor: preset.border,
                            backgroundColor: color,
                          }}
                        />
                      ),
                    )}
                    {selected && (
                      <View style={{ marginLeft: "auto" }}>
                        <Icon
                          source="check-circle"
                          size={18}
                          color={preset.primary}
                        />
                      </View>
                    )}
                  </View>
                  <Text
                    variant="labelLarge"
                    style={{
                      color: preset.text,
                      fontFamily: theme.fontFamily.semibold,
                    }}
                  >
                    {preset.name}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{ color: preset.mutedText, marginTop: 1 }}
                  >
                    {preset.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} disabled={savingProfile} textColor={theme.colors.onSurfaceVariant}>
          İptal
        </Button>
        <Button
          mode="contained"
          onPress={onSave}
          loading={savingProfile}
          disabled={savingProfile}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
        >
          Kaydet
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
