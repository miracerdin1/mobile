import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  useTheme,
  Surface,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Config from "../constants/Config";
import { AuthScreenProps } from "../types";

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const paperTheme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Field Validation Errors
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setUsername("");
    setEmail("");
    setEmailOrUsername("");
    setPassword("");
  };

  const handleAuth = async () => {
    setError(null);

    // Basic Validation
    if (isLogin) {
      if (!emailOrUsername.trim() || !password.trim()) {
        setError("Lütfen tüm alanları doldurun.");
        return;
      }
    } else {
      if (!username.trim() || !email.trim() || !password.trim()) {
        setError("Lütfen tüm alanları doldurun.");
        return;
      }
      if (username.trim().length < 3) {
        setError("Kullanıcı adı en az 3 karakter olmalıdır.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Lütfen geçerli bir e-posta adresi girin.");
        return;
      }
      if (password.trim().length < 6) {
        setError("Şifre en az 6 karakter olmalıdır.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const response = await axios.post(`${Config.API_URL}/api/auth/login`, {
          emailOrUsername: emailOrUsername.trim(),
          password: password.trim(),
        });

        const { token, user } = response.data;
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userData", JSON.stringify(user));
        
        onAuthSuccess(token, user);
      } else {
        const response = await axios.post(`${Config.API_URL}/api/auth/register`, {
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
        });

        const { token, user } = response.data;
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userData", JSON.stringify(user));

        Alert.alert("Başarılı", `Hoş geldiniz @${user.username}! Kaydınız başarıyla oluşturuldu.`);
        onAuthSuccess(token, user);
      }
    } catch (err: any) {
      console.error("Auth error:", err.response?.data || err.message);
      const serverError = err.response?.data?.error || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.";
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>📄 LinkFlow</Text>
          <Text style={styles.subtitleText}>
            Tüm bağlantılarınızı tek bir yerde toplayın ve paylaşın
          </Text>
        </View>

        <Surface style={styles.card} elevation={3}>
          <Text style={styles.cardTitle}>
            {isLogin ? "Giriş Yap" : "Kayıt Ol"}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {!isLogin && (
            <TextInput
              label="Kullanıcı Adı"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
            />
          )}

          {!isLogin && (
            <TextInput
              label="E-Posta Adresi"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.input}
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
            />
          )}

          {isLogin && (
            <TextInput
              label="Kullanıcı Adı veya E-Posta"
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="account-box-outline" />}
              style={styles.input}
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
            />
          )}

          <TextInput
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            outlineColor="#ddd"
            activeOutlineColor="#6200ee"
          />

          <Button
            mode="contained"
            onPress={handleAuth}
            disabled={loading}
            style={styles.authButton}
            contentStyle={styles.authButtonContent}
            labelStyle={styles.authButtonLabel}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size={20} />
            ) : isLogin ? (
              "Giriş Yap"
            ) : (
              "Hesap Oluştur"
            )}
          </Button>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin ? "Henüz bir hesabınız yok mu? " : "Zaten hesabınız var mı? "}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.switchLink}>
                {isLogin ? "Kayıt Olun" : "Giriş Yapın"}
              </Text>
            </TouchableOpacity>
          </View>
        </Surface>

        <Text style={styles.footerText}>Ortak klasörler ile gerçek zamanlı iş birliği</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0c20",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: "#a09db5",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  errorContainer: {
    backgroundColor: "rgba(211, 47, 47, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#ff8a80",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  authButton: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#6200ee",
  },
  authButtonContent: {
    height: 48,
  },
  authButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  switchText: {
    color: "#a09db5",
    fontSize: 14,
  },
  switchLink: {
    color: "#03dac6",
    fontSize: 14,
    fontWeight: "bold",
  },
  footerText: {
    textAlign: "center",
    color: "#6b6780",
    fontSize: 12,
    marginTop: 32,
    letterSpacing: 0.5,
  },
});
