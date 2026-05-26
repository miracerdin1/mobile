import { useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus, Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import api from "../services/api";
import Config from "../constants/Config";
import { useAuth } from "../context/AuthContext";

export function useClipboardPoller(onSaveSuccess: () => void) {
  const { token, isAuthenticated } = useAuth();
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [showClipboardPrompt, setShowClipboardPrompt] = useState(false);
  const [savingClipboard, setSavingClipboard] = useState(false);
  const [clipboardFolderId, setClipboardFolderId] = useState<string | null>(null);

  const checkClipboard = useCallback(async (isManual: boolean = false) => {
    try {
      if (!token) return;
      if (Platform.OS === "web") {
        if (isManual) {
          Alert.alert("Bilgi", "Web tarayıcılarında pano erişimi kısıtlıdır.");
        }
        return;
      }

      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) {
        if (isManual) {
          Alert.alert("Bilgi", "Panonuz boş veya metin içermiyor.");
        }
        return;
      }

      const content = await Clipboard.getStringAsync();
      const urlPattern =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w \.-]*)*\/?(\?.*)?$/;

      if (urlPattern.test(content)) {
        const lastSaved = await AsyncStorage.getItem("lastSavedClipboardUrl");
        if (lastSaved !== content || isManual) {
          setClipboardUrl(content);
          setShowClipboardPrompt(true);
        } else if (isManual) {
          // If already saved but user clicked manually, still show it to allow editing/moving
          setClipboardUrl(content);
          setShowClipboardPrompt(true);
        }
      } else {
        if (isManual) {
          Alert.alert("Bilgi", "Panonuzda geçerli bir bağlantı (URL) bulunamadı.");
        }
      }
    } catch (error) {
      console.error("Clipboard check error:", error);
      if (isManual) {
        Alert.alert("Hata", "Pano kontrol edilirken bir hata oluştu.");
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
      Alert.alert("Hata", errMsg);
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
