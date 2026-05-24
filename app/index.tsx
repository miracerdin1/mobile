import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Share,
  Linking,
  TouchableOpacity,
} from "react-native";
import {
  ActivityIndicator,
  Chip,
  FAB,
  IconButton,
  Portal,
  Searchbar,
  Text,
  useTheme,
  Dialog,
  Button,
  TextInput,
} from "react-native-paper";
import LinkCard from "../components/LinkCard";
import AuthScreen from "../components/AuthScreen";
import { DEFAULT_CATEGORIES, FOLDER_COLORS, FOLDER_ICONS } from "../constants";
import Config from "../constants/Config";
import {
  connectSocket,
  disconnectSocket,
  joinFolderRoom,
  leaveFolderRoom,
} from "../services/socket";
import { useAuth } from "../context/AuthContext";

// Import modular components
import BioSettingsDialog from "../components/BioSettingsDialog";
import FolderFormDialog from "../components/FolderFormDialog";
import CollaborationDialog from "../components/CollaborationDialog";
import ReminderDialog from "../components/ReminderDialog";
import ClipboardPrompt from "../components/ClipboardPrompt";

import {
  calculateReminderDelay,
  requestNotificationPermissions,
  scheduleLocalNotification,
  cancelLocalNotification,
  scheduleSmartWeeklyNotification,
} from "../utils/reminderHelper";
import { User, Folder, Link, Reminder } from "../types";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}



