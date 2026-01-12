import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import Config from "../constants/Config";

export default function AddLink() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const response = await axios.post(`${Config.API_URL}/api/links`, { url });
      console.log("Response:", response.data);

      Alert.alert("Success", "Link added successfully!");
      router.back();
    } catch (err: any) {
      console.error("Add Link Error:", err);
      Alert.alert("Error", `Failed to add link. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="URL to save"
        value={url}
        onChangeText={(text) => {
          setUrl(text);
          setError("");
        }}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="url"
        error={!!error}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <Button
        mode="contained"
        onPress={handleAdd}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Add Link
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
  button: {
    marginTop: 16,
  },
});
