import api from "../services/api";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, HelperText, Text, TextInput, useTheme, Switch } from "react-native-paper";
import Config from "../constants/Config";
import { getStoredToken } from "../services/authStorage";

export default function AddLink() {
  const router = useRouter();
  const theme = useTheme();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  
  // Folders State
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          
        }
        await fetchFolders();
      } catch (err) {
        console.error("Initialization error in AddLink:", err);
      }
    };
    init();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await api.get(`${Config.API_URL}/api/folders`);
      setFolders(response.data);
    } catch (err) {
      console.warn("Fetch folders error in AddLink:", err);
    }
  };

  const handleAdd = async () => {
    if (!url) {
      setError("URL cannot be empty");
      return;
    }

    // Simple URL validation
    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w \.-]*)*\/?(\?.*)?$/;
    if (!urlPattern.test(url)) {
      setError("Please enter a valid URL (e.g. https://google.com)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log(`Sending request to: ${Config.API_URL}/api/links`);
      const response = await api.post(`${Config.API_URL}/api/links`, {
        url,
        folderId: selectedFolderId,
        isPublic,
      });
      console.log("Response:", response.data);

      Alert.alert("Başarılı", "Link başarıyla eklendi!");
      router.back();
    } catch (err: any) {
      console.error("Add Link Error:", err);
      Alert.alert("Hata", `Link eklenemedi. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Kaydedilecek URL"
        value={url}
        onChangeText={(text) => {
          setUrl(text);
          setError("");
        }}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="url"
        error={!!error}
        style={{ marginBottom: 4 }}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

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

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text variant="labelLarge" style={{ fontWeight: "bold" }}>Herkese Açık</Text>
          <Text variant="bodySmall" style={{ color: "#666" }}>Bu bağlantı Bio sayfanızda Genel Bağlantılar altında listelenir.</Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          color={theme.colors.primary}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleAdd}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Linki Kaydet
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
    marginTop: 16,
    paddingVertical: 4,
  },
});
