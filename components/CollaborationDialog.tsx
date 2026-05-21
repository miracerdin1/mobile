import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Dialog,
  Text,
  IconButton,
  TextInput,
  Button,
} from "react-native-paper";

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
  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>👥 Ortak Çalışma Ayarları</Dialog.Title>
      <Dialog.Content>
        {currentFolder && (
          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
            <Text
              variant="labelMedium"
              style={{ fontWeight: "bold", marginBottom: 8, color: "#333" }}
            >
              Klasör: {currentFolder.name}
            </Text>

            {/* Active Members List */}
            <Text
              variant="labelSmall"
              style={{ fontWeight: "bold", color: "#666", marginBottom: 6 }}
            >
              Aktif Üyeler:
            </Text>

            {/* Owner */}
            <View style={styles.collabMemberRow}>
              <IconButton
                icon="crown"
                iconColor="#fbc02d"
                size={20}
                style={{ margin: 0 }}
              />
              <Text
                variant="bodyMedium"
                style={{ flex: 1, fontWeight: "bold" }}
              >
                @{currentFolder.owner?.username || "Bilinmiyor"} (Klasör Sahibi)
              </Text>
            </View>

            {/* Collaborators */}
            {currentFolder.collaborators &&
            currentFolder.collaborators.length === 0 ? (
              <Text style={styles.emptyCollabText}>
                Henüz bir ortak eklenmemiş.
              </Text>
            ) : (
              currentFolder.collaborators &&
              currentFolder.collaborators.map((col: User) => {
                const isCurrentUserOwner =
                  currentFolder.owner?._id === currentUser?.id;

                return (
                  <View key={col._id} style={styles.collabMemberRow}>
                    <IconButton
                      icon="account"
                      iconColor="#666"
                      size={20}
                      style={{ margin: 0 }}
                    />
                    <Text variant="bodyMedium" style={{ flex: 1 }}>
                      @{col.username}
                    </Text>
                    {isCurrentUserOwner && (
                      <IconButton
                        icon="account-remove"
                        iconColor="#d32f2f"
                        size={20}
                        style={{ margin: 0 }}
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
                  marginTop: 16,
                  borderTopWidth: 0.5,
                  borderTopColor: "#eee",
                  paddingTop: 16,
                }}
              >
                <Text
                  variant="labelSmall"
                  style={{
                    fontWeight: "bold",
                    color: "#666",
                    marginBottom: 8,
                  }}
                >
                  Yeni Ortak Davet Et:
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <TextInput
                    label="Kullanıcı Adı veya E-Posta"
                    value={inviteUsernameOrEmail}
                    onChangeText={setInviteUsernameOrEmail}
                    mode="outlined"
                    autoCapitalize="none"
                    dense
                    style={{ flex: 1, height: 42, backgroundColor: "#fff" }}
                  />
                  <Button
                    mode="contained"
                    onPress={onAddCollaborator}
                    loading={inviting}
                    disabled={inviting}
                    style={{
                      marginLeft: 8,
                      height: 42,
                      justifyContent: "center",
                    }}
                  >
                    Ekle
                  </Button>
                </View>
              </View>
            ) : (
              // Section to leave folder (Collaborators Only)
              <Button
                mode="contained"
                icon="logout"
                buttonColor="#d32f2f"
                onPress={onLeaveFolder}
                style={{ marginTop: 24 }}
              >
                Bu Klasörden Ayrıl
              </Button>
            )}
          </ScrollView>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>
          Done
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  collabMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  emptyCollabText: {
    textAlign: "center",
    marginVertical: 12,
    color: "#666",
    fontStyle: "italic",
  },
});
