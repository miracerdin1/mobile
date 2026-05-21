import React from "react";
import { ScrollView, View } from "react-native";
import {
  Dialog,
  TextInput,
  Text,
  Chip,
  Button,
} from "react-native-paper";

import { THEME_PRESETS } from "../constants";
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
  theme,
}: BioSettingsDialogProps) {
  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Bio Sayfası Ayarları</Dialog.Title>
      <Dialog.Content>
        <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
          <TextInput
            label="Ad Soyad"
            value={profileName}
            onChangeText={setProfileName}
            mode="outlined"
            style={{ marginBottom: 12 }}
          />

          <TextInput
            label="Kısa Açıklama (Bio)"
            value={profileBio}
            onChangeText={setProfileBio}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={{ marginBottom: 12 }}
          />

          <TextInput
            label="Profil Fotoğrafı URL (Avatar)"
            value={profileAvatarUrl}
            onChangeText={setProfileAvatarUrl}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="url"
            style={{ marginBottom: 16 }}
          />

          <Text
            variant="labelLarge"
            style={{ marginBottom: 8, fontWeight: "bold" }}
          >
            Görsel Tema
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginBottom: 8,
              gap: 8,
            }}
          >
            {THEME_PRESETS.map((t) => (
              <Chip
                key={t.id}
                selected={profileTheme === t.id}
                onPress={() => setProfileTheme(t.id)}
                style={{
                  backgroundColor: profileTheme === t.id ? t.bg : "#f0f0f0",
                  borderColor:
                    profileTheme === t.id ? theme.colors.primary : "#ccc",
                  borderWidth: profileTheme === t.id ? 2 : 0,
                  marginRight: 4,
                  marginBottom: 8,
                }}
                textStyle={{
                  color: profileTheme === t.id ? t.text : "#333",
                  fontWeight: profileTheme === t.id ? "bold" : "normal",
                }}
              >
                {t.name}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} disabled={savingProfile}>
          İptal
        </Button>
        <Button
          mode="contained"
          onPress={onSave}
          loading={savingProfile}
          disabled={savingProfile}
        >
          Kaydet
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
