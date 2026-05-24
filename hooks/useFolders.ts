import { useState, useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import api from "../services/api";
import Config from "../constants/Config";
import { Folder } from "~/types";
import { useAuth } from "../context/AuthContext";
import {
  connectSocket,
  joinFolderRoom,
  leaveFolderRoom,
} from "../services/socket";

interface UseFoldersProps {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  onRefreshLinks: () => void;
}

export function useFolders({
  selectedFolderId,
  setSelectedFolderId,
  onRefreshLinks,
}: UseFoldersProps) {
  const { token, user: currentUser, isAuthenticated } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [manageFoldersVisible, setManageFoldersVisible] = useState(false);
  const [folderFormVisible, setFolderFormVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#6200ee");
  const [folderIcon, setFolderIcon] = useState("folder");
  const [folderIsPublic, setFolderIsPublic] = useState(false);

  // Collaboration State
  const [collaborationModalVisible, setCollaborationModalVisible] =
    useState(false);
  const [inviteUsernameOrEmail, setInviteUsernameOrEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [foldersError, setFoldersError] = useState(false);

  // Paywall State
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState("");

  const onRefreshLinksRef = useRef(onRefreshLinks);
  useEffect(() => {
    onRefreshLinksRef.current = onRefreshLinks;
  }, [onRefreshLinks]);

  const selectedFolderIdRef = useRef(selectedFolderId);
  useEffect(() => {
    selectedFolderIdRef.current = selectedFolderId;
  }, [selectedFolderId]);

  const fetchFolders = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    try {
      const response = await api.get(`${Config.API_URL}/api/folders`);
      setFolders(response.data);
      setFoldersError(false);
    } catch (err) {
      console.warn("Fetch folders error:", err);
      setFoldersError(true);
    }
  }, [isAuthenticated, token]);

  // Join/leave folder room
  useEffect(() => {
    if (token && selectedFolderId) {
      joinFolderRoom(selectedFolderId, token);
      return () => {
        leaveFolderRoom(selectedFolderId);
      };
    }
  }, [selectedFolderId, token]);

  // Socket folder list / updates listeners
  useEffect(() => {
    if (!token || !currentUser) return;

    const activeSocket = connectSocket(token);

    const handleFolderUpdated = (updatedFolder: any) => {
      console.log("[Socket Event] folder_updated received:", updatedFolder._id);
      setFolders((prev) =>
        prev.map((f) => (f._id === updatedFolder._id ? updatedFolder : f)),
      );
    };

    const handleFolderDeleted = (data: { folderId: string }) => {
      console.log("[Socket Event] folder_deleted received:", data.folderId);
      setFolders((prev) => prev.filter((f) => f._id !== data.folderId));
      if (selectedFolderIdRef.current === data.folderId) {
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
        if (selectedFolderIdRef.current === data.folderId) {
          setSelectedFolderId(null);
        }
        fetchFolders();
        onRefreshLinksRef.current();
      }
    };

    const refreshEvent = `user_folder_list_refresh_${currentUser.id}`;
    const handleListRefresh = () => {
      console.log("[Socket Event] Folder list refresh triggered for user");
      fetchFolders();
      onRefreshLinksRef.current();
    };

    activeSocket.on("folder_updated", handleFolderUpdated);
    activeSocket.on("folder_deleted", handleFolderDeleted);
    activeSocket.on("user_removed", handleUserRemoved);
    activeSocket.on(refreshEvent, handleListRefresh);

    return () => {
      activeSocket.off("folder_updated", handleFolderUpdated);
      activeSocket.off("folder_deleted", handleFolderDeleted);
      activeSocket.off("user_removed", handleUserRemoved);
      activeSocket.off(refreshEvent, handleListRefresh);
    };
  }, [token, currentUser, fetchFolders, setSelectedFolderId]);

  const handleCreateOrUpdateFolder = useCallback(async () => {
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
    } catch (error: any) {
      if (error.response?.status === 402 || error.response?.data?.code === "QUOTA_EXCEEDED") {
        setPaywallReason(error.response?.data?.message || "Limit aşımı! Lütfen Pro plana yükseltin.");
        setPaywallVisible(true);
      } else {
        Alert.alert("Hata", "Klasör kaydedilemedi");
      }
    }
  }, [folderName, editingFolder, folderColor, folderIcon, folderIsPublic]);

  const handleDeleteFolder = useCallback(
    async (id: string) => {
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
                if (selectedFolderIdRef.current === id) {
                  setSelectedFolderId(null);
                }
                onRefreshLinksRef.current();
              } catch (error) {
                Alert.alert("Hata", "Klasör silinemedi");
              }
            },
          },
        ],
      );
    },
    [setSelectedFolderId],
  );

  const handleAddCollaborator = useCallback(async () => {
    if (!inviteUsernameOrEmail.trim()) {
      Alert.alert("Hata", "Lütfen bir kullanıcı adı veya e-posta girin");
      return;
    }
    if (!selectedFolderId) return;

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
      if (error.response?.status === 402 || error.response?.data?.code === "COLLABORATION_DISABLED") {
        setPaywallReason(error.response?.data?.message || "Bu özellik Pro üyeler içindir.");
        setPaywallVisible(true);
      } else {
        const errMsg = error.response?.data?.error || "Kullanıcı eklenemedi";
        Alert.alert("Hata", errMsg);
      }
    } finally {
      setInviting(false);
    }
  }, [inviteUsernameOrEmail, selectedFolderId]);

  const handleRemoveCollaborator = useCallback(
    async (colUserId: string) => {
      if (!selectedFolderId) return;

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
    },
    [selectedFolderId],
  );

  const handleLeaveFolder = useCallback(async () => {
    if (!selectedFolderId) return;

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
              onRefreshLinksRef.current();
              Alert.alert("Ayrıldınız", "Klasörden başarıyla ayrıldınız.");
            } catch (error) {
              Alert.alert("Hata", "Klasörden ayrılamadı");
            }
          },
        },
      ],
    );
  }, [selectedFolderId, fetchFolders, setSelectedFolderId]);

  return {
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
    setInviting,
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
  };
}
