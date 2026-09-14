import { useState, useCallback, useEffect } from "react";
import { Alert, Share, Platform } from "react-native";
import api from "../services/api";
import Config from "../constants/Config";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_VISUAL_THEME_ID } from "../constants";
import { useVisualTheme } from "../context/VisualThemeContext";

export function useProfile() {
  const { token, user: currentUser, isAuthenticated } = useAuth();
  const { setThemeId } = useVisualTheme();
  const [profileName, setProfileName] = useState("Miraç Erdin");
  const [profileBio, setProfileBio] = useState(
    "Kaydettiğim harika bağlantılar.",
  );
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileTheme, setProfileThemeState] = useState(DEFAULT_VISUAL_THEME_ID);
  const [savedProfileTheme, setSavedProfileTheme] = useState(
    DEFAULT_VISUAL_THEME_ID,
  );
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
        const savedThemeId =
          response.data.theme || DEFAULT_VISUAL_THEME_ID;
        setProfileThemeState(savedThemeId);
        setSavedProfileTheme(savedThemeId);
        setThemeId(savedThemeId);
      }
      setProfileError(false);
    } catch (err) {
      console.warn("Fetch profile error:", err);
      setProfileError(true);
    }
  }, [isAuthenticated, token, currentUser, setThemeId]);

  const setProfileTheme = useCallback(
    (nextThemeId: string) => {
      setProfileThemeState(nextThemeId);
      setThemeId(nextThemeId);
    },
    [setThemeId],
  );

  const openBioSettings = useCallback(() => {
    setProfileThemeState(savedProfileTheme);
    setThemeId(savedProfileTheme);
    setBioSettingsVisible(true);
  }, [savedProfileTheme, setThemeId]);

  const closeBioSettings = useCallback(() => {
    setProfileThemeState(savedProfileTheme);
    setThemeId(savedProfileTheme);
    setBioSettingsVisible(false);
  }, [savedProfileTheme, setThemeId]);

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
      setThemeId(profileTheme);
      setSavedProfileTheme(profileTheme);
      setBioSettingsVisible(false);
      Alert.alert("Başarılı", "Profil ve uygulama teması güncellendi!");
    } catch (error) {
      setProfileThemeState(savedProfileTheme);
      setThemeId(savedProfileTheme);
      Alert.alert("Hata", "Profil ayarları kaydedilemedi");
    } finally {
      setSavingProfile(false);
    }
  }, [
    profileName,
    profileBio,
    profileAvatarUrl,
    profileTheme,
    savedProfileTheme,
    setThemeId,
  ]);

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
    openBioSettings,
    closeBioSettings,
    fetchProfile,
    handleSaveProfile,
    handleShareProfile,
    profileError,
  };
}