export default function Index() {
  const router = useRouter();
  const theme = useTheme();
  const navigation = useNavigation();

  // Authentication State
  const { token, user: currentUser, isAuthenticated, logout: contextLogout, loading: authLoading } = useAuth();

  // General App State
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Category Management State
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [manageCategoriesVisible, setManageCategoriesVisible] = useState(false);

  // Clipboard State
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [showClipboardPrompt, setShowClipboardPrompt] = useState(false);
  const [savingClipboard, setSavingClipboard] = useState(false);
  const [clipboardFolderId, setClipboardFolderId] = useState<string | null>(
    null,
  );

  // Custom Folders & Collections State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [manageFoldersVisible, setManageFoldersVisible] = useState(false);
  const [folderFormVisible, setFolderFormVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#6200ee");
  const [folderIcon, setFolderIcon] = useState("folder");
  const [folderIsPublic, setFolderIsPublic] = useState(false);

  // Profile/Bio Settings State
  const [bioSettingsVisible, setBioSettingsVisible] = useState(false);
  const [profileName, setProfileName] = useState("Miraç Erdin");
  const [profileBio, setProfileBio] = useState(
    "Kaydettiğim harika bağlantılar.",
  );
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileTheme, setProfileTheme] = useState("purple-dark");
  const [savingProfile, setSavingProfile] = useState(false);

  // Collaboration State
  const [collaborationModalVisible, setCollaborationModalVisible] =
    useState(false);
  const [inviteUsernameOrEmail, setInviteUsernameOrEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  // Reminder / Notification State
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderDialogVisible, setReminderDialogVisible] = useState(false);
  const [selectedReminderLink, setSelectedReminderLink] = useState<Link | null>(
    null,
  );
  const [smartRemindersEnabled, setSmartRemindersEnabled] = useState(false);
  const [customReminderDate, setCustomReminderDate] = useState<Date>(
    new Date(Date.now() + 10 * 60 * 1000),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [webCustomDateTime, setWebCustomDateTime] = useState("");
  const [fetchError, setFetchError] = useState<boolean>(false);

  // 1. Initial Authentication Check handled by AuthContext
  useEffect(() => {
    if (isAuthenticated && token) {
      
      connectSocket(token);
      setLoading(true);
      Promise.all([fetchLinks(), fetchFolders(), fetchProfile()]).finally(() =>
        setLoading(false),
      );
    } else if (!authLoading) {
      // Cleared state for Guest Mode
      
      disconnectSocket();
      setLinks([]);
      setFolders([]);
      setSelectedFolderId(null);
    }
  }, [isAuthenticated, token, authLoading]);

  // Notifications Permissions, Response Listener & AsyncStorage Loading
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        if (Platform.OS === "web") {
          // On web, just restore stored states
          const storedReminders = await AsyncStorage.getItem("activeReminders");
          if (storedReminders) {
            setReminders(JSON.parse(storedReminders));
          }
          const storedSmart = await AsyncStorage.getItem(
            "smartRemindersEnabled",
          );
          if (storedSmart) {
            setSmartRemindersEnabled(JSON.parse(storedSmart));
          }
          return;
        }

        // Request Permissions
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          await Notifications.requestPermissionsAsync();
        }

        // Load active reminders from storage
        const storedReminders = await AsyncStorage.getItem("activeReminders");
        if (storedReminders) {
          setReminders(JSON.parse(storedReminders));
        }

        // Load smart reminder setting
        const storedSmart = await AsyncStorage.getItem("smartRemindersEnabled");
        if (storedSmart) {
          setSmartRemindersEnabled(JSON.parse(storedSmart));
        }
      } catch (e) {
        console.error("Error setting up notifications:", e);
      }
    };

    setupNotifications();

    if (Platform.OS !== "web") {
      // Listener for when a user clicks on a notification
      const responseSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const url = response.notification.request.content.data?.url;
          if (typeof url === "string") {
            console.log("[Notification Clicked] Opening URL:", url);
            Linking.openURL(url).catch((err) =>
              console.error("Failed to open URL from notification:", err),
            );
          }
        });

      return () => {
        responseSubscription.remove();
      };
    }
  }, []);

  const handleLogout = async () => {
    console.log("[Logout] handleLogout triggered");
    const performLogout = async () => {
      try {
        await contextLogout();
      } catch (e) {
        console.error("Logout failed:", e);
      }
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm(
        "Oturumu kapatmak istediğinize emin misiniz?",
      );
      if (confirm) {
        await performLogout();
      }
    } else {
      Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinize emin misiniz?", [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: performLogout,
        },
      ]);
    }
  };

  // 2. WebSocket Real-time subscriptions
  useEffect(() => {
    if (token && selectedFolderId) {
      joinFolderRoom(selectedFolderId, token);
      return () => {
        leaveFolderRoom(selectedFolderId);
      };
    }
  }, [selectedFolderId, token]);

  useEffect(() => {
    if (!token || !currentUser) return;

    const activeSocket = connectSocket(token);

    const handleLinkCreated = (newLink: any) => {
      console.log("[Socket Event] link_created received:", newLink._id);
      setLinks((prev) => {
        if (prev.some((l) => l._id === newLink._id)) return prev;
        if (selectedFolderId && newLink.folderId !== selectedFolderId)
          return prev;
        return [newLink, ...prev];
      });
    };

    const handleLinkUpdated = (updatedLink: any) => {
      console.log("[Socket Event] link_updated received:", updatedLink._id);
      setLinks((prev) =>
        prev.map((l) => (l._id === updatedLink._id ? updatedLink : l)),
      );
    };

    const handleLinkDeleted = (data: { linkId: string }) => {
      console.log("[Socket Event] link_deleted received:", data.linkId);
      setLinks((prev) => prev.filter((l) => l._id !== data.linkId));
    };

    const handleFolderUpdated = (updatedFolder: any) => {
      console.log("[Socket Event] folder_updated received:", updatedFolder._id);
      setFolders((prev) =>
        prev.map((f) => (f._id === updatedFolder._id ? updatedFolder : f)),
      );
    };

    const handleFolderDeleted = (data: { folderId: string }) => {
      console.log("[Socket Event] folder_deleted received:", data.folderId);
      setFolders((prev) => prev.filter((f) => f._id !== data.folderId));
      if (selectedFolderId === data.folderId) {
        Alert.alert("Klasör Silindi", "Bu klasörün sahibi klasörü sildi.");
        setSelectedFolderId(null);
      }
    };

    const handleUserRemoved = (data: { userId: string; folderId: string }) => {
      console.log(
        "[Socket Event] user_removed received for user ID:",
        data.userId,
      );
      if (data.userId === currentUser.id) {
        Alert.alert(
          "Erişim Sonlandırıldı",
          "Bu ortak klasörün ortaklık listesinden çıkarıldınız.",
        );
        if (selectedFolderId === data.folderId) {
          setSelectedFolderId(null);
        }
        fetchFolders();
        fetchLinks();
      }
    };

    const refreshEvent = `user_folder_list_refresh_${currentUser.id}`;
    const handleListRefresh = () => {
      console.log("[Socket Event] Folder list refresh triggered for user");
      fetchFolders();
      fetchLinks();
    };

    activeSocket.on("link_created", handleLinkCreated);
    activeSocket.on("link_updated", handleLinkUpdated);
    activeSocket.on("link_deleted", handleLinkDeleted);
    activeSocket.on("folder_updated", handleFolderUpdated);
    activeSocket.on("folder_deleted", handleFolderDeleted);
    activeSocket.on("user_removed", handleUserRemoved);
    activeSocket.on(refreshEvent, handleListRefresh);

    return () => {
      activeSocket.off("link_created", handleLinkCreated);
      activeSocket.off("link_updated", handleLinkUpdated);
      activeSocket.off("link_deleted", handleLinkDeleted);
      activeSocket.off("folder_updated", handleFolderUpdated);
      activeSocket.off("folder_deleted", handleFolderDeleted);
      activeSocket.off("user_removed", handleUserRemoved);
      activeSocket.off(refreshEvent, handleListRefresh);
    };
  }, [token, selectedFolderId, currentUser]);

  // 3. Data Fetching
  const fetchLinks = async () => {
    try {
      const response = await api.get(`${Config.API_URL}/api/links`);
      setLinks(response.data);
      setFetchError(false);
    } catch (err) {
      console.warn("Fetch error:", err);
      setFetchError(true);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await api.get(`${Config.API_URL}/api/folders`);
      setFolders(response.data);
      setFetchError(false);
    } catch (err) {
      console.warn("Fetch folders error:", err);
      setFetchError(true);
    }
  };

  const fetchProfile = async () => {
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
      setFetchError(false);
    } catch (err) {
      console.warn("Fetch profile error:", err);
      setFetchError(true);
    }
  };

  // Clipboard Polling
  const checkClipboard = async () => {
    try {
      if (!token) return;
      if (Platform.OS === "web") return; // Web tarayıcıları otomatik pano erişimini engeller
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;

      const content = await Clipboard.getStringAsync();
      const urlPattern =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w \.-]*)*\/?(\?.*)?$/;

      if (urlPattern.test(content)) {
        const lastSaved = await AsyncStorage.getItem("lastSavedClipboardUrl");
        if (lastSaved !== content) {
          setClipboardUrl(content);
          setShowClipboardPrompt(true);
        }
      }
    } catch (error) {
      console.error("Clipboard check error:", error);
    }
  };

  useEffect(() => {
    if (!token) return;
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          checkClipboard();
        }
      },
    );

    checkClipboard(); // Initial check

    return () => {
      subscription.remove();
    };
  }, [token]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem("categories");
      if (stored) {
        setCategories(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const saveCategories = async (newCategories: string[]) => {
    try {
      setCategories(newCategories);
      await AsyncStorage.setItem("categories", JSON.stringify(newCategories));
    } catch (e) {
      console.error("Failed to save categories", e);
    }
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const newCategories = [...categories];
    if (index === 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 1 || targetIndex >= newCategories.length) return;

    [newCategories[index], newCategories[targetIndex]] = [
      newCategories[targetIndex],
      newCategories[index],
    ];
    saveCategories(newCategories);
  };

  // Header Actions
  const handleSaveProfile = async () => {
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
  };

  const handleShareProfile = async () => {
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
  };

  useEffect(() => {
    if (!token || !currentUser) {
      navigation.setOptions({
        headerRight: () => null,
      });
      return;
    }
    navigation.setOptions({
      headerRightContainerStyle: {
        justifyContent: "end",
        alignItems: "center",
        paddingRight: 8,
      },
      headerRight: () => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(0, 0, 0, 0.08)",
            paddingHorizontal: 6,
            height: 36,
            alignSelf: "center",
            gap: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <IconButton
            icon="earth"
            size={21}
            onPress={() => setBioSettingsVisible(true)}
            iconColor="#333"
            style={{
              margin: 0,
              padding: 0,
              width: 36,
              height: 36,
              justifyContent: "center",
              alignItems: "center",
            }}
          />
          <IconButton
            icon="share-variant"
            size={21}
            onPress={handleShareProfile}
            iconColor="#333"
            style={{
              margin: 0,
              padding: 0,
              width: 36,
              height: 36,
              justifyContent: "center",
              alignItems: "center",
            }}
          />
          <IconButton
            icon="logout"
            size={21}
            onPress={handleLogout}
            iconColor="#d32f2f"
            style={{
              margin: 0,
              padding: 0,
              width: 36,
              height: 36,
              justifyContent: "center",
              alignItems: "center",
            }}
          />
        </View>
      ),
    });
  }, [
    navigation,
    token,
    currentUser,
    profileName,
    profileBio,
    profileAvatarUrl,
    profileTheme,
    handleLogout,
    handleShareProfile,
  ]);

  // Folder Actions
  const handleCreateOrUpdateFolder = async () => {
    if (!folderName.trim()) {
      Alert.alert("Hata", "Klasör adı boş olamaz");
      return;
    }

    try {
      if (editingFolder) {
        const response = await api.put(
          `${Config.API_URL}/api/folders/${editingFolder._id}`,
          {
            name: folderName,
            color: folderColor,
            icon: folderIcon,
            isPublic: folderIsPublic,
          },
        );
        setFolders((prev) =>
          prev.map((f) => (f._id === editingFolder._id ? response.data : f)),
        );
      } else {
        const response = await api.post(`${Config.API_URL}/api/folders`, {
          name: folderName,
          color: folderColor,
          icon: folderIcon,
          isPublic: folderIsPublic,
        });
        setFolders((prev) => [...prev, response.data]);
      }
      setFolderFormVisible(false);
      setFolderName("");
      setFolderColor("#6200ee");
      setFolderIcon("folder");
      setFolderIsPublic(false);
      setEditingFolder(null);
    } catch (error) {
      Alert.alert("Hata", "Klasör kaydedilemedi");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    Alert.alert(
      "Klasörü Sil",
      "Bu klasörü silmek istediğinize emin misiniz? Klasörün içindeki linkler silinmeyecek, sadece klasörsüz kalacaktır.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`${Config.API_URL}/api/folders/${id}`);
              setFolders((prev) => prev.filter((f) => f._id !== id));
              if (selectedFolderId === id) {
                setSelectedFolderId(null);
              }
              fetchLinks(); // Reload links
            } catch (error) {
              Alert.alert("Hata", "Klasör silinemedi");
            }
          },
        },
      ],
    );
  };

  // Collaborator Actions
  const handleAddCollaborator = async () => {
    if (!inviteUsernameOrEmail.trim()) {
      Alert.alert("Hata", "Lütfen bir kullanıcı adı veya e-posta girin");
      return;
    }
    setInviting(true);
    try {
      const response = await api.post(
        `${Config.API_URL}/api/folders/${selectedFolderId}/collaborators`,
        {
          usernameOrEmail: inviteUsernameOrEmail.trim(),
        },
      );
      setFolders((prev) =>
        prev.map((f) => (f._id === selectedFolderId ? response.data : f)),
      );
      setInviteUsernameOrEmail("");
      Alert.alert("Başarılı", "Ortak başarıyla eklendi!");
    } catch (error: any) {
      const errMsg = error.response?.data?.error || "Kullanıcı eklenemedi";
      Alert.alert("Hata", errMsg);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = async (colUserId: string) => {
    Alert.alert(
      "Ortağı Çıkar",
      "Bu kullanıcıyı ortaklık listesinden çıkarmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.delete(
                `${Config.API_URL}/api/folders/${selectedFolderId}/collaborators/${colUserId}`,
              );
              setFolders((prev) =>
                prev.map((f) =>
                  f._id === selectedFolderId ? response.data : f,
                ),
              );
            } catch (error) {
              Alert.alert("Hata", "Ortak çıkarılamadı");
            }
          },
        },
      ],
    );
  };

  const handleLeaveFolder = async () => {
    Alert.alert(
      "Klasörden Ayrıl",
      "Bu ortak klasörden ayrılmak istediğinize emin misiniz? Artık bu klasörün içeriğine erişemeyeceksiniz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Ayrıl",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post(
                `${Config.API_URL}/api/folders/${selectedFolderId}/leave`,
              );
              setSelectedFolderId(null);
              setCollaborationModalVisible(false);
              fetchFolders();
              fetchLinks();
              Alert.alert("Ayrıldınız", "Klasörden başarıyla ayrıldınız.");
            } catch (error) {
              Alert.alert("Hata", "Klasörden ayrılamadı");
            }
          },
        },
      ],
    );
  };

  // Reminder Actions (Daha Sonra Oku Hatırlatıcıları)
  const handleScheduleReminder = async (
    link: any,
    delayType:
      | "1hour"
      | "evening"
      | "tomorrow"
      | "nextweek"
      | "instant"
      | "custom",
    customDate?: Date,
  ) => {
    try {
      // 1. Request permissions (Native only)
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          "İzin Gerekli",
          "Hatırlatıcı eklemek için bildirim izinlerini onaylamanız gerekmektedir.",
        );
        return;
      }

      // 2. Calculate delay in seconds
      let delaySeconds = 0;
      let delayText = "";
      try {
        const delayResult = calculateReminderDelay(delayType, customDate);
        delaySeconds = delayResult.delaySeconds;
        delayText = delayResult.delayText;
      } catch (err: any) {
        Alert.alert(
          "Geçersiz Zaman",
          err.message || "Lütfen gelecekteki bir tarih ve saat seçin.",
        );
        return;
      }

      // 3. Cancel any existing reminder for this specific link first
      const existing = reminders.find((r) => r.linkId === link._id);
      if (existing) {
        await cancelLocalNotification(existing.notificationId);
      }

      // 4. Schedule local notification / Web simulated notification
      const notificationId = await scheduleLocalNotification(
        link,
        delaySeconds,
        Platform.OS === "web"
          ? (message, url) => {
              if (confirm(message)) {
                Linking.openURL(url).catch((err) =>
                  console.error("Failed to open URL:", err),
                );
              }
            }
          : undefined,
      );

      // 5. Update state and AsyncStorage
      const updatedReminders = reminders.filter((r) => r.linkId !== link._id);
      const newReminders = [
        ...updatedReminders,
        { linkId: link._id, notificationId },
      ];

      setReminders(newReminders);
      await AsyncStorage.setItem(
        "activeReminders",
        JSON.stringify(newReminders),
      );
      setReminderDialogVisible(false);

      Alert.alert(
        "Hatırlatıcı Kuruldu 🔔",
        `"${link.title || "Bağlantı"}" için hatırlatıcı ${delayText} çalışacak şekilde başarıyla ayarlandı.`,
      );
    } catch (error) {
      console.error("Failed to schedule reminder:", error);
      Alert.alert("Hata", "Hatırlatıcı kurulurken bir hata oluştu.");
    }
  };

  const handleCancelReminder = async (linkId: string) => {
    try {
      const existing = reminders.find((r) => r.linkId === linkId);
      if (existing) {
        await cancelLocalNotification(existing.notificationId);

        const updated = reminders.filter((r) => r.linkId !== linkId);
        setReminders(updated);
        await AsyncStorage.setItem("activeReminders", JSON.stringify(updated));
      }

      setReminderDialogVisible(false);
      Alert.alert("İptal Edildi 🔕", "Hatırlatıcı başarıyla iptal edildi.");
    } catch (error) {
      console.error("Failed to cancel reminder:", error);
      Alert.alert("Hata", "Hatırlatıcı iptal edilirken bir hata oluştu.");
    }
  };

  const handleToggleSmartReminders = async (enabled: boolean) => {
    try {
      setSmartRemindersEnabled(enabled);
      await AsyncStorage.setItem(
        "smartRemindersEnabled",
        JSON.stringify(enabled),
      );

      const smartNotificationId = await AsyncStorage.getItem(
        "smartNotificationId",
      );
      if (smartNotificationId) {
        await cancelLocalNotification(smartNotificationId);
        await AsyncStorage.removeItem("smartNotificationId");
      }

      if (enabled) {
        const notificationId = await scheduleSmartWeeklyNotification();
        await AsyncStorage.setItem("smartNotificationId", notificationId);
        Alert.alert(
          "Akıllı Hatırlatıcı Aktif 🔔",
          "Haftalık akıllı okuma listesi önerileri başarıyla etkinleştirildi!",
        );
      } else {
        Alert.alert(
          "Devre Dışı Bırakıldı 🔕",
          "Akıllı okuma hatırlatıcıları kapatıldı.",
        );
      }
    } catch (error) {
      console.error("Smart reminder toggle failed:", error);
    }
  };

  // Link Actions
  const deleteLinkItem = async (id: string) => {
    try {
      await api.delete(`${Config.API_URL}/api/links/${id}`);
      setLinks((prev) => prev.filter((link) => link._id !== id));
    } catch (err) {
      Alert.alert("Error", "Failed to delete link");
    }
  };

  const handleDelete = async (id: string) => {
    if (Platform.OS === "web") {
      if (confirm("Are you sure you want to delete this link?")) {
        await deleteLinkItem(id);
      }
    } else {
      Alert.alert("Delete Link", "Are you sure you want to delete this link?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteLinkItem(id),
        },
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLinks(), fetchFolders(), fetchProfile()]);
    setRefreshing(false);
  };

  const handleSaveClipboard = async () => {
    if (!clipboardUrl) return;
    
    if (!isAuthenticated) {
      router.push("/auth");
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
      fetchLinks(); // Refresh
    } catch (error) {
      Alert.alert("Error", "Failed to save link from clipboard");
    } finally {
      setSavingClipboard(false);
    }
  };

  const handleDismissClipboard = async () => {
    if (clipboardUrl) {
      await AsyncStorage.setItem("lastSavedClipboardUrl", clipboardUrl);
    }
    setShowClipboardPrompt(false);
    setClipboardUrl(null);
    setClipboardFolderId(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      setLoading(true);
      Promise.all([fetchLinks(), fetchFolders(), fetchProfile()]).finally(() =>
        setLoading(false),
      );
    }, [isAuthenticated]),
  );

  // Queries filtering
  const filteredLinks = links.filter((link) => {
    const matchesCategory =
      selectedCategory === "All" || link.category === selectedCategory;

    const matchesFolder =
      selectedFolderId === null || link.folderId === selectedFolderId;

    if (searchQuery.trim() === "") return matchesCategory && matchesFolder;

    const query = searchQuery.toLocaleLowerCase("tr-TR");
    const title = (link.title || "").toLocaleLowerCase("tr-TR");
    const url = (link.url || "").toLocaleLowerCase("tr-TR");
    const description = (link.description || "").toLocaleLowerCase("tr-TR");

    const matchesSearch =
      title.includes(query) ||
      url.includes(query) ||
      description.includes(query);

    return matchesCategory && matchesFolder && matchesSearch;
  });

  const currentFolder = selectedFolderId
    ? folders.find((f) => f._id === selectedFolderId)
    : null;

  // Render Loader if authentication state is loading
  if (authLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: "#0f0c20", marginTop: 0 }]}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Guest mode allowed! removed instant AuthScreen return

  return (
    <View style={styles.container}>
      <View
        style={{ paddingVertical: 8, backgroundColor: "white", elevation: 2 }}
      >
        <Searchbar
          placeholder="Search links..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ marginHorizontal: 16, marginBottom: 8 }}
        />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {categories.map((cat) => (
              <Chip
                key={cat}
                selected={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
                style={{ marginRight: 8 }}
                showSelectedOverlay
              >
                {cat}
              </Chip>
            ))}
          </ScrollView>
          <IconButton
            icon="swap-vertical"
            size={24}
            onPress={() => setManageCategoriesVisible(true)}
          />
        </View>
      </View>

      {/* Folders horizontal container */}
      <View
        style={{
          backgroundColor: "white",
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
        }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 4,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            variant="titleMedium"
            style={{ fontWeight: "bold", color: "#333" }}
          >
            Klasörler
          </Text>
          <Button
            icon="folder-edit-outline"
            compact
            mode="text"
            onPress={() => setManageFoldersVisible(true)}
          >
            Yönet
          </Button>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <Chip
            selected={selectedFolderId === null}
            onPress={() => setSelectedFolderId(null)}
            style={{
              marginRight: 8,
              backgroundColor:
                selectedFolderId === null
                  ? theme.colors.primaryContainer
                  : "#f5f5f5",
            }}
            textStyle={{
              color:
                selectedFolderId === null
                  ? theme.colors.onPrimaryContainer
                  : "#666",
            }}
            showSelectedOverlay
            icon="folder-open"
          >
            Tümü
          </Chip>
          {folders.map((folder) => {
            const isCollaborated =
              folder.owner && folder.owner._id !== currentUser?.id;
            const isShared =
              folder.collaborators && folder.collaborators.length > 0;
            const chipIcon =
              isCollaborated || isShared
                ? "account-multiple"
                : folder.isPublic
                  ? "earth"
                  : folder.icon || "folder";

            return (
              <Chip
                key={folder._id}
                selected={selectedFolderId === folder._id}
                onPress={() => setSelectedFolderId(folder._id)}
                style={{
                  marginRight: 8,
                  backgroundColor:
                    selectedFolderId === folder._id ? folder.color : "#f5f5f5",
                  borderColor: folder.color,
                  borderWidth: selectedFolderId === folder._id ? 0 : 1,
                }}
                textStyle={{
                  color: selectedFolderId === folder._id ? "#fff" : "#333",
                  fontWeight:
                    selectedFolderId === folder._id ? "bold" : "normal",
                }}
                showSelectedOverlay
                icon={chipIcon}
              >
                {folder.name}
              </Chip>
            );
          })}
          <Chip
            onPress={() => {
              setEditingFolder(null);
              setFolderName("");
              setFolderColor("#6200ee");
              setFolderIcon("folder");
              setFolderIsPublic(false);
              setFolderFormVisible(true);
            }}
            style={{ backgroundColor: "#f0f0f0" }}
            icon="plus"
          >
            Yeni Ekle
          </Chip>
        </ScrollView>
      </View>

      {/* Connection error banner */}
      {fetchError && (
        <View style={styles.connectionErrorBanner}>
          <IconButton
            icon="wifi-strength-1-alert"
            iconColor="#d32f2f"
            size={24}
            style={{ margin: 0 }}
          />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text
              variant="titleSmall"
              style={{ fontWeight: "bold", color: "#d32f2f" }}
            >
              Bağlantı Hatası
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: "#c62828", lineHeight: 16 }}
            >
              Sunucu uykuda olabilir (Render ücretsiz plan uyanması ~30-50 sn
              sürebilir) veya internet bağlantınız kesilmiştir. Yenilemek için
              lütfen ekranı aşağı kaydırın.
            </Text>
          </View>
          <IconButton
            icon="refresh"
            iconColor="#d32f2f"
            size={22}
            onPress={onRefresh}
            style={{ margin: 0 }}
          />
        </View>
      )}

      {/* Collaboration Banner inside custom selected folder */}
      {currentFolder && (
        <View style={styles.collaborationBanner}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconButton
                icon={currentFolder.icon || "folder"}
                iconColor={currentFolder.color}
                size={20}
                style={{ margin: 0, padding: 0 }}
              />
              <Text
                variant="titleMedium"
                style={{ fontWeight: "bold", color: "#333" }}
              >
                {currentFolder.name}
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: "#666", marginLeft: 8 }}>
              {currentFolder.owner?._id === currentUser?.id
                ? "Klasör Sahibi: Sizsiniz"
                : `Sahibi: @${currentFolder.owner?.username || "Bilinmiyor"}`}
            </Text>
          </View>

          {/* Avatar stack display */}
          <TouchableOpacity
            style={styles.avatarStack}
            onPress={() => setCollaborationModalVisible(true)}
          >
            {currentFolder.collaborators &&
              currentFolder.collaborators.slice(0, 3).map((col: any) => (
                <View
                  key={col._id}
                  style={[
                    styles.avatarBubble,
                    { backgroundColor: currentFolder.color || "#6200ee" },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {(col.username || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
            {currentFolder.collaborators &&
              currentFolder.collaborators.length > 3 && (
                <View
                  style={[styles.avatarBubble, { backgroundColor: "#666" }]}
                >
                  <Text style={styles.avatarText}>
                    +{currentFolder.collaborators.length - 3}
                  </Text>
                </View>
              )}
            <IconButton
              icon="account-multiple-plus-outline"
              size={20}
              iconColor="#6200ee"
              style={{ margin: 0, marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>
      )}

      <Portal>
        {/* Reorder Categories Dialog */}
        <Dialog
          visible={manageCategoriesVisible}
          onDismiss={() => setManageCategoriesVisible(false)}
        >
          <Dialog.Title>Reorder Categories</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 300 }}>
              {categories.map((cat, index) => (
                <View
                  key={cat}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text variant="bodyMedium">{cat}</Text>
                  {cat !== "All" && (
                    <View style={{ flexDirection: "row" }}>
                      <IconButton
                        icon="arrow-up"
                        size={20}
                        disabled={index <= 1}
                        onPress={() => moveCategory(index, "up")}
                      />
                      <IconButton
                        icon="arrow-down"
                        size={20}
                        disabled={index >= categories.length - 1}
                        onPress={() => moveCategory(index, "down")}
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setManageCategoriesVisible(false)}>
              Done
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Manage Folders Dialog */}
        <Dialog
          visible={manageFoldersVisible}
          onDismiss={() => setManageFoldersVisible(false)}
        >
          <Dialog.Title>Klasörleri Yönet</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 300 }}>
              {folders.length === 0 ? (
                <Text
                  style={{
                    textAlign: "center",
                    marginVertical: 20,
                    color: "#666",
                  }}
                >
                  Henüz klasör oluşturulmadı.
                </Text>
              ) : (
                folders.map((folder) => {
                  const isOwner = folder.owner?._id === currentUser?.id;
                  const isCollaborated = folder.owner?._id !== currentUser?.id;

                  return (
                    <View
                      key={folder._id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                        paddingVertical: 4,
                        borderBottomWidth: 0.5,
                        borderBottomColor: "#eee",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <IconButton
                          icon={folder.icon || "folder"}
                          size={20}
                          iconColor="white"
                          style={{
                            backgroundColor: folder.color || "#6200ee",
                            marginRight: 8,
                            margin: 0,
                          }}
                        />
                        <View>
                          <Text
                            variant="bodyMedium"
                            style={{ fontWeight: "bold" }}
                          >
                            {folder.name}
                          </Text>
                          {folder.isPublic && (
                            <Text
                              variant="labelSmall"
                              style={{
                                color: theme.colors.primary,
                                fontWeight: "bold",
                              }}
                            >
                              🌐 Herkese Açık
                            </Text>
                          )}
                          {isCollaborated && (
                            <Text
                              variant="labelSmall"
                              style={{ color: "#d32f2f", fontWeight: "bold" }}
                            >
                              👥 Ortak Çalışma (Sahibi: @
                              {folder.owner?.username})
                            </Text>
                          )}
                          {!isCollaborated &&
                            folder.collaborators?.length > 0 && (
                              <Text
                                variant="labelSmall"
                                style={{ color: "#2e7d32", fontWeight: "bold" }}
                              >
                                👥 Paylaşımlı ({folder.collaborators.length}{" "}
                                ortak)
                              </Text>
                            )}
                        </View>
                      </View>
                      <View style={{ flexDirection: "row" }}>
                        {isOwner && (
                          <IconButton
                            icon="pencil"
                            size={20}
                            onPress={() => {
                              setEditingFolder(folder);
                              setFolderName(folder.name);
                              setFolderColor(folder.color || "#6200ee");
                              setFolderIcon(folder.icon || "folder");
                              setFolderIsPublic(folder.isPublic || false);
                              setFolderFormVisible(true);
                            }}
                          />
                        )}
                        {isOwner ? (
                          <IconButton
                            icon="delete"
                            size={20}
                            iconColor="#d32f2f"
                            onPress={() => handleDeleteFolder(folder._id)}
                          />
                        ) : (
                          <IconButton
                            icon="logout"
                            size={20}
                            iconColor="#d32f2f"
                            onPress={() => {
                              setSelectedFolderId(folder._id);
                              setCollaborationModalVisible(true);
                              setManageFoldersVisible(false);
                            }}
                          />
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => {
                setEditingFolder(null);
                setFolderName("");
                setFolderColor("#6200ee");
                setFolderIcon("folder");
                setFolderIsPublic(false);
                setFolderFormVisible(true);
              }}
              style={{ marginTop: 16 }}
            >
              Yeni Klasör Ekle
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setManageFoldersVisible(false)}>
              Kapat
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Folder Add/Edit Form Dialog */}
        <FolderFormDialog
          visible={folderFormVisible}
          onDismiss={() => setFolderFormVisible(false)}
          editingFolder={editingFolder}
          folderName={folderName}
          setFolderName={setFolderName}
          folderColor={folderColor}
          setFolderColor={setFolderColor}
          folderIcon={folderIcon}
          setFolderIcon={setFolderIcon}
          folderIsPublic={folderIsPublic}
          setFolderIsPublic={setFolderIsPublic}
          onSave={handleCreateOrUpdateFolder}
        />

        {/* Bio Page Settings Dialog */}
        <BioSettingsDialog
          visible={bioSettingsVisible}
          onDismiss={() => setBioSettingsVisible(false)}
          profileName={profileName}
          setProfileName={setProfileName}
          profileBio={profileBio}
          setProfileBio={setProfileBio}
          profileAvatarUrl={profileAvatarUrl}
          setProfileAvatarUrl={setProfileAvatarUrl}
          profileTheme={profileTheme}
          setProfileTheme={setProfileTheme}
          savingProfile={savingProfile}
          onSave={handleSaveProfile}
          theme={theme}
        />

        {/* Folder Collaboration Settings Dialog */}
        <CollaborationDialog
          visible={collaborationModalVisible}
          onDismiss={() => setCollaborationModalVisible(false)}
          currentFolder={currentFolder}
          currentUser={currentUser}
          inviteUsernameOrEmail={inviteUsernameOrEmail}
          setInviteUsernameOrEmail={setInviteUsernameOrEmail}
          inviting={inviting}
          onAddCollaborator={handleAddCollaborator}
          onRemoveCollaborator={handleRemoveCollaborator}
          onLeaveFolder={handleLeaveFolder}
        />

        {/* "Daha Sonra Oku" Hatırlatıcı Ayarları Dialog */}
        <ReminderDialog
          visible={reminderDialogVisible}
          onDismiss={() => setReminderDialogVisible(false)}
          selectedReminderLink={selectedReminderLink}
          customReminderDate={customReminderDate}
          setCustomReminderDate={setCustomReminderDate}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          showTimePicker={showTimePicker}
          setShowTimePicker={setShowTimePicker}
          webCustomDateTime={webCustomDateTime}
          setWebCustomDateTime={setWebCustomDateTime}
          reminders={reminders}
          smartRemindersEnabled={smartRemindersEnabled}
          onScheduleReminder={handleScheduleReminder}
          onCancelReminder={handleCancelReminder}
          onToggleSmartReminders={handleToggleSmartReminders}
        />
      </Portal>

      {loading && links.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredLinks}
          keyExtractor={(item) => item._id || item.url}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const folder = folders.find((f) => f._id === item.folderId);
            return (
              <LinkCard
                url={item.url}
                title={item.title}
                description={item.description}
                imageUrl={item.imageUrl}
                siteName={item.siteName}
                category={item.category}
                folderName={folder?.name}
                folderColor={folder?.color}
                folderIcon={folder?.icon}
                onDelete={() => handleDelete(item._id)}
                onEdit={() => router.push(`/edit/${item._id}`)}
                onRemind={() => {
                  setSelectedReminderLink(item);
                  setReminderDialogVisible(true);
                }}
                hasReminder={reminders.some((r) => r.linkId === item._id)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text variant="bodyLarge">Bağlantı bulunamadı.</Text>
            </View>
          }
        />
      )}

      <FAB 
        icon="plus" 
        style={styles.fab} 
        onPress={() => {
          if (!isAuthenticated) {
            router.push("/auth");
          } else {
            router.push("/add");
          }
        }} 
      />

      {/* Clipboard Prompt UI */}
      <ClipboardPrompt
        visible={showClipboardPrompt}
        clipboardUrl={clipboardUrl}
        clipboardFolderId={clipboardFolderId}
        setClipboardFolderId={setClipboardFolderId}
        folders={folders}
        savingClipboard={savingClipboard}
        onSave={handleSaveClipboard}
        onDismiss={handleDismissClipboard}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 100,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  collaborationBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e8e5fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#dcd6f7",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
    borderWidth: 1.5,
    borderColor: "#fff",
    elevation: 1,
  },
  avatarText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  connectionErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderColor: "#ffcdd2",
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 10,
  },
});
