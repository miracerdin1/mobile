import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import Config from "../../constants/Config";

export default function EditLink() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLinkDetails();
    }
  }, [id]);

  const fetchLinkDetails = async () => {
    try {
      // We can fetch the list and find the item, or implement GET /:id
      // Since we have the list in index, passing data via params is an option,
      // but proper way is fetching. For now, we will fetch the full list and find (lazy way)
      // or assuming we implement GET /:id later.
      // Actually, let's just fetch the whole list and find it for now to avoid adding another endpoint just yet.
      // Wait, we can implement GET /:id on server easily.
      // Let's rely on finding it in the full list for now to save a step,
      // OR better, let's just implement GET /:id on server quickly?
      // No, let's stick to the plan. Plan didn't explicitly say GET /:id.
      // I will fetch all and find (not efficient but works for now).
      const response = await axios.get(`${Config.API_URL}/api/links`);
      const link = response.data.find((l: any) => l._id === id);
      if (link) {
        setTitle(link.title || "");
        setDescription(link.description || "");
        setUrl(link.url || "");
      } else {
        Alert.alert("Error", "Link not found");
        router.back();
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch link details");
      router.back();
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${Config.API_URL}/api/links/${id}`, {
        title,
        description,
        url,
      });
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update link");
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
        label="Title"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Save Changes
      </Button>

      <Button
        mode="text"
        onPress={() => router.back()}
        disabled={loading}
        style={styles.button}
      >
        Cancel
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
  button: {
    marginTop: 8,
  },
});
