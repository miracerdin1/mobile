import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  TouchableOpacity,
  Linking,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Dialog,
  FAB,
  IconButton,
  Portal,
  Searchbar,
  Text,
  TextInput,
  useTheme,
  Switch,
} from "react-native-paper";
import LinkCard from "../components/LinkCard";
import Config from "../constants/Config";
import AuthScreen from "../components/AuthScreen";
import {
  connectSocket,
  disconnectSocket,
  joinFolderRoom,
  leaveFolderRoom,
} from "../services/socket";

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

const DEFAULT_CATEGORIES = [
  "All",
  "Video",
  "Article",
  "Product",
  "Social",
  "Other",
];

const FOLDER_COLORS = [
  "#6200ee", // Purple
  "#ff5722", // Deep Orange
  "#2e7d32", // Emerald Green
  "#008080", // Teal
  "#d32f2f", // Sunset Red
  "#1976d2", // Ocean Blue
  "#fbc02d", // Gold
  "#e91e63", // Rose/Pink
];

const FOLDER_ICONS = [
  "folder",
  "star",
  "heart",
  "briefcase",
  "book-open-variant",
  "cart",
  "gamepad-variant",
  "music",
  "lightbulb",
  "code-tags",
];

export default function Index() {
  const router = useRouter();
  const theme = useTheme();
  const navigation = useNavigation();

  // Authentication State
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // General App State
  const [links, setLinks] = useState<any[]>([]);
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
  const [clipboardFolderId, setClipboardFolderId] = useState<string | null>(null);

  // Custom Folders & Collections State
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [manageFoldersVisible, setManageFoldersVisible] = useState(false);
  const [folderFormVisible, setFolderFormVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#6200ee");
  const [folderIcon, setFolderIcon] = useState("folder");
  const [folderIsPublic, setFolderIsPublic] = useState(false);

  // Profile/Bio Settings State
  const [bioSettingsVisible, setBioSettingsVisible] = useState(false);
  const [profileName, setProfileName] = useState("Miraç Erdin");
  const [profileBio, setProfileBio] = useState("Kaydettiğim harika bağlantılar.");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileTheme, setProfileTheme] = useState("purple-dark");
  const [savingProfile, setSavingProfile] = useState(false);

  // Collaboration State
  const [collaborationModalVisible, setCollaborationModalVisible] = useState(false);
  const [inviteUsernameOrEmail, setInviteUsernameOrEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  // Reminder / Notification State
  const [reminders, setReminders] = useState<{ linkId: string; notificationId: string }[]>([]);
  const [reminderDialogVisible, setReminderDialogVisible] = useState(false);
  const [selectedReminderLink, setSelectedReminderLink] = useState<any | null>(null);
  const [smartRemindersEnabled, setSmartRemindersEnabled] = useState(false);
  const [customReminderDate, setCustomReminderDate] = useState<Date>(new Date(Date.now() + 10 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [webCustomDateTime, setWebCustomDateTime] = useState("");

  // 1. Initial Authentication Check
  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("userToken");
      const storedUser = await AsyncStorage.getItem("userData");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setCurrentUser(JSON.parse(storedUser));
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        connectSocket();
      }
    } catch (e) {
      console.error("Auth check failed:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

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
          const storedSmart = await AsyncStorage.getItem("smartRemindersEnabled");
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
      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === "string") {
          console.log("[Notification Clicked] Opening URL:", url);
          Linking.openURL(url).catch((err) => console.error("Failed to open URL from notification:", err));
        }
      });

      return () => {
        responseSubscription.remove();
      };
    }
  }, []);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setCurrentUser(newUser);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    connectSocket();
    
    setLoading(true);
    Promise.all([fetchLinks(), fetchFolders(), fetchProfile()]).finally(() => setLoading(false));
  };

  const handleLogout = async () => {
    console.log("[Logout] handleLogout triggered");
    const performLogout = async () => {
      try {
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("userData");
        axios.defaults.headers.common["Authorization"] = "";
        disconnectSocket();
        setToken(null);
        setCurrentUser(null);
        setLinks([]);
        setFolders([]);
        setSelectedFolderId(null);
      } catch (e) {
        console.error("Logout failed:", e);
      }
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm("Oturumu kapatmak istediğinize emin misiniz?");
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
      joinFolderRoom(selectedFolderId);
      return () => {
        leaveFolderRoom(selectedFolderId);
      };
    }
  }, [selectedFolderId, token]);

  useEffect(() => {
    if (!token || !currentUser) return;

    const activeSocket = connectSocket();

    const handleLinkCreated = (newLink: any) => {
      console.log("[Socket Event] link_created received:", newLink._id);
      setLinks((prev) => {
        if (prev.some((l) => l._id === newLink._id)) return prev;
        if (selectedFolderId && newLink.folderId !== selectedFolderId) return prev;
        return [newLink, ...prev];
      });
    };

    const handleLinkUpdated = (updatedLink: any) => {
      console.log("[Socket Event] link_updated received:", updatedLink._id);
      setLinks((prev) => prev.map((l) => l._id === updatedLink._id ? updatedLink : l));
    };

    const handleLinkDeleted = (data: { linkId: string }) => {
      console.log("[Socket Event] link_deleted received:", data.linkId);
      setLinks((prev) => prev.filter((l) => l._id !== data.linkId));
    };

    const handleFolderUpdated = (updatedFolder: any) => {
      console.log("[Socket Event] folder_updated received:", updatedFolder._id);
      setFolders((prev) => prev.map((f) => f._id === updatedFolder._id ? updatedFolder : f));
    };

    const handleFolderDeleted = (data: { folderId: string }) => {
      console.log("[Socket Event] folder_deleted received:", data.folderId);
      setFolders((prev) => prev.filter((f) => f._id !== data.folderId));
      if (selectedFolderId === data.folderId) {
        Alert.alert("Klasör Silindi", "Bu klasörün sahibi klasörü sildi.");
        setSelectedFolderId(null);
      }
    };

    const handleUserRemoved = (data: { userId: string, folderId: string }) => {
      console.log("[Socket Event] user_removed received for user ID:", data.userId);
      if (data.userId === currentUser.id) {
        Alert.alert("Erişim Sonlandırıldı", "Bu ortak klasörün ortaklık listesinden çıkarıldınız.");
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
      const response = await axios.get(`${Config.API_URL}/api/links`);
      setLinks(response.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await axios.get(`${Config.API_URL}/api/folders`);
      setFolders(response.data);
    } catch (err) {
      console.error("Fetch folders error:", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${Config.API_URL}/api/profile`);
      if (response.data) {
        setProfileName(response.data.name || currentUser?.username || "LinkFlow Kullanıcısı");
        setProfileBio(response.data.bio || "Kaydettiğim harika bağlantılar ve koleksiyonlar.");
        setProfileAvatarUrl(response.data.avatarUrl || "");
        setProfileTheme(response.data.theme || "purple-dark");
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  // Clipboard Polling
  const checkClipboard = async () => {
    try {
      if (!token) return;
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;

      const content = await Clipboard.getStringAsync();
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w \.-]*)*\/?(\?.*)?$/;
      
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
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkClipboard();
      }
    });

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
      await axios.post(`${Config.API_URL}/api/profile`, {
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
      headerRight: () => (
        <View style={{ flexDirection: "row", marginRight: -8 }}>
          <IconButton
            icon="earth"
            size={22}
            onPress={() => setBioSettingsVisible(true)}
            iconColor="#333"
          />
          <IconButton
            icon="share-variant"
            size={22}
            onPress={handleShareProfile}
            iconColor="#333"
          />
          <IconButton
            icon="logout"
            size={22}
            onPress={handleLogout}
            iconColor="#d32f2f"
          />
        </View>
      ),
    });
  }, [navigation, token, currentUser, profileName, profileBio, profileAvatarUrl, profileTheme, handleLogout, handleShareProfile]);

  // Folder Actions
  const handleCreateOrUpdateFolder = async () => {
    if (!folderName.trim()) {
      Alert.alert("Hata", "Klasör adı boş olamaz");
      return;
    }

    try {
      if (editingFolder) {
        const response = await axios.put(`${Config.API_URL}/api/folders/${editingFolder._id}`, {
          name: folderName,
          color: folderColor,
          icon: folderIcon,
          isPublic: folderIsPublic,
        });
        setFolders((prev) => prev.map((f) => f._id === editingFolder._id ? response.data : f));
      } else {
        const response = await axios.post(`${Config.API_URL}/api/folders`, {
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
    Alert.alert("Klasörü Sil", "Bu klasörü silmek istediğinize emin misiniz? Klasörün içindeki linkler silinmeyecek, sadece klasörsüz kalacaktır.", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${Config.API_URL}/api/folders/${id}`);
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
    ]);
  };

  // Collaborator Actions
  const handleAddCollaborator = async () => {
    if (!inviteUsernameOrEmail.trim()) {
      Alert.alert("Hata", "Lütfen bir kullanıcı adı veya e-posta girin");
      return;
    }
    setInviting(true);
    try {
      const response = await axios.post(`${Config.API_URL}/api/folders/${selectedFolderId}/collaborators`, {
        usernameOrEmail: inviteUsernameOrEmail.trim()
      });
      setFolders(prev => prev.map(f => f._id === selectedFolderId ? response.data : f));
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
    Alert.alert("Ortağı Çıkar", "Bu kullanıcıyı ortaklık listesinden çıkarmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkar",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await axios.delete(
              `${Config.API_URL}/api/folders/${selectedFolderId}/collaborators/${colUserId}`
            );
            setFolders(prev => prev.map(f => f._id === selectedFolderId ? response.data : f));
          } catch (error) {
            Alert.alert("Hata", "Ortak çıkarılamadı");
          }
        }
      }
    ]);
  };

  const handleLeaveFolder = async () => {
    Alert.alert("Klasörden Ayrıl", "Bu ortak klasörden ayrılmak istediğinize emin misiniz? Artık bu klasörün içeriğine erişemeyeceksiniz.", [
      { text: "İptal", style: "cancel" },
      {
        text: "Ayrıl",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.post(`${Config.API_URL}/api/folders/${selectedFolderId}/leave`);
            setSelectedFolderId(null);
            setCollaborationModalVisible(false);
            fetchFolders();
            fetchLinks();
            Alert.alert("Ayrıldınız", "Klasörden başarıyla ayrıldınız.");
          } catch (error) {
            Alert.alert("Hata", "Klasörden ayrılamadı");
          }
        }
      }
    ]);
  };

  // Reminder Actions (Daha Sonra Oku Hatırlatıcıları)
  const handleScheduleReminder = async (
    link: any,
    delayType: "1hour" | "evening" | "tomorrow" | "nextweek" | "instant" | "custom",
    customDate?: Date
  ) => {
    try {
      // 1. Request permissions first just in case (Native only)
      if (Platform.OS !== "web") {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          const req = await Notifications.requestPermissionsAsync();
          if (req.status !== "granted") {
            Alert.alert("İzin Gerekli", "Hatırlatıcı eklemek için bildirim izinlerini onaylamanız gerekmektedir.");
            return;
          }
        }
      }

      // 2. Calculate delay in seconds
      let delaySeconds = 0;
      let delayText = "";

      const now = new Date();
      if (delayType === "instant") {
        delaySeconds = 10; // 10 seconds (for instant testing!)
        delayText = "10 saniye sonra";
      } else if (delayType === "1hour") {
        delaySeconds = 60 * 60; // 1 hour
        delayText = "1 saat sonra";
      } else if (delayType === "evening") {
        const target = new Date();
        target.setHours(20, 0, 0, 0);
        if (target.getTime() <= now.getTime()) {
          target.setDate(target.getDate() + 1);
        }
        delaySeconds = Math.max(1, Math.round((target.getTime() - now.getTime()) / 1000));
        delayText = "bu akşam saat 20:00'de";
      } else if (delayType === "tomorrow") {
        const target = new Date();
        target.setDate(target.getDate() + 1);
        target.setHours(9, 0, 0, 0);
        delaySeconds = Math.max(1, Math.round((target.getTime() - now.getTime()) / 1000));
        delayText = "yarın sabah saat 09:00'da";
      } else if (delayType === "nextweek") {
        const target = new Date();
        target.setDate(target.getDate() + ((1 + 7 - target.getDay()) % 7 || 7));
        target.setHours(9, 0, 0, 0);
        delaySeconds = Math.max(1, Math.round((target.getTime() - now.getTime()) / 1000));
        delayText = "gelecek Pazartesi sabah saat 09:00'da";
      } else if (delayType === "custom" && customDate) {
        const diffMs = customDate.getTime() - now.getTime();
        if (diffMs <= 0) {
          Alert.alert("Geçersiz Zaman", "Lütfen gelecekteki bir tarih ve saat seçin.");
          return;
        }
        delaySeconds = Math.max(1, Math.round(diffMs / 1000));
        delayText = `${customDate.toLocaleDateString("tr-TR")} saat ${customDate.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })} için`;
      }

      // 3. Cancel any existing reminder for this specific link first
      const existing = reminders.find((r) => r.linkId === link._id);
      if (existing && Platform.OS !== "web") {
        await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
      }

      // 4. Schedule local notification / Web simulated notification
      let notificationId = "";
      if (Platform.OS === "web") {
        notificationId = `web-${Date.now()}-${Math.random()}`;
        // Standard Web simulator using setTimeout
        setTimeout(() => {
          const message = `Daha Sonra Oku 🔔\n\nKaydettiğin "${link.title || 'bağlantıya'}" göz atmak ister misin?\n\nLink: ${link.url}`;
          if (confirm(message)) {
            Linking.openURL(link.url).catch((err) => console.error("Failed to open URL:", err));
          }
        }, delaySeconds * 1000);
      } else {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Daha Sonra Oku 🔔",
            body: `Kaydettiğin "${link.title || 'bağlantıya'}" göz atmak ister misin?`,
            data: { url: link.url },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: delaySeconds,
          },
        });
      }

      // 5. Update state and AsyncStorage
      const updatedReminders = reminders.filter((r) => r.linkId !== link._id);
      const newReminders = [...updatedReminders, { linkId: link._id, notificationId }];
      
      setReminders(newReminders);
      await AsyncStorage.setItem("activeReminders", JSON.stringify(newReminders));
      setReminderDialogVisible(false);

      Alert.alert(
        "Hatırlatıcı Kuruldu 🔔",
        `"${link.title || 'Bağlantı'}" için hatırlatıcı ${delayText} çalışacak şekilde başarıyla ayarlandı.`
      );
    } catch (error) {
      console.error("Failed to schedule reminder:", error);
      Alert.alert("Hata", "Hatırlatıcı kurulurken bir hata oluştu.");
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(customReminderDate);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setCustomReminderDate(newDate);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(customReminderDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setCustomReminderDate(newDate);
    }
  };

  const handleCancelReminder = async (linkId: string) => {
    try {
      const existing = reminders.find((r) => r.linkId === linkId);
      if (existing) {
        if (Platform.OS !== "web") {
          await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
        }
        
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
      await AsyncStorage.setItem("smartRemindersEnabled", JSON.stringify(enabled));

      const smartNotificationId = await AsyncStorage.getItem("smartNotificationId");
      if (smartNotificationId) {
        if (Platform.OS !== "web") {
          await Notifications.cancelScheduledNotificationAsync(smartNotificationId);
        }
        await AsyncStorage.removeItem("smartNotificationId");
      }

      if (enabled) {
        let notificationId = "";
        if (Platform.OS === "web") {
          notificationId = `web-smart-${Date.now()}`;
          Alert.alert("Akıllı Hatırlatıcı Aktif 🔔", "Haftalık akıllı okuma listesi önerileri başarıyla etkinleştirildi!");
        } else {
          notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Haftalık Akıllı Hatırlatıcı 🔔",
              body: "Pazartesi günü kaydettiğin bağlantıları incelemek ve okuma listeni düzenlemek ister misin?",
              data: { url: Config.API_URL + "/bio" },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: 7 * 24 * 60 * 60,
              repeats: true,
            },
          });
        }
        await AsyncStorage.setItem("smartNotificationId", notificationId);
        if (Platform.OS !== "web") {
          Alert.alert("Akıllı Hatırlatıcı Aktif 🔔", "Haftalık akıllı okuma listesi önerileri başarıyla etkinleştirildi!");
        }
      } else {
        Alert.alert("Devre Dışı Bırakıldı 🔕", "Akıllı okuma hatırlatıcıları kapatıldı.");
      }
    } catch (error) {
      console.error("Smart reminder toggle failed:", error);
    }
  };

  // Link Actions
  const deleteLinkItem = async (id: string) => {
    try {
      await axios.delete(`${Config.API_URL}/api/links/${id}`);
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
    setSavingClipboard(true);
    try {
      await axios.post(`${Config.API_URL}/api/links`, {
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
      if (!token) return;
      setLoading(true);
      Promise.all([fetchLinks(), fetchFolders(), fetchProfile()]).finally(() => setLoading(false));
    }, [token])
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
      <View style={[styles.center, { backgroundColor: "#0f0c20", marginTop: 0 }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Render Auth overlay if no token
  if (!token) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <View style={styles.container}>
      <View style={{ paddingVertical: 8, backgroundColor: "white", elevation: 2 }}>
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
      <View style={{ backgroundColor: "white", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="titleMedium" style={{ fontWeight: "bold", color: "#333" }}>Klasörler</Text>
          <Button icon="folder-edit-outline" compact mode="text" onPress={() => setManageFoldersVisible(true)}>
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
            style={{ marginRight: 8, backgroundColor: selectedFolderId === null ? theme.colors.primaryContainer : "#f5f5f5" }}
            textStyle={{ color: selectedFolderId === null ? theme.colors.onPrimaryContainer : "#666" }}
            showSelectedOverlay
            icon="folder-open"
          >
            Tümü
          </Chip>
          {folders.map((folder) => {
            const isCollaborated = folder.owner && folder.owner._id !== currentUser?.id;
            const isShared = folder.collaborators && folder.collaborators.length > 0;
            const chipIcon = isCollaborated || isShared 
              ? "account-multiple" 
              : (folder.isPublic ? "earth" : (folder.icon || "folder"));

            return (
              <Chip
                key={folder._id}
                selected={selectedFolderId === folder._id}
                onPress={() => setSelectedFolderId(folder._id)}
                style={{
                  marginRight: 8,
                  backgroundColor: selectedFolderId === folder._id ? folder.color : "#f5f5f5",
                  borderColor: folder.color,
                  borderWidth: selectedFolderId === folder._id ? 0 : 1,
                }}
                textStyle={{
                  color: selectedFolderId === folder._id ? "#fff" : "#333",
                  fontWeight: selectedFolderId === folder._id ? "bold" : "normal"
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
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: "#333" }}>
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
            {currentFolder.collaborators && currentFolder.collaborators.slice(0, 3).map((col: any) => (
              <View 
                key={col._id} 
                style={[styles.avatarBubble, { backgroundColor: currentFolder.color || "#6200ee" }]}
              >
                <Text style={styles.avatarText}>
                  {(col.username || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
            {currentFolder.collaborators && currentFolder.collaborators.length > 3 && (
              <View style={[styles.avatarBubble, { backgroundColor: "#666" }]}>
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
                <Text style={{ textAlign: "center", marginVertical: 20, color: "#666" }}>Henüz klasör oluşturulmadı.</Text>
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
                        borderBottomColor: "#eee"
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <IconButton
                          icon={folder.icon || "folder"}
                          size={20}
                          iconColor="white"
                          style={{ backgroundColor: folder.color || "#6200ee", marginRight: 8, margin: 0 }}
                        />
                        <View>
                          <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>{folder.name}</Text>
                          {folder.isPublic && (
                            <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: "bold" }}>
                              🌐 Herkese Açık
                            </Text>
                          )}
                          {isCollaborated && (
                            <Text variant="labelSmall" style={{ color: "#d32f2f", fontWeight: "bold" }}>
                              👥 Ortak Çalışma (Sahibi: @{folder.owner?.username})
                            </Text>
                          )}
                          {!isCollaborated && folder.collaborators?.length > 0 && (
                            <Text variant="labelSmall" style={{ color: "#2e7d32", fontWeight: "bold" }}>
                              👥 Paylaşımlı ({folder.collaborators.length} ortak)
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
            <Button onPress={() => setManageFoldersVisible(false)}>Kapat</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Create/Edit Folder Form Dialog */}
        <Dialog
          visible={folderFormVisible}
          onDismiss={() => setFolderFormVisible(false)}
        >
          <Dialog.Title>{editingFolder ? "Klasörü Düzenle" : "Yeni Klasör Oluştur"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Klasör Adı"
              value={folderName}
              onChangeText={setFolderName}
              mode="outlined"
              style={{ marginBottom: 16 }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text variant="labelMedium" style={{ fontWeight: "bold" }}>Herkese Açık</Text>
                <Text variant="bodySmall" style={{ color: "#666" }}>Bio sayfasında klasör içeriğini gösterir</Text>
              </View>
              <Switch
                value={folderIsPublic}
                onValueChange={setFolderIsPublic}
                color={folderColor}
              />
            </View>
            
            <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: "bold" }}>Renk Seçin</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16, justifyContent: "space-between" }}>
              {FOLDER_COLORS.map((c) => (
                <View
                  key={c}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: c,
                    margin: 4,
                    borderWidth: folderColor === c ? 3 : 0,
                    borderColor: "#333",
                  }}
                  onTouchEnd={() => setFolderColor(c)}
                />
              ))}
            </View>

            <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: "bold" }}>İkon Seçin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {FOLDER_ICONS.map((i) => (
                <IconButton
                  key={i}
                  icon={i}
                  size={24}
                  selected={folderIcon === i}
                  onPress={() => setFolderIcon(i)}
                  iconColor={folderIcon === i ? "white" : "#666"}
                  style={{
                    backgroundColor: folderIcon === i ? folderColor : "#f0f0f0",
                    marginRight: 8,
                  }}
                />
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFolderFormVisible(false)}>İptal</Button>
            <Button mode="contained" onPress={handleCreateOrUpdateFolder}>Kaydet</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Bio Page Settings Dialog */}
        <Dialog
          visible={bioSettingsVisible}
          onDismiss={() => setBioSettingsVisible(false)}
        >
          <Dialog.Title>Bio Sayfası Ayarları</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 350 }}>
              <TextInput
                label="Ad Soyad"
                value={profileName}
                onChangeText={setProfileName}
                mode="outlined"
                style={{ marginBottom: 12 }}
              />
              
              <TextInput
                label="Kısa Açıklama (Bio)"
                value={profileBio}
                onChangeText={setProfileBio}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ marginBottom: 12 }}
              />

              <TextInput
                label="Profil Fotoğrafı URL (Avatar)"
                value={profileAvatarUrl}
                onChangeText={setProfileAvatarUrl}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="url"
                style={{ marginBottom: 16 }}
              />

              <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: "bold" }}>Görsel Tema</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8, gap: 8 }}>
                {[
                  { id: "purple-dark", name: "Mor Karanlık", bg: "#1f1c2c", text: "#fff" },
                  { id: "sunset", name: "Günbatımı", bg: "#ff5e62", text: "#fff" },
                  { id: "nordic-light", name: "Kuzey Işığı", bg: "#eef2f3", text: "#2c3e50" },
                  { id: "glassmorphic", name: "Buzlu Cam", bg: "#1a1a2e", text: "#fff" }
                ].map((t) => (
                  <Chip
                    key={t.id}
                    selected={profileTheme === t.id}
                    onPress={() => setProfileTheme(t.id)}
                    style={{
                      backgroundColor: profileTheme === t.id ? t.bg : "#f0f0f0",
                      borderColor: profileTheme === t.id ? theme.colors.primary : "#ccc",
                      borderWidth: profileTheme === t.id ? 2 : 0,
                      marginRight: 4,
                      marginBottom: 8,
                    }}
                    textStyle={{
                      color: profileTheme === t.id ? t.text : "#333",
                      fontWeight: profileTheme === t.id ? "bold" : "normal"
                    }}
                  >
                    {t.name}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBioSettingsVisible(false)} disabled={savingProfile}>İptal</Button>
            <Button mode="contained" onPress={handleSaveProfile} loading={savingProfile} disabled={savingProfile}>Kaydet</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Folder Collaboration Settings Dialog */}
        <Dialog
          visible={collaborationModalVisible}
          onDismiss={() => setCollaborationModalVisible(false)}
        >
          <Dialog.Title>👥 Ortak Çalışma Ayarları</Dialog.Title>
          <Dialog.Content>
            {currentFolder && (
              <ScrollView style={{ maxHeight: 350 }}>
                <Text variant="labelMedium" style={{ fontWeight: "bold", marginBottom: 8, color: "#333" }}>
                  Klasör: {currentFolder.name}
                </Text>
                
                {/* Active Members List */}
                <Text variant="labelSmall" style={{ fontWeight: "bold", color: "#666", marginBottom: 6 }}>
                  Aktif Üyeler:
                </Text>
                
                {/* Owner */}
                <View style={styles.collabMemberRow}>
                  <IconButton icon="crown" iconColor="#fbc02d" size={20} style={{ margin: 0 }} />
                  <Text variant="bodyMedium" style={{ flex: 1, fontWeight: "bold" }}>
                    @{currentFolder.owner?.username || "Bilinmiyor"} (Klasör Sahibi)
                  </Text>
                </View>

                {/* Collaborators */}
                {currentFolder.collaborators && currentFolder.collaborators.length === 0 ? (
                  <Text style={styles.emptyCollabText}>Henüz bir ortak eklenmemiş.</Text>
                ) : (
                  currentFolder.collaborators && currentFolder.collaborators.map((col: any) => {
                    const isCurrentUserOwner = currentFolder.owner?._id === currentUser?.id;
                    
                    return (
                      <View key={col._id} style={styles.collabMemberRow}>
                        <IconButton icon="account" iconColor="#666" size={20} style={{ margin: 0 }} />
                        <Text variant="bodyMedium" style={{ flex: 1 }}>
                          @{col.username}
                        </Text>
                        {isCurrentUserOwner && (
                          <IconButton
                            icon="account-remove"
                            iconColor="#d32f2f"
                            size={20}
                            style={{ margin: 0 }}
                            onPress={() => handleRemoveCollaborator(col._id)}
                          />
                        )}
                      </View>
                    );
                  })
                )}

                {/* Section to invite collaborators (Owner Only) */}
                {currentFolder.owner?._id === currentUser?.id ? (
                  <View style={{ marginTop: 16, borderTopWidth: 0.5, borderTopColor: "#eee", paddingTop: 16 }}>
                    <Text variant="labelSmall" style={{ fontWeight: "bold", color: "#666", marginBottom: 8 }}>
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
                        style={{ flex: 1, height: 42, backgroundColor: "#fff" }}
                      />
                      <Button
                        mode="contained"
                        onPress={handleAddCollaborator}
                        loading={inviting}
                        disabled={inviting}
                        style={{ marginLeft: 8, height: 42, justifyContent: "center" }}
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
                    onPress={handleLeaveFolder}
                    style={{ marginTop: 24 }}
                  >
                    Bu Klasörden Ayrıl
                  </Button>
                )}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCollaborationModalVisible(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>

        {/* "Daha Sonra Oku" Hatırlatıcı Ayarları Dialog */}
        <Dialog
          visible={reminderDialogVisible}
          onDismiss={() => setReminderDialogVisible(false)}
        >
          <Dialog.Title>🔔 Hatırlatıcı Ayarla</Dialog.Title>
          <Dialog.Content>
            {selectedReminderLink && (
              <ScrollView style={{ maxHeight: 350 }}>
                <Text variant="titleSmall" style={{ fontWeight: "bold", marginBottom: 4, color: "#333" }}>
                  Seçilen Bağlantı:
                </Text>
                <Text variant="bodyMedium" style={{ color: "#666", marginBottom: 16 }} numberOfLines={2}>
                  {selectedReminderLink.title || selectedReminderLink.url}
                </Text>

                <Text variant="labelLarge" style={{ fontWeight: "bold", marginBottom: 10, color: "#333" }}>
                  Hızlı Hatırlatma Zamanı Seçin:
                </Text>
                
                <View style={{ gap: 8, marginBottom: 16 }}>
                  <Button
                    mode="outlined"
                    icon="clock-outline"
                    onPress={() => handleScheduleReminder(selectedReminderLink, "1hour")}
                    style={{ justifyContent: "flex-start" }}
                    contentStyle={{ justifyContent: "flex-start" }}
                  >
                    1 Saat Sonra
                  </Button>
                  <Button
                    mode="outlined"
                    icon="weather-night"
                    onPress={() => handleScheduleReminder(selectedReminderLink, "evening")}
                    style={{ justifyContent: "flex-start" }}
                    contentStyle={{ justifyContent: "flex-start" }}
                  >
                    Bu Akşam (20:00)
                  </Button>
                  <Button
                    mode="outlined"
                    icon="weather-sunset-up"
                    onPress={() => handleScheduleReminder(selectedReminderLink, "tomorrow")}
                    style={{ justifyContent: "flex-start" }}
                    contentStyle={{ justifyContent: "flex-start" }}
                  >
                    Yarın Sabah (09:00)
                  </Button>
                  <Button
                    mode="outlined"
                    icon="calendar-week"
                    onPress={() => handleScheduleReminder(selectedReminderLink, "nextweek")}
                    style={{ justifyContent: "flex-start" }}
                    contentStyle={{ justifyContent: "flex-start" }}
                  >
                    Gelecek Hafta (Pazartesi 09:00)
                  </Button>
                  
                  {/* Test Button for instant testing */}
                  <Button
                    mode="contained"
                    buttonColor="#ffb300"
                    textColor="#fff"
                    icon="timer-sand"
                    onPress={() => handleScheduleReminder(selectedReminderLink, "instant")}
                    style={{ justifyContent: "flex-start", marginTop: 4 }}
                    contentStyle={{ justifyContent: "flex-start" }}
                  >
                    10 Saniye Sonra (Hızlı Test ⏱️)
                  </Button>
                </View>

                <Text variant="labelLarge" style={{ fontWeight: "bold", marginTop: 8, marginBottom: 8, color: "#333" }}>
                  📅 Veya Özel Tarih & Saat Seç:
                </Text>
                
                {Platform.OS === "web" ? (
                  <View style={{ marginBottom: 16 }}>
                    <TextInput
                      label="Hatırlatma Tarihi ve Saati"
                      mode="outlined"
                      value={webCustomDateTime}
                      onChangeText={setWebCustomDateTime}
                      right={<TextInput.Icon icon="calendar-clock" />}
                      style={{ marginBottom: 8, backgroundColor: "white" }}
                      {...({ type: "datetime-local" } as any)}
                    />
                    <Button
                      mode="contained"
                      icon="bell-plus"
                      disabled={!webCustomDateTime}
                      onPress={() => {
                        if (webCustomDateTime) {
                          const chosenDate = new Date(webCustomDateTime);
                          handleScheduleReminder(selectedReminderLink, "custom", chosenDate);
                        }
                      }}
                      style={{ marginTop: 4 }}
                    >
                      Özel Hatırlatıcıyı Kur
                    </Button>
                  </View>
                ) : (
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                      <Button
                        mode="outlined"
                        icon="calendar"
                        style={{ flex: 1 }}
                        onPress={() => setShowDatePicker(true)}
                      >
                        {customReminderDate.toLocaleDateString("tr-TR")}
                      </Button>
                      <Button
                        mode="outlined"
                        icon="clock"
                        style={{ flex: 1 }}
                        onPress={() => setShowTimePicker(true)}
                      >
                        {customReminderDate.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                      </Button>
                    </View>
                    <Button
                      mode="contained"
                      icon="bell-plus"
                      onPress={() => handleScheduleReminder(selectedReminderLink, "custom", customReminderDate)}
                      style={{ marginTop: 4 }}
                    >
                      Özel Hatırlatıcıyı Kur
                    </Button>
                  </View>
                )}

                {/* Cancel existing reminder if scheduled */}
                {reminders.some((r) => r.linkId === selectedReminderLink._id) && (
                  <Button
                    mode="contained"
                    buttonColor="#d32f2f"
                    icon="bell-off"
                    onPress={() => handleCancelReminder(selectedReminderLink._id)}
                    style={{ marginBottom: 20, marginTop: 8 }}
                  >
                    Mevcut Hatırlatıcıyı İptal Et
                  </Button>
                )}

                <View style={{ borderTopWidth: 0.5, borderTopColor: "#eee", paddingTop: 16, marginTop: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text variant="labelLarge" style={{ fontWeight: "bold", color: "#333" }}>
                        Haftalık Akıllı Hatırlatıcı
                      </Text>
                      <Text variant="bodySmall" style={{ color: "#666" }}>
                        Her hafta saved links listenden unuttuğun linkleri hatırlatır.
                      </Text>
                    </View>
                    <Switch
                      value={smartRemindersEnabled}
                      onValueChange={handleToggleSmartReminders}
                      color="#6200ee"
                    />
                  </View>
                </View>
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReminderDialogVisible(false)}>Vazgeç</Button>
          </Dialog.Actions>
        </Dialog>

        {showDatePicker && (
          <DateTimePicker
            value={customReminderDate}
            mode="date"
            display="default"
            onChange={onChangeDate}
            minimumDate={new Date()}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={customReminderDate}
            mode="time"
            display="default"
            onChange={onChangeTime}
          />
        )}
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

      <FAB icon="plus" style={styles.fab} onPress={() => router.push("/add")} />

      {/* Clipboard Prompt UI */}
      {showClipboardPrompt && clipboardUrl && (
        <View style={styles.clipboardCardContainer}>
          <View style={styles.clipboardCard}>
            <View style={styles.clipboardHeader}>
              <IconButton icon="content-copy" size={24} iconColor={theme.colors.primary} style={{ margin: 0 }} />
              <Text variant="titleMedium" style={styles.clipboardTitle}>Panoda Link Algılandı</Text>
            </View>
            <Text variant="bodyMedium" numberOfLines={1} style={styles.clipboardUrlText}>
              {clipboardUrl}
            </Text>

            {folders.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text variant="labelSmall" style={{ marginBottom: 6, fontWeight: "bold", color: "#666" }}>
                  Klasör Seçin (İsteğe Bağlı):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Chip
                    selected={clipboardFolderId === null}
                    onPress={() => setClipboardFolderId(null)}
                    style={{ marginRight: 6, height: 32, backgroundColor: clipboardFolderId === null ? theme.colors.primaryContainer : "#f5f5f5" }}
                    textStyle={{ fontSize: 11, color: clipboardFolderId === null ? theme.colors.onPrimaryContainer : "#666" }}
                    showSelectedOverlay
                    compact
                  >
                    Yok
                  </Chip>
                  {folders.map((f) => (
                    <Chip
                      key={f._id}
                      selected={clipboardFolderId === f._id}
                      onPress={() => setClipboardFolderId(f._id)}
                      style={{
                        marginRight: 6,
                        height: 32,
                        backgroundColor: clipboardFolderId === f._id ? f.color : "#f5f5f5",
                        borderColor: f.color,
                        borderWidth: clipboardFolderId === f._id ? 0 : 1,
                      }}
                      textStyle={{
                        color: clipboardFolderId === f._id ? "#fff" : "#333",
                        fontWeight: clipboardFolderId === f._id ? "bold" : "normal",
                        fontSize: 11
                      }}
                      showSelectedOverlay
                      compact
                      icon={f.icon || "folder"}
                    >
                      {f.name}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.clipboardActions}>
              <Button mode="text" onPress={handleDismissClipboard} disabled={savingClipboard}>
                İptal
              </Button>
              <Button mode="contained" onPress={handleSaveClipboard} loading={savingClipboard} disabled={savingClipboard} style={{ marginLeft: 8 }}>
                Kaydet
              </Button>
            </View>
          </View>
        </View>
      )}
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
  clipboardCardContainer: {
    position: "absolute",
    bottom: 90,
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 100,
  },
  clipboardCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  clipboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  clipboardTitle: {
    fontWeight: "bold",
    marginLeft: 8,
  },
  clipboardUrlText: {
    color: "#666",
    marginBottom: 16,
  },
  clipboardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
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
