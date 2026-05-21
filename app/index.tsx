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
    await fetchLinks();
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
      fetchLinks().finally(() => setLoading(false));
    }, [])
  );

  const filteredLinks = links.filter((link) => {
    const matchesCategory =
      selectedCategory === "All" || link.category === selectedCategory;

    if (searchQuery.trim() === "") return matchesCategory;

    const query = searchQuery.toLocaleLowerCase("tr-TR");
    const title = (link.title || "").toLocaleLowerCase("tr-TR");
    const url = (link.url || "").toLocaleLowerCase("tr-TR");
    const description = (link.description || "").toLocaleLowerCase("tr-TR");

    const matchesSearch =
      title.includes(query) ||
      url.includes(query) ||
      description.includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={{ paddingVertical: 8 }}>
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

      <Portal>
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
          renderItem={({ item }) => (
            <LinkCard
              url={item.url}
              title={item.title}
              description={item.description}
              imageUrl={item.imageUrl}
              siteName={item.siteName}
              category={item.category}
              onDelete={() => handleDelete(item._id)}
              onEdit={() => router.push(`/edit/${item._id}`)}
            />
          )}
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
