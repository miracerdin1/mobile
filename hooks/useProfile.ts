import { useState, useCallback, useEffect } from "react";
import { Alert, Share, Platform } from "react-native";
import api from "../services/api";
import Config from "../constants/Config";
import { useAuth } from "../context/AuthContext";

export function useProfile() {
  const { token, user: currentUser, isAuthenticated } = useAuth();
  const [profileName, setProfileName] = useState("Miraç Erdin");
  const [profileBio, setProfileBio] = useState(
    "Kaydettiğim harika bağlantılar.",
  );
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileTheme, setProfileTheme] = useState("purple-dark");
  const [savingProfile, setSavingProfile] = useState(false);
  const [bioSettingsVisible, setBioSettingsVisible] = useState(false);
  const [profileError, setProfileError] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    try {
      const response = await api.get(`${Config.API_URL}/api/profile`);
      if (response.data) {
        setProfileName(
          response.data.name || currentUser?.username || "LinkFlow Kullanıcısı",
        );
        setProfileBio(
          response.data.bio ||
            "Kaydettiğim harika bağlantılar ve koleksiyonlar.",
        );
        setProfileAvatarUrl(response.data.avatarUrl || "");
        setProfileTheme(response.data.theme || "purple-dark");
      }
      setProfileError(false);
    } catch (err) {
      console.warn("Fetch profile error:", err);
      setProfileError(true);
    }
  }, [isAuthenticated, token, currentUser]);

  const handleSaveProfile = useCallback(async () => {
    if (!profileName.trim()) {
      Alert.alert("Hata", "Profil adı boş olamaz");
      return;
    }
    setSavingProfile(true);
    try {
      await api.post(`${Config.API_URL}/api/profile`, {
        name: profileName.trim(),
        bio: profileBio.trim(),
        avatarUrl: profileAvatarUrl.trim(),
        theme: profileTheme,
      });
      setBioSettingsVisible(false);
      Alert.alert("Başarılı", "Bio sayfa ayarları güncellendi!");
    } catch (error) {
      Alert.alert("Hata", "Profil ayarları kaydedilemedi");
    } finally {
      setSavingProfile(false);
    }
  }, [profileName, profileBio, profileAvatarUrl, profileTheme]);

  const handleShareProfile = useCallback(async () => {
    try {
      if (!currentUser) return;
      const shareUrl = `${Config.API_URL}/bio/${currentUser.username}`;
      await Share.share({
        message: `LinkFlow Bio Sayfama göz atın: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error: any) {
      Alert.alert("Hata", "Paylaşım yapılırken bir hata oluştu");
    }
  }, [currentUser]);

  return {
    profileName,
    setProfileName,
    profileBio,
    setProfileBio,
    profileAvatarUrl,
    setProfileAvatarUrl,
    profileTheme,
    setProfileTheme,
    savingProfile,
    bioSettingsVisible,
    setBioSettingsVisible,
    fetchProfile,
    handleSaveProfile,
    handleShareProfile,
    profileError,
  };
}
