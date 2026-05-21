import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, Text, TextInput, useTheme } from "react-native-paper";
import Config from "../../constants/Config";

export default function EditLink() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Folders State
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      Promise.all([fetchLinkDetails(), fetchFolders()]).finally(() => {
        setFetching(false);
      });
    }
  }, [id]);

  const fetchFolders = async () => {
    try {
      const response = await axios.get(`${Config.API_URL}/api/folders`);
      setFolders(response.data);
    } catch (err) {
      console.error("Fetch folders error in EditLink:", err);
    }
  };

  const fetchLinkDetails = async () => {
    try {
      const response = await axios.get(`${Config.API_URL}/api/links`);
      const link = response.data.find((l: any) => l._id === id);
      if (link) {
        setTitle(link.title || "");
        setDescription(link.description || "");
        setUrl(link.url || "");
        setSelectedFolderId(link.folderId || null);
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
      await axios.put(`${Config.API_URL}/api/links/${id}`, {
        title,
        description,
        url,
        folderId: selectedFolderId === null ? "null" : selectedFolderId,
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
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="URL"
        value={url}
        onChangeText={setUrl}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Başlık"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Açıklama"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>Klasöre Ekle (İsteğe Bağlı)</Text>
      <View style={styles.folderContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
          <Chip
            selected={selectedFolderId === null}
            onPress={() => setSelectedFolderId(null)}
            style={{ marginRight: 8, backgroundColor: selectedFolderId === null ? theme.colors.primaryContainer : "#f5f5f5" }}
            textStyle={{ color: selectedFolderId === null ? theme.colors.onPrimaryContainer : "#666" }}
            showSelectedOverlay
            icon="folder-open"
          >
            Klasör Yok
          </Chip>
          {folders.map((f) => (
            <Chip
              key={f._id}
              selected={selectedFolderId === f._id}
              onPress={() => setSelectedFolderId(f._id)}
              style={{
                marginRight: 8,
                backgroundColor: selectedFolderId === f._id ? f.color : "#f5f5f5",
                borderColor: f.color,
                borderWidth: selectedFolderId === f._id ? 0 : 1,
              }}
              textStyle={{
                color: selectedFolderId === f._id ? "#fff" : "#333",
                fontWeight: selectedFolderId === f._id ? "bold" : "normal"
              }}
              showSelectedOverlay
              icon={f.icon || "folder"}
            >
              {f.name}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Değişiklikleri Kaydet
      </Button>

      <Button
        mode="text"
        onPress={() => router.back()}
        disabled={loading}
        style={styles.button}
      >
        İptal
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
    color: "#333",
  },
  folderContainer: {
    marginBottom: 24,
    height: 48,
  },
  button: {
    marginTop: 8,
  },
});
