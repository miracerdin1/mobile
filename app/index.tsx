import { useFocusEffect, useRouter, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  FAB,
  Icon,
  IconButton,
  Portal,
  Text,
} from "react-native-paper";
import * as Notifications from "expo-notifications";
import Animated, { ZoomIn, useReducedMotion } from "react-native-reanimated";
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
import AccountSettingsDialog from "../components/AccountSettingsDialog";
import PrimaryButton from "../components/PrimaryButton";
import AnimatedProgressBar from "../components/AnimatedProgressBar";
import AmbientBackground from "../components/AmbientBackground";
import { usePressAnimation } from "../hooks/usePressAnimation";
import { manageStoreSubscription } from "../services/storeBilling";
import { useAppTheme } from "../hooks/useAppTheme";

// Import modular hooks
import { useProfile } from "../hooks/useProfile";
import { useClipboardPoller } from "../hooks/useClipboardPoller";
import { useReminders } from "../hooks/useReminders";
import { useFolders } from "../hooks/useFolders";
import { useLinks } from "../hooks/useLinks";
import { useCategories } from "../hooks/useCategories";
import { useAccountDeletion } from "../hooks/useAccountDeletion";
import { useViewMode } from "../hooks/useViewMode";
import { filterLinks } from "../utils/linkFilters";
import { showAlert } from "../utils/alert";
import { normalizeHttpUrl } from "../utils/url";

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
  const theme = useAppTheme();
  const navigation = useNavigation();
  const reduceMotion = useReducedMotion();
  const {
    animatedStyle: fabAnimatedStyle,
    pressHandlers: fabPressHandlers,
    hoverHandlers: fabHoverHandlers,
  } = usePressAnimation({ pressScale: 0.92, hoverScale: 1.06, hoverLift: 3 });

  // Authentication State
  const {
    token,
    user: currentUser,
    isAuthenticated,
    logout: contextLogout,
    loading: authLoading,
  } = useAuth();

  const {
    accountSettingsVisible,
    setAccountSettingsVisible,
    closeAccountSettings,
    deletingAccount,
    requestAccountDeletion,
  } = useAccountDeletion(contextLogout);

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
    checkingBroken,
    checkBrokenLinks,
  } = useLinks(selectedFolderId);

  const { viewMode, toggleViewMode } = useViewMode();

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
    openBioSettings,
    closeBioSettings,
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
    checkClipboard,
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
            const safeUrl = normalizeHttpUrl(url);
            if (!safeUrl) return;

            Linking.openURL(safeUrl).catch((err) =>
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
        paddingRight: theme.spacing.sm,
      },
      headerRight: () => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
            paddingHorizontal: theme.spacing.xs + 2,
            height: 36,
            alignSelf: "center",
            gap: theme.spacing.xs + 2,
          }}
        >
          <IconButton
            icon="account-cog-outline"
            size={21}
            onPress={() => setAccountSettingsVisible(true)}
            iconColor={theme.colors.onSurfaceVariant}
            accessibilityLabel="Hesap ayarları"
            style={{ margin: 0, padding: 0, width: 36, height: 36, justifyContent: "center", alignItems: "center" }}
          />
          <IconButton
            icon="earth"
            size={21}
            onPress={openBioSettings}
            iconColor={theme.colors.onSurfaceVariant}
            accessibilityLabel="Bio sayfası ayarları"
            style={{ margin: 0, padding: 0, width: 36, height: 36, justifyContent: "center", alignItems: "center" }}
          />
          <IconButton
            icon="share-variant-outline"
            size={21}
            onPress={handleShareProfile}
            iconColor={theme.colors.onSurfaceVariant}
            accessibilityLabel="Profili paylaş"
            style={{ margin: 0, padding: 0, width: 36, height: 36, justifyContent: "center", alignItems: "center" }}
          />
          <IconButton
            icon="logout"
            size={21}
            onPress={handleLogout}
            iconColor={theme.colors.error}
            accessibilityLabel="Çıkış yap"
            style={{ margin: 0, padding: 0, width: 36, height: 36, justifyContent: "center", alignItems: "center" }}
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
    setAccountSettingsVisible,
    openBioSettings,
    theme,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLinks(), fetchFolders(), fetchProfile()]);
    setRefreshing(false);
  };

  const onCheckBrokenLinks = async () => {
    const result = await checkBrokenLinks();
    if (!result) return;

    const { checked, brokenCount } = result;
    if (checked === 0) {
      showAlert("Bakım", "Kontrol edilecek bağlantı bulunamadı.");
    } else if (brokenCount === 0) {
      showAlert("Bakım", `${checked} bağlantı kontrol edildi. Hepsi erişilebilir durumda.`);
    } else {
      showAlert(
        "Bakım",
        `${checked} bağlantı kontrol edildi. ${brokenCount} tanesi artık erişilemiyor — kartlarda "Erişilemiyor" etiketiyle işaretlendi.`,
      );
    }
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

  const currentFolder = selectedFolderId
    ? folders.find((f) => f._id === selectedFolderId)
    : null;

  const filteredLinks = useMemo(
    () =>
      filterLinks(links, {
        searchQuery,
        selectedCategory,
        selectedFolderId,
      }),
    [links, searchQuery, selectedCategory, selectedFolderId],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== "All" ||
    selectedFolderId !== null;

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedFolderId(null);
  }, [setSelectedCategory]);

  const fetchError = linksError || foldersError || profileError;

  const isPro = currentUser?.plan === "pro" || currentUser?.role === "admin";

  // Render Loader if authentication state is loading
  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <AmbientBackground>
      <HomeHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClipboardPress={() => checkClipboard(true)}
        totalCount={links.length}
        visibleCount={filteredLinks.length}
        activeCollectionName={currentFolder?.name}
      />

      {/* Plan & Quota Tracking Bar */}
      {currentUser && (
        <View
          style={{
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.md,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 928,
              alignSelf: "center",
              backgroundColor: isPro
                ? theme.app.warningContainer
                : theme.colors.surface,
              borderWidth: 1,
              borderColor: isPro
                ? theme.app.warning
                : theme.colors.outlineVariant,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing.sm + 2,
              paddingVertical: theme.spacing.sm,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, marginRight: theme.spacing.md }}>
              <Text
                variant="labelMedium"
                style={{
                  color: isPro
                    ? theme.app.onWarningContainer
                    : theme.colors.onSurface,
                  fontFamily: theme.fontFamily.semibold,
                }}
              >
                {currentUser.role === "admin"
                  ? "Yönetici hesabı"
                  : isPro
                    ? "Pro arşiv etkin"
                    : `${links.length} / 30 bağlantı`}
              </Text>
              {!isPro && (
                <AnimatedProgressBar
                  progress={links.length / 30}
                  style={{ maxWidth: 220, marginTop: 6 }}
                  accessibilityLabel={`30 bağlantılık kotanın ${links.length} tanesi dolu`}
                />
              )}
            </View>
            {!isPro ? (
              <TouchableOpacity
                onPress={() => setPaywallVisible(true)}
                accessibilityRole="button"
                style={{ minHeight: 40, justifyContent: "center" }}
              >
                <Text
                  variant="labelLarge"
                  style={{
                    color: theme.colors.primary,
                    fontFamily: theme.fontFamily.semibold,
                  }}
                >
                  Pro'ya geç
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                variant="labelMedium"
                style={{
                  color: theme.app.onWarningContainer,
                  fontFamily: theme.fontFamily.semibold,
                }}
              >
                Sınırsız
              </Text>
            )}
          </View>
        </View>
      )}

      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onManageCategories={() => setManageCategoriesVisible(true)}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        onOpenLibrary={() => router.push("/library")}
      />

      <FolderList
        folders={folders}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolderId}
        onManageFolders={() => setManageFoldersVisible(true)}
        onCreateFolder={() => {
          setEditingFolder(null);
          setFolderName("");
          setFolderColor(theme.colors.primary);
          setFolderIcon("folder");
          setFolderIsPublic(false);
          setFolderFormVisible(true);
        }}
        currentUser={currentUser}
      />

      {/* Connection error banner */}
      {fetchError && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.errorContainer,
            borderColor: theme.colors.error,
            borderWidth: 1,
            borderRadius: theme.radius.md,
            width: "92%",
            maxWidth: 928,
            alignSelf: "center",
            marginTop: theme.spacing.sm + theme.spacing.xs,
            marginBottom: theme.spacing.xs,
            padding: theme.spacing.sm + 2,
          }}
        >
          <Icon source="wifi-strength-alert-outline" color={theme.colors.error} size={22} />
          <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
            <Text variant="titleSmall" style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onErrorContainer }}>
              Bağlantı Hatası
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, lineHeight: 16 }}>
              Sunucuya ulaşılamadı. Bağlantını kontrol edip yeniden dene.
            </Text>
          </View>
          <IconButton
            icon="refresh"
            iconColor={theme.colors.error}
            size={22}
            onPress={onRefresh}
            accessibilityLabel="Yeniden dene"
            style={{ margin: 0 }}
          />
        </View>
      )}

      {/* Collaboration Banner inside custom selected folder */}
      {currentFolder && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.app.accentContainer,
            paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
            paddingVertical: theme.spacing.xs + 2,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outlineVariant,
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconButton
                icon={currentFolder.icon || "folder"}
                iconColor={currentFolder.color}
                size={20}
                style={{ margin: 0, padding: 0 }}
              />
              <Text variant="titleMedium" style={{ fontFamily: theme.fontFamily.semibold, color: theme.app.onAccentContainer }}>
                {currentFolder.name}
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.app.onAccentContainer, opacity: 0.8, marginLeft: theme.spacing.sm }}>
              {currentFolder.owner?._id === currentUser?.id
                ? "Klasör Sahibi: Sizsiniz"
                : `Sahibi: @${currentFolder.owner?.username || "Bilinmiyor"}`}
            </Text>
          </View>

          {/* Avatar stack display */}
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => setCollaborationModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Ortak çalışma ayarları"
          >
            {currentFolder.collaborators &&
              currentFolder.collaborators.slice(0, 3).map((col: any) => (
                <View
                  key={col._id}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: theme.radius.full,
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: -8,
                    borderWidth: 1.5,
                    borderColor: theme.colors.surface,
                    backgroundColor: currentFolder.color || theme.colors.primary,
                  }}
                >
                  <Text style={{ color: theme.app.onFolderColor, fontSize: 10, fontFamily: theme.fontFamily.bold }}>
                    {(col.username || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
            {currentFolder.collaborators && currentFolder.collaborators.length > 3 && (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: theme.radius.full,
                  justifyContent: "center",
                  alignItems: "center",
                  marginLeft: -8,
                  borderWidth: 1.5,
                  borderColor: theme.colors.surface,
                  backgroundColor: theme.colors.onSurfaceVariant,
                }}
              >
                <Text style={{ color: theme.app.onFolderColor, fontSize: 10, fontFamily: theme.fontFamily.bold }}>
                  +{currentFolder.collaborators.length - 3}
                </Text>
              </View>
            )}
            <IconButton
              icon="account-multiple-plus-outline"
              size={20}
              iconColor={theme.app.accent}
              style={{ margin: 0, marginLeft: theme.spacing.xs }}
            />
          </TouchableOpacity>
        </View>
      )}

      <Portal>
        {/* Account Settings Dialog */}
        <AccountSettingsDialog
          visible={accountSettingsVisible}
          onDismiss={closeAccountSettings}
          currentUser={currentUser}
          deletingAccount={deletingAccount}
          onDeleteAccount={requestAccountDeletion}
          onManageSubscription={() => manageStoreSubscription(currentUser)}
          checkingBroken={checkingBroken}
          onCheckBrokenLinks={onCheckBrokenLinks}
        />

        {/* Reorder Categories Dialog */}
        <Dialog
          visible={manageCategoriesVisible}
          onDismiss={() => setManageCategoriesVisible(false)}
          style={{ borderRadius: theme.radius.lg }}
        >
          <Dialog.Title>Kategorileri Sırala</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 300 }}>
              {categories.map((cat, index) => (
                <View
                  key={cat}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{cat}</Text>
                  {cat !== "All" && (
                    <View style={{ flexDirection: "row" }}>
                      <IconButton
                        icon="arrow-up"
                        size={20}
                        disabled={index <= 1}
                        iconColor={theme.colors.onSurfaceVariant}
                        onPress={() => moveCategory(index, "up")}
                      />
                      <IconButton
                        icon="arrow-down"
                        size={20}
                        disabled={index >= categories.length - 1}
                        iconColor={theme.colors.onSurfaceVariant}
                        onPress={() => moveCategory(index, "down")}
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setManageCategoriesVisible(false)} textColor={theme.colors.onSurfaceVariant}>
              Bitti
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Manage Folders Dialog */}
        <Dialog
          visible={manageFoldersVisible}
          onDismiss={() => setManageFoldersVisible(false)}
          style={{ borderRadius: theme.radius.lg }}
        >
          <Dialog.Title>Klasörleri Yönet</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 300 }}>
              {folders.length === 0 ? (
                <Text style={{ textAlign: "center", marginVertical: theme.spacing.lg, color: theme.colors.onSurfaceVariant }}>
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
                        marginBottom: theme.spacing.sm,
                        paddingVertical: theme.spacing.xs,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.outlineVariant,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <IconButton
                          icon={folder.icon || "folder"}
                          size={20}
                          iconColor={theme.app.onFolderColor}
                          style={{ backgroundColor: folder.color || theme.colors.primary, marginRight: theme.spacing.sm, margin: 0 }}
                        />
                        <View>
                          <Text variant="bodyMedium" style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}>
                            {folder.name}
                          </Text>
                          {folder.isPublic && (
                            <Text variant="labelSmall" style={{ color: theme.app.success, fontFamily: theme.fontFamily.semibold }}>
                              Herkese Açık
                            </Text>
                          )}
                          {isCollaborated && (
                            <Text variant="labelSmall" style={{ color: theme.app.accent, fontFamily: theme.fontFamily.semibold }}>
                              Ortak Çalışma (Sahibi: @{folder.owner?.username})
                            </Text>
                          )}
                          {!isCollaborated && folder.collaborators && folder.collaborators.length > 0 && (
                            <Text variant="labelSmall" style={{ color: theme.app.accent, fontFamily: theme.fontFamily.semibold }}>
                              Paylaşımlı ({folder.collaborators.length} ortak)
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={{ flexDirection: "row" }}>
                        {isOwner && (
                          <IconButton
                            icon="pencil-outline"
                            size={20}
                            iconColor={theme.colors.onSurfaceVariant}
                            accessibilityLabel={`${folder.name} klasörünü düzenle`}
                            onPress={() => {
                              setEditingFolder(folder);
                              setFolderName(folder.name);
                              setFolderColor(folder.color || theme.colors.primary);
                              setFolderIcon(folder.icon || "folder");
                              setFolderIsPublic(folder.isPublic || false);
                              setFolderFormVisible(true);
                            }}
                          />
                        )}
                        {isOwner ? (
                          <IconButton
                            icon="delete-outline"
                            size={20}
                            iconColor={theme.colors.error}
                            accessibilityLabel={`${folder.name} klasörünü sil`}
                            onPress={() => handleDeleteFolder(folder._id)}
                          />
                        ) : (
                          <IconButton
                            icon="logout"
                            size={20}
                            iconColor={theme.colors.error}
                            accessibilityLabel={`${folder.name} klasöründen ayrıl`}
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
            <PrimaryButton
              icon="plus"
              onPress={() => {
                setEditingFolder(null);
                setFolderName("");
                setFolderColor(theme.colors.primary);
                setFolderIcon("folder");
                setFolderIsPublic(false);
                setFolderFormVisible(true);
              }}
              style={{ marginTop: theme.spacing.md }}
            >
              Yeni Klasör Ekle
            </PrimaryButton>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setManageFoldersVisible(false)} textColor={theme.colors.onSurfaceVariant}>
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
          onDismiss={closeBioSettings}
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
        listStyle={{
          width: "100%",
          maxWidth: 960,
          alignSelf: "center",
          paddingTop: theme.spacing.sm,
          paddingBottom: 88,
        }}
        centerStyle={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: theme.spacing.lg,
          marginTop: theme.spacing.xl,
        }}
        isAuthenticated={isAuthenticated}
        onSignIn={() => router.push("/auth")}
        viewMode={viewMode}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <Animated.View
        entering={
          reduceMotion
            ? undefined
            : ZoomIn.springify()
                .damping(theme.motion.springPop.damping)
                .stiffness(theme.motion.springPop.stiffness)
                .mass(theme.motion.springPop.mass)
                .delay(theme.motion.slow)
        }
        style={[
          {
            position: "absolute",
            margin: theme.spacing.md,
            right: 0,
            bottom: 0,
            zIndex: 10,
          },
          fabAnimatedStyle,
        ]}
        {...fabHoverHandlers}
      >
        <FAB
          icon="plus"
          style={{ borderRadius: theme.radius.lg }}
          color={theme.colors.onPrimary}
          customSize={56}
          theme={{ colors: { primaryContainer: theme.colors.primary } }}
          accessibilityLabel="Yeni bağlantı ekle"
          // Paper spreads unknown props onto the FAB's TouchableRipple, so the
          // shared press handlers reach it even though its types omit them.
          {...fabPressHandlers}
          onPress={() => {
            if (!isAuthenticated) {
              router.push("/auth");
            } else {
              router.push("/add");
            }
          }}
        />
      </Animated.View>

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
      />
    </AmbientBackground>
  );
}
