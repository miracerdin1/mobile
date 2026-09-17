import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, View } from "react-native";
import { Button, Menu, Switch, Text, TextInput } from "react-native-paper";

import FolderChip from "../../components/FolderChip";
import PrimaryButton from "../../components/PrimaryButton";
import { CATEGORY_LABELS, DEFAULT_CATEGORIES } from "../../constants";
import Config from "../../constants/Config";
import { useAppTheme } from "../../hooks/useAppTheme";
import api from "../../services/api";

/** "All" is a filter tab, not a category a link can belong to. */
const CATEGORY_OPTIONS = DEFAULT_CATEGORIES.filter((c) => c !== "All");

export default function EditLink() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useAppTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [category, setCategory] = useState("Other");
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  // Folders State
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (id) {
          await Promise.all([fetchLinkDetails(), fetchFolders()]);
        }
      } catch (err) {
        console.error("Initialization error in EditLink:", err);
      } finally {
        setFetching(false);
      }
    };
    init();
  }, [id]);

  const fetchFolders = async () => {
    try {
      const response = await api.get(`${Config.API_URL}/api/folders`);
      setFolders(response.data);
    } catch (err) {
      console.warn("Fetch folders error in EditLink:", err);
    }
  };

  const fetchLinkDetails = async () => {
    try {
      const response = await api.get(`${Config.API_URL}/api/links`);
      const link = response.data.find((l: any) => l._id === id);
      if (link) {
        setTitle(link.title || "");
        setDescription(link.description || "");
        setUrl(link.url || "");
        setSelectedFolderId(link.folderId || null);
        setIsPublic(link.isPublic || false);
        setCategory(link.category || "Other");
      } else {
        Alert.alert("Hata", "Link bulunamadı");
        router.back();
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Hata", "Link detayları yüklenemedi");
      router.back();
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`${Config.API_URL}/api/links/${id}`, {
        title,
        description,
        url,
        folderId: selectedFolderId === null ? "null" : selectedFolderId,
        isPublic,
        category,
      });
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Hata", "Link güncellenemedi");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <View style={{ flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.background }} />;
  }

  return (
    <View style={{ flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.background }}>
      <TextInput
        label="URL"
        value={url}
        onChangeText={setUrl}
        mode="outlined"
        outlineColor={theme.colors.outlineVariant}
        activeOutlineColor={theme.colors.primary}
        style={{ marginBottom: theme.spacing.md }}
      />

      <TextInput
        label="Başlık"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        outlineColor={theme.colors.outlineVariant}
        activeOutlineColor={theme.colors.primary}
        style={{ marginBottom: theme.spacing.md }}
      />

      <TextInput
        label="Açıklama"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        outlineColor={theme.colors.outlineVariant}
        activeOutlineColor={theme.colors.primary}
        style={{ marginBottom: theme.spacing.md }}
      />

      <Menu
        visible={categoryMenuVisible}
        onDismiss={() => setCategoryMenuVisible(false)}
        anchorPosition="bottom"
        contentStyle={{ backgroundColor: theme.colors.surface }}
        anchor={
          <Pressable
            onPress={() => setCategoryMenuVisible(true)}
            // `TextInput.Icon` below already renders its own <button> on web; giving this
            // Pressable accessibilityRole="button" too would nest <button> inside <button>
            // (invalid HTML, breaks hydration). Native keeps the button role for screen readers.
            accessibilityRole={Platform.OS === "web" ? undefined : "button"}
            accessibilityLabel="Kategori seç"
          >
            {/* Read-only input so the select matches the fields above; the Pressable takes the tap. */}
            <View pointerEvents="none">
              <TextInput
                label="Kategori"
                value={CATEGORY_LABELS[category] ?? category}
                mode="outlined"
                editable={false}
                right={<TextInput.Icon icon={categoryMenuVisible ? "chevron-up" : "chevron-down"} />}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                style={{ marginBottom: theme.spacing.md }}
              />
            </View>
          </Pressable>
        }
      >
        {CATEGORY_OPTIONS.map((option) => (
          <Menu.Item
            key={option}
            title={CATEGORY_LABELS[option] ?? option}
            leadingIcon={option === category ? "check" : undefined}
            onPress={() => {
              setCategory(option);
              setCategoryMenuVisible(false);
            }}
          />
        ))}
      </Menu>

      <Text
        variant="titleMedium"
        style={{ fontFamily: theme.fontFamily.semibold, marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm, color: theme.colors.onSurface }}
      >
        Klasöre Ekle (İsteğe Bağlı)
      </Text>
      <View style={{ marginBottom: theme.spacing.lg, height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: theme.spacing.xs }}>
          <FolderChip
            label="Klasör Yok"
            icon="folder-off-outline"
            selected={selectedFolderId === null}
            onPress={() => setSelectedFolderId(null)}
          />
          {folders.map((f) => (
            <FolderChip
              key={f._id}
              label={f.name}
              icon={f.icon || "folder"}
              color={f.color}
              selected={selectedFolderId === f._id}
              onPress={() => setSelectedFolderId(f._id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.xl }}>
        <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
          <Text variant="labelLarge" style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}>
            Herkese Açık
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Bu bağlantı Bio sayfanızda Genel Bağlantılar altında listelenir.
          </Text>
        </View>
        <Switch value={isPublic} onValueChange={setIsPublic} color={theme.colors.primary} />
      </View>

      <PrimaryButton onPress={handleSave} loading={loading} disabled={loading}>
        Değişiklikleri Kaydet
      </PrimaryButton>

      <Button
        mode="text"
        onPress={() => router.back()}
        disabled={loading}
        textColor={theme.colors.onSurfaceVariant}
        style={{ marginTop: theme.spacing.sm }}
      >
        İptal
      </Button>
    </View>
  );
}
