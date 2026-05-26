import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import api from "../services/api";

const ACCOUNT_DELETION_MESSAGE =
  "Hesabiniz, profiliniz, linkleriniz ve size ait klasorler kalici olarak silinecek. Bu islem geri alinamaz.";

const showAccountDeletedMessage = () => {
  const message = "Hesabiniz ve uygulamadaki verileriniz silindi.";

  if (Platform.OS === "web") {
    window.alert(message);
    return;
  }

  Alert.alert("Hesap Silindi", message);
};

const showAccountDeletionError = (message: string) => {
  if (Platform.OS === "web") {
    window.alert(message);
    return;
  }

  Alert.alert("Hata", message);
};

export const useAccountDeletion = (logout: () => Promise<void>) => {
  const [accountSettingsVisible, setAccountSettingsVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const closeAccountSettings = useCallback(() => {
    if (deletingAccount) return;

    setAccountSettingsVisible(false);
  }, [deletingAccount]);

  const deleteAccount = useCallback(async () => {
    setDeletingAccount(true);

    try {
      await api.delete("/api/auth/account");
      setAccountSettingsVisible(false);
      await logout();
      showAccountDeletedMessage();
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        "Hesap silinemedi. Lutfen daha sonra tekrar deneyin.";
      showAccountDeletionError(message);
    } finally {
      setDeletingAccount(false);
    }
  }, [logout]);

  const requestAccountDeletion = useCallback(() => {
    if (deletingAccount) return;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(ACCOUNT_DELETION_MESSAGE);
      if (confirmed) {
        void deleteAccount();
      }
      return;
    }

    Alert.alert("Hesabi Sil", ACCOUNT_DELETION_MESSAGE, [
      { text: "Iptal", style: "cancel" },
      {
        text: "Hesabi Sil",
        style: "destructive",
        onPress: () => void deleteAccount(),
      },
    ]);
  }, [deleteAccount, deletingAccount]);

  return {
    accountSettingsVisible,
    setAccountSettingsVisible,
    closeAccountSettings,
    deletingAccount,
    requestAccountDeletion,
  };
};
