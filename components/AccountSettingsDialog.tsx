import React from "react";
import { Linking, ScrollView, View } from "react-native";
import { Button, Dialog, Divider, Text } from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import { AccountSettingsDialogProps } from "../types";

export default function AccountSettingsDialog({
  visible,
  onDismiss,
  currentUser,
  deletingAccount,
  onDeleteAccount,
  onManageSubscription,
  checkingBroken,
  onCheckBrokenLinks,
}: AccountSettingsDialogProps) {
  const theme = useAppTheme();
  const isPro = currentUser?.plan === "pro" || currentUser?.role === "admin";

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={{ borderRadius: theme.radius.lg }}>
      <Dialog.Title>Hesap Ayarları</Dialog.Title>
      <Dialog.Content>
        <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: theme.spacing.sm + theme.spacing.xs }}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>
              Kullanıcı adı
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.semibold }}>
              @{currentUser?.username || "-"}
            </Text>
          </View>

          <View style={{ marginBottom: theme.spacing.sm + theme.spacing.xs }}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>
              E-posta
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.semibold }}>
              {currentUser?.email || "-"}
            </Text>
          </View>

          {isPro && (
            <>
              <Divider style={{ marginVertical: theme.spacing.sm + theme.spacing.xs }} />
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.semibold, marginBottom: theme.spacing.xs + 2 }}>
                Abonelik
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 18, marginBottom: theme.spacing.sm + theme.spacing.xs }}>
                LinkFlow Pro aboneliğinizi yönetmek veya iptal etmek için mağaza
                ayarlarınıza gidebilirsiniz.
              </Text>
              <Button
                mode="outlined"
                icon="open-in-new"
                style={{ borderColor: theme.colors.outline }}
                textColor={theme.colors.onSurface}
                onPress={onManageSubscription}
              >
                Aboneliği Yönet / İptal Et
              </Button>
            </>
          )}

          <Divider style={{ marginVertical: theme.spacing.sm + theme.spacing.xs }} />

          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.semibold, marginBottom: theme.spacing.xs + 2 }}>
            Bakım
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 18, marginBottom: theme.spacing.sm + theme.spacing.xs }}>
            Kayıtlı bağlantılarınızın hâlâ erişilebilir olup olmadığını kontrol
            edin. Sonuçlar bağlantı kartlarında "Erişilemiyor" etiketiyle
            gösterilir.
          </Text>
          <Button
            mode="outlined"
            icon="link-off"
            style={{ borderColor: theme.colors.outline }}
            textColor={theme.colors.onSurface}
            loading={checkingBroken}
            disabled={checkingBroken}
            onPress={onCheckBrokenLinks}
          >
            {checkingBroken ? "Kontrol Ediliyor..." : "Bozuk Linkleri Kontrol Et"}
          </Button>

          <Divider style={{ marginVertical: theme.spacing.sm + theme.spacing.xs }} />

          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontFamily: theme.fontFamily.semibold, marginBottom: theme.spacing.xs + 2 }}>
            Yasal ve Gizlilik
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 18, marginBottom: theme.spacing.sm + theme.spacing.xs }}>
            Kullanım koşullarımızı ve gizlilik politikamızı inceleyebilirsiniz.
          </Text>

          <View style={{ marginBottom: theme.spacing.xs }}>
            <Button
              mode="outlined"
              icon="shield-account-outline"
              style={{ borderColor: theme.colors.outline }}
              textColor={theme.colors.primary}
              onPress={() => Linking.openURL("https://linkflow.com/privacy")}
            >
              Gizlilik Politikası
            </Button>
            <Button
              mode="outlined"
              icon="file-document-outline"
              style={{ borderColor: theme.colors.outline, marginTop: theme.spacing.sm }}
              textColor={theme.colors.primary}
              onPress={() => Linking.openURL("https://linkflow.com/terms")}
            >
              Kullanım Koşulları
            </Button>
          </View>

          <Divider style={{ marginVertical: theme.spacing.sm + theme.spacing.xs }} />

          <Text variant="titleSmall" style={{ color: theme.colors.error, fontFamily: theme.fontFamily.semibold, marginBottom: theme.spacing.xs + 2 }}>
            Hesabı Sil
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 18, marginBottom: theme.spacing.sm + theme.spacing.xs }}>
            Hesabınız, profiliniz, linkleriniz ve size ait klasörler kalıcı
            olarak silinir. Bu işlem geri alınamaz.
          </Text>

          <Button
            mode="outlined"
            icon="delete-outline"
            textColor={theme.colors.error}
            style={{ borderColor: theme.colors.error }}
            loading={deletingAccount}
            disabled={deletingAccount}
            onPress={onDeleteAccount}
          >
            Hesabı Kalıcı Olarak Sil
          </Button>
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} disabled={deletingAccount} textColor={theme.colors.onSurfaceVariant}>
          Kapat
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
