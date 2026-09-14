import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import api from "../services/api";
import Config from "../constants/Config";
import { useAuth } from "../context/AuthContext";
import { extractHttpUrl } from "../utils/url";
import { showAlert } from "../utils/alert";

export function useClipboardPoller(onSaveSuccess: () => void) {
  const { token, isAuthenticated } = useAuth();
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [showClipboardPrompt, setShowClipboardPrompt] = useState(false);
  const [savingClipboard, setSavingClipboard] = useState(false);
  const [clipboardFolderId, setClipboardFolderId] = useState<string | null>(null);

  const checkClipboard = useCallback(async (isManual: boolean = false) => {
    try {
      if (!token) return;

      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) {
        if (isManual) {
          showAlert("Bilgi", "Panonuz boş veya metin içermiyor.");
        }
        return;
      }

      const content = await Clipboard.getStringAsync();
      const detectedUrl = extractHttpUrl(content);

      if (detectedUrl) {
        const lastSaved = await AsyncStorage.getItem("lastSavedClipboardUrl");
        if (lastSaved !== detectedUrl || isManual) {
          setClipboardUrl(detectedUrl);
          setShowClipboardPrompt(true);
        }
        return;
      }

      if (isManual) {
        showAlert("Bilgi", "Panonuzda geçerli bir bağlantı bulunamadı.");
      }
    } catch (error) {
      console.error("Clipboard check error:", error);
      if (isManual) {
        showAlert(
          "Pano izni gerekli",
          "Panoya erişilemedi. Bağlantıyı kopyalayıp tekrar Panodan Ekle düğmesine dokunun.",
        );
      }
    }
  }, [token]);

  const handleSaveClipboard = useCallback(async () => {
    if (!clipboardUrl) return;

    if (!isAuthenticated) {
      // In parent component, router.push("/auth") should be handled
      return;
    }

    setSavingClipboard(true);
    try {
      await api.post(`${Config.API_URL}/api/links`, {
        url: clipboardUrl,
        folderId: clipboardFolderId,
      });
      await AsyncStorage.setItem("lastSavedClipboardUrl", clipboardUrl);
      setShowClipboardPrompt(false);
      setClipboardUrl(null);
      setClipboardFolderId(null);
      onSaveSuccess();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Panodan bağlantı kaydedilemedi.";
      showAlert("Hata", errMsg);
    } finally {
      setSavingClipboard(false);
    }
  }, [clipboardUrl, clipboardFolderId, isAuthenticated, onSaveSuccess]);

  const handleDismissClipboard = useCallback(async () => {
    if (clipboardUrl) {
      await AsyncStorage.setItem("lastSavedClipboardUrl", clipboardUrl);
    }
    setShowClipboardPrompt(false);
    setClipboardUrl(null);
    setClipboardFolderId(null);
  }, [clipboardUrl]);

  return {
    clipboardUrl,
    setClipboardUrl,
    showClipboardPrompt,
    setShowClipboardPrompt,
    savingClipboard,
    clipboardFolderId,
    setClipboardFolderId,
    handleSaveClipboard,
    handleDismissClipboard,
    checkClipboard,
  };
}
