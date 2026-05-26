import React from "react";
import { StyleSheet, View, Linking } from "react-native";
import { Button, Dialog, Divider, Text } from "react-native-paper";
import { AccountSettingsDialogProps } from "../types";

export default function AccountSettingsDialog({
  visible,
  onDismiss,
  currentUser,
  deletingAccount,
  onDeleteAccount,
  onManageSubscription,
}: AccountSettingsDialogProps) {
  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Hesap Ayarlari</Dialog.Title>
      <Dialog.Content>
        <View style={styles.accountRow}>
          <Text variant="labelMedium" style={styles.label}>
            Kullanici adi
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            @{currentUser?.username || "-"}
          </Text>
        </View>

        <View style={styles.accountRow}>
          <Text variant="labelMedium" style={styles.label}>
            E-posta
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            {currentUser?.email || "-"}
          </Text>
        </View>

        {currentUser?.plan === "pro" && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleSmall" style={styles.manageTitle}>
              Abonelik
            </Text>
            <Text variant="bodySmall" style={styles.dangerText}>
              LinkFlow Pro aboneliğinizi yönetmek veya iptal etmek için mağaza
              ayarlarınıza gidebilirsiniz.
            </Text>
            <Button
              mode="outlined"
              icon="open-in-new"
              style={styles.manageButton}
              onPress={onManageSubscription}
            >
              Aboneliği Yönet / İptal Et
            </Button>
          </>
        )}

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.legalTitle}>
          Yasal ve Gizlilik
        </Text>
        <Text variant="bodySmall" style={styles.legalText}>
          Kullanım koşullarımızı ve gizlilik politikamızı inceleyebilirsiniz.
        </Text>

        <View style={styles.legalRow}>
          <Button
            mode="outlined"
            icon="shield-account-outline"
            style={styles.legalButton}
            labelStyle={styles.legalButtonLabel}
            onPress={() => Linking.openURL("https://linkflow.com/privacy")}
          >
            Gizlilik Politikası
          </Button>
          <Button
            mode="outlined"
            icon="file-document-outline"
            style={[styles.legalButton, { marginTop: 8 }]}
            labelStyle={styles.legalButtonLabel}
            onPress={() => Linking.openURL("https://linkflow.com/terms")}
          >
            Kullanım Koşulları
          </Button>
        </View>

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.dangerTitle}>
          Hesabi Sil
        </Text>
        <Text variant="bodySmall" style={styles.dangerText}>
          Hesabiniz, profiliniz, linkleriniz ve size ait klasorler kalici
          olarak silinir. Bu islem geri alinamaz.
        </Text>

        <Button
          mode="outlined"
          icon="delete-outline"
          textColor="#d32f2f"
          style={styles.deleteButton}
          loading={deletingAccount}
          disabled={deletingAccount}
          onPress={onDeleteAccount}
        >
          Hesabi Kalici Olarak Sil
        </Button>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} disabled={deletingAccount}>
          Kapat
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  accountRow: {
    marginBottom: 12,
  },
  label: {
    color: "#666",
    marginBottom: 2,
  },
  value: {
    color: "#222",
    fontWeight: "600",
  },
  divider: {
    marginVertical: 12,
  },
  manageTitle: {
    color: "#222",
    fontWeight: "700",
    marginBottom: 6,
  },
  manageButton: {
    borderColor: "#ccc",
  },
  dangerTitle: {
    color: "#d32f2f",
    fontWeight: "700",
    marginBottom: 6,
  },
  dangerText: {
    color: "#666",
    lineHeight: 18,
    marginBottom: 12,
  },
  deleteButton: {
    borderColor: "#d32f2f",
  },
  legalTitle: {
    color: "#222",
    fontWeight: "700",
    marginBottom: 6,
  },
  legalText: {
    color: "#666",
    lineHeight: 18,
    marginBottom: 12,
  },
  legalRow: {
    marginBottom: 4,
  },
  legalButton: {
    borderColor: "#ccc",
  },
  legalButtonLabel: {
    color: "#6200ee",
  },
});
