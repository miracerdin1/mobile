import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Linking,
} from "react-native";
import {
  ActivityIndicator,
  FAB,
  IconButton,
  Portal,
  Text,
  useTheme,
  Dialog,
  Button,
} from "react-native-paper";
import * as Notifications from "expo-notifications";
import { useAuth } from "../context/AuthContext";
import { connectSocket, disconnectSocket } from "../services/socket";

// Import modular components
import BioSettingsDialog from "../components/BioSettingsDialog";
import FolderFormDialog from "../components/FolderFormDialog";
import CollaborationDialog from "../components/CollaborationDialog";
import ReminderDialog from "../components/ReminderDialog";
import ClipboardPrompt from "../components/ClipboardPrompt";
import HomeHeader from "../components/HomeHeader";
import CategoryTabs from "../components/CategoryTabs";
import FolderList from "../components/FolderList";
import LinkList from "../components/LinkList";
import { PaywallModal } from "../components/PaywallModal";

// Import modular hooks
import { useProfile } from "../hooks/useProfile";
import { useClipboardPoller } from "../hooks/useClipboardPoller";
import { useReminders } from "../hooks/useReminders";
import { useFolders } from "../hooks/useFolders";
import { useLinks } from "../hooks/useLinks";
import { useCategories } from "../hooks/useCategories";

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
  const {
    token,
    user: currentUser,
    isAuthenticated,
    logout: contextLogout,
    loading: authLoading,
  } = useAuth();

  // 1. Categories Hook
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    manageCategoriesVisible,
    setManageCategoriesVisible,
    moveCategory,
  } = useCategories();

  // Search & Folder States
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 2. Links Hook (dependencies will fetch once selection is made)
  const {
    links,
    setLinks,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    linksError,
    fetchLinks,
    handleDelete,
  } = useLinks(selectedFolderId);

  // 3. Folders Hook
  const {
    folders,
    setFolders,
    manageFoldersVisible,
    setManageFoldersVisible,
    folderFormVisible,
    setFolderFormVisible,
    editingFolder,
    setEditingFolder,
    folderName,
    setFolderName,
    folderColor,
    setFolderColor,
    folderIcon,
    setFolderIcon,
    folderIsPublic,
    setFolderIsPublic,
    collaborationModalVisible,
    setCollaborationModalVisible,
    inviteUsernameOrEmail,
    setInviteUsernameOrEmail,
    inviting,
    fetchFolders,
    handleCreateOrUpdateFolder,
    handleDeleteFolder,
    handleAddCollaborator,
    handleRemoveCollaborator,
    handleLeaveFolder,
    foldersError,
    paywallVisible,
    setPaywallVisible,
    paywallReason,
  } = useFolders({
    selectedFolderId,
    setSelectedFolderId,
    onRefreshLinks: () => fetchLinks(),
  });

  // 4. Profile Hook
  const {
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
  } = useProfile();

  // 5. Clipboard Poller Hook
  const {
    clipboardUrl,
    showClipboardPrompt,
    savingClipboard,
    clipboardFolderId,
    setClipboardFolderId,
    handleSaveClipboard,
    handleDismissClipboard,
  } = useClipboardPoller(fetchLinks);

  // 6. Reminders Hook
  const {
    reminders,
    reminderDialogVisible,
    setReminderDialogVisible,
    selectedReminderLink,
    setSelectedReminderLink,
    smartRemindersEnabled,
    customReminderDate,
    setCustomReminderDate,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    webCustomDateTime,
    setWebCustomDateTime,
    handleScheduleReminder,
    handleCancelReminder,
    handleToggleSmartReminders,
  } = useReminders();

  // 1. Initial Authentication Check handled by AuthContext
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
      setLoading(true);
      Promise.all([fetchLinks(), fetchFolders(), fetchProfile()]).finally(() =>
        setLoading(false),
      );
    } else if (!authLoading) {
      disconnectSocket();
      setLinks([]);
      setFolders([]);
      setSelectedFolderId(null);
    }
  }, [isAuthenticated, token, authLoading, fetchLinks, fetchFolders, fetchProfile, setSelectedFolderId, setFolders, setLinks, setLoading]);

  // Notifications clicked event listener (Native only)
  useEffect(() => {
    if (Platform.OS !== "web") {
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

  const handleLogout = useCallback(async () => {
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
  }, [contextLogout]);

  // Set navigation header actions dynamically
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
    handleLogout,
    handleShareProfile,
    setBioSettingsVisible,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLinks(), fetchFolders(), fetchProfile()]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      setLoading(true);
      Promise.all([fetchLinks(), fetchFolders(), fetchProfile()]).finally(() =>
        setLoading(false),
      );
    }, [isAuthenticated, fetchLinks, fetchFolders, fetchProfile, setLoading]),
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

  const fetchError = linksError || foldersError || profileError;

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

  return (
    <View style={styles.container}>
      <HomeHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Plan & Quota Tracking Bar */}
      {currentUser && (
        <View style={{
          backgroundColor: '#ffffff',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: currentUser.plan === 'pro' ? '#FFF9C4' : '#F5F5F5',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              marginRight: 8,
              borderWidth: 1,
              borderColor: currentUser.plan === 'pro' ? '#FBC02D' : '#E0E0E0'
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '900',
                color: currentUser.plan === 'pro' ? '#F57F17' : '#616161'
              }}>
                {currentUser.plan === 'pro' ? '👑 PRO ÜYE' : '🆓 FREE ÜYE'}
              </Text>
            </View>
            {currentUser.plan !== 'pro' && (
              <Text style={{ fontSize: 12, color: '#616161', fontWeight: '500' }}>
                Kota: {links.length} / 30 Link
              </Text>
            )}
          </View>
          {currentUser.plan !== 'pro' ? (
            <TouchableOpacity onPress={() => setPaywallVisible(true)}>
              <Text style={{ fontSize: 12, color: '#6C63FF', fontWeight: 'bold' }}>
                Sınırları Kaldır ⚡
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ fontSize: 12, color: '#4CAF50', fontWeight: 'bold' }}>
              Sınırsız Arşiv Aktif ✨
            </Text>
          )}
        </View>
      )}

      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onManageCategories={() => setManageCategoriesVisible(true)}
      />

      <FolderList
        folders={folders}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolderId}
        onManageFolders={() => setManageFoldersVisible(true)}
        onCreateFolder={() => {
          setEditingFolder(null);
          setFolderName("");
          setFolderColor("#6200ee");
          setFolderIcon("folder");
          setFolderIsPublic(false);
          setFolderFormVisible(true);
        }}
        currentUser={currentUser}
        theme={theme}
      />

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
                            folder.collaborators &&
                            folder.collaborators.length > 0 && (
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

        {/* Pro Plan Paywall Modal */}
        <PaywallModal
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          reason={paywallReason}
        />
      </Portal>

      <LinkList
        loading={loading}
        filteredLinks={filteredLinks}
        folders={folders}
        refreshing={refreshing}
        onRefresh={onRefresh}
        handleDelete={handleDelete}
        onEdit={(id) => router.push(`/edit/${id}`)}
        onRemind={(item) => {
          setSelectedReminderLink(item);
          setReminderDialogVisible(true);
        }}
        reminders={reminders}
        listStyle={styles.list}
        centerStyle={styles.center}
      />

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
