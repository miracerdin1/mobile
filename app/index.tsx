import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
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
} from "react-native-paper";
import LinkCard from "../components/LinkCard";
import Config from "../constants/Config";

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

  // Custom Folders & Collections State
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [manageFoldersVisible, setManageFoldersVisible] = useState(false);
  const [folderFormVisible, setFolderFormVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#6200ee");
  const [folderIcon, setFolderIcon] = useState("folder");

  const checkClipboard = async () => {
    try {
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
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkClipboard();
      }
    });

    checkClipboard(); // Initial check

    return () => {
      subscription.remove();
    };
  }, []);

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
    // "All" should always be first
    if (index === 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Prevent moving into "All" position (index 0)
    if (targetIndex < 1 || targetIndex >= newCategories.length) return;

    // Swap
    [newCategories[index], newCategories[targetIndex]] = [
      newCategories[targetIndex],
      newCategories[index],
    ];
    saveCategories(newCategories);
  };

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
        });
        setFolders((prev) => prev.map((f) => f._id === editingFolder._id ? response.data : f));
      } else {
        const response = await axios.post(`${Config.API_URL}/api/folders`, {
          name: folderName,
          color: folderColor,
          icon: folderIcon,
        });
        setFolders((prev) => [...prev, response.data]);
      }
      setFolderFormVisible(false);
      setFolderName("");
      setFolderColor("#6200ee");
      setFolderIcon("folder");
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
            fetchLinks(); // Reload links to reflect unassigned status
          } catch (error) {
            Alert.alert("Hata", "Klasör silinemedi");
          }
        },
      },
    ]);
  };

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
    await Promise.all([fetchLinks(), fetchFolders()]);
    setRefreshing(false);
  };

  const handleSaveClipboard = async () => {
    if (!clipboardUrl) return;
    setSavingClipboard(true);
    try {
      await axios.post(`${Config.API_URL}/api/links`, { url: clipboardUrl });
      await AsyncStorage.setItem("lastSavedClipboardUrl", clipboardUrl);
      setShowClipboardPrompt(false);
      setClipboardUrl(null);
      fetchLinks(); // Refresh the list
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
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([fetchLinks(), fetchFolders()]).finally(() => setLoading(false));
    }, [])
  );

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
          {folders.map((folder) => (
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
              icon={folder.icon || "folder"}
            >
              {folder.name}
            </Chip>
          ))}
          <Chip
            onPress={() => {
              setEditingFolder(null);
              setFolderName("");
              setFolderColor("#6200ee");
              setFolderIcon("folder");
              setFolderFormVisible(true);
            }}
            style={{ backgroundColor: "#f0f0f0" }}
            icon="plus"
          >
            Yeni Ekle
          </Chip>
        </ScrollView>
      </View>

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
                folders.map((folder) => (
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
                      <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>{folder.name}</Text>
                    </View>
                    <View style={{ flexDirection: "row" }}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => {
                          setEditingFolder(folder);
                          setFolderName(folder.name);
                          setFolderColor(folder.color || "#6200ee");
                          setFolderIcon(folder.icon || "folder");
                          setFolderFormVisible(true);
                        }}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#d32f2f"
                        onPress={() => handleDeleteFolder(folder._id)}
                      />
                    </View>
                  </View>
                ))
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
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text variant="bodyLarge">No links found.</Text>
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
  },
  clipboardCardContainer: {
    position: "absolute",
    bottom: 90,
    left: 16,
    right: 16,
    alignItems: "center",
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
});
