import { useState, useCallback, useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import api from "../services/api";
import Config from "../constants/Config";
import { Link } from "~/types";
import { useAuth } from "../context/AuthContext";
import { connectSocket } from "../services/socket";

export function useLinks(selectedFolderId: string | null) {
  const { token, user: currentUser, isAuthenticated } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [linksError, setLinksError] = useState(false);

  const selectedFolderIdRef = useRef(selectedFolderId);
  useEffect(() => {
    selectedFolderIdRef.current = selectedFolderId;
  }, [selectedFolderId]);

  const fetchLinks = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    try {
      const response = await api.get(`${Config.API_URL}/api/links`);
      setLinks(response.data);
      setLinksError(false);
    } catch (err) {
      console.warn("Fetch links error:", err);
      setLinksError(true);
    }
  }, [isAuthenticated, token]);

  // Real-time link socket updates
  useEffect(() => {
    if (!token || !currentUser) return;

    const activeSocket = connectSocket(token);

    const handleLinkCreated = (newLink: any) => {
      console.log("[Socket Event] link_created received:", newLink._id);
      setLinks((prev) => {
        if (prev.some((l) => l._id === newLink._id)) return prev;
        if (
          selectedFolderIdRef.current &&
          newLink.folderId !== selectedFolderIdRef.current
        )
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

    activeSocket.on("link_created", handleLinkCreated);
    activeSocket.on("link_updated", handleLinkUpdated);
    activeSocket.on("link_deleted", handleLinkDeleted);

    return () => {
      activeSocket.off("link_created", handleLinkCreated);
      activeSocket.off("link_updated", handleLinkUpdated);
      activeSocket.off("link_deleted", handleLinkDeleted);
    };
  }, [token, currentUser]);

  const deleteLinkItem = useCallback(async (id: string) => {
    try {
      await api.delete(`${Config.API_URL}/api/links/${id}`);
      setLinks((prev) => prev.filter((link) => link._id !== id));
    } catch (err) {
      Alert.alert("Error", "Failed to delete link");
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (Platform.OS === "web") {
        if (confirm("Are you sure you want to delete this link?")) {
          await deleteLinkItem(id);
        }
      } else {
        Alert.alert(
          "Delete Link",
          "Are you sure you want to delete this link?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => deleteLinkItem(id),
            },
          ],
        );
      }
    },
    [deleteLinkItem],
  );

  return {
    links,
    setLinks,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    linksError,
    fetchLinks,
    deleteLinkItem,
    handleDelete,
  };
}
