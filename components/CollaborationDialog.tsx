import React from "react";
import { ScrollView, View } from "react-native";
import { Button, Dialog, IconButton, Text, TextInput } from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import PrimaryButton from "./PrimaryButton";
import { CollaborationDialogProps, User } from "../types";

export default function CollaborationDialog({
  visible,
  onDismiss,
  currentFolder,
  currentUser,
  inviteUsernameOrEmail,
  setInviteUsernameOrEmail,
  inviting,
  onAddCollaborator,
  onRemoveCollaborator,
  onLeaveFolder,
}: CollaborationDialogProps) {
  const theme = useAppTheme();
  const memberRowStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: theme.spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={{ borderRadius: theme.radius.lg }}>
      <Dialog.Title>Ortak Çalışma Ayarları</Dialog.Title>
      <Dialog.Content>
        {currentFolder && (
          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
            <Text
              variant="labelMedium"
              style={{ fontFamily: theme.fontFamily.semibold, marginBottom: theme.spacing.sm, color: theme.colors.onSurface }}
            >
              Klasör: {currentFolder.name}
            </Text>

            {/* Active Members List */}
            <Text
              variant="labelSmall"
              style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.xs + 2 }}
            >
              Aktif Üyeler:
            </Text>

            {/* Owner */}
            <View style={memberRowStyle}>
              <IconButton
                icon="crown-outline"
                iconColor={theme.app.warning}
                size={20}
                style={{ margin: 0 }}
              />
              <Text
                variant="bodyMedium"
                style={{ flex: 1, fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}
              >
                @{currentFolder.owner?.username || "Bilinmiyor"} (Klasör Sahibi)
              </Text>
            </View>

            {/* Collaborators */}
            {currentFolder.collaborators && currentFolder.collaborators.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  marginVertical: theme.spacing.sm + theme.spacing.xs,
                  color: theme.colors.onSurfaceVariant,
                  fontStyle: "italic",
                }}
              >
                Henüz bir ortak eklenmemiş.
              </Text>
            ) : (
              currentFolder.collaborators &&
              currentFolder.collaborators.map((col: User) => {
                const isCurrentUserOwner = currentFolder.owner?._id === currentUser?.id;

                return (
                  <View key={col._id} style={memberRowStyle}>
                    <IconButton
                      icon="account-outline"
                      iconColor={theme.colors.onSurfaceVariant}
                      size={20}
                      style={{ margin: 0 }}
                    />
                    <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>
                      @{col.username}
                    </Text>
                    {isCurrentUserOwner && (
                      <IconButton
                        icon="account-remove-outline"
                        iconColor={theme.colors.error}
                        size={20}
                        style={{ margin: 0 }}
                        accessibilityLabel={`@${col.username} kullanıcısını çıkar`}
                        onPress={() => onRemoveCollaborator(col._id)}
                      />
                    )}
                  </View>
                );
              })
            )}

            {/* Section to invite collaborators (Owner Only) */}
            {currentFolder.owner?._id === currentUser?.id ? (
              <View
                style={{
                  marginTop: theme.spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.outlineVariant,
                  paddingTop: theme.spacing.md,
                }}
              >
                <Text
                  variant="labelSmall"
                  style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.sm }}
                >
                  Yeni Ortak Davet Et:
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    label="Kullanıcı Adı veya E-Posta"
                    value={inviteUsernameOrEmail}
                    onChangeText={setInviteUsernameOrEmail}
                    mode="outlined"
                    autoCapitalize="none"
                    dense
                    style={{ flex: 1, height: 42, backgroundColor: theme.colors.surface }}
                    outlineColor={theme.colors.outlineVariant}
                    activeOutlineColor={theme.colors.primary}
                  />
                  <PrimaryButton
                    onPress={onAddCollaborator}
                    loading={inviting}
                    disabled={inviting}
                    compact
                    style={{ marginLeft: theme.spacing.sm }}
                  >
                    Ekle
                  </PrimaryButton>
                </View>
              </View>
            ) : (
              // Section to leave folder (Collaborators Only)
              <Button
                mode="contained"
                icon="logout"
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
                onPress={onLeaveFolder}
                style={{ marginTop: theme.spacing.lg }}
              >
                Bu Klasörden Ayrıl
              </Button>
            )}
          </ScrollView>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={theme.colors.onSurfaceVariant}>
          Tamam
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
