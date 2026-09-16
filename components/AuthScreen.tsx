import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import Config from "../constants/Config";
import api from "../services/api";
import { AuthScreenProps } from "../types";
import AmbientBackground from "./AmbientBackground";
import Logo from "./Logo";
import PrimaryButton from "./PrimaryButton";
import StaggerIn from "./StaggerIn";

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const theme = useAppTheme();
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
        const response = await api.post(`${Config.API_URL}/api/auth/login`, {
          emailOrUsername: emailOrUsername.trim(),
          password: password.trim(),
        });

        const { token, user } = response.data;

        onAuthSuccess(token, user);
      } else {
        const response = await api.post(`${Config.API_URL}/api/auth/register`, {
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
        });

        const { token, user } = response.data;

        Alert.alert(
          "Başarılı",
          `Hoş geldiniz @${user.username}! Kaydınız başarıyla oluşturuldu.`,
        );
        onAuthSuccess(token, user);
      }
    } catch (err: any) {
      console.error("Auth error:", err.response?.data || err.message);
      const serverError =
        err.response?.data?.error ||
        "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.";
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(theme);

  return (
    <AmbientBackground intensity="vivid">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <StaggerIn index={0} style={styles.headerContainer}>
            <Logo size={36} />
            <Text style={styles.subtitleText}>
              Tüm bağlantılarınızı tek bir yerde toplayın ve paylaşın
            </Text>
          </StaggerIn>

          <StaggerIn index={1}>
            <Surface style={styles.card} elevation={1}>
              <Text style={styles.cardTitle}>
                {isLogin ? "Giriş Yap" : "Kayıt Ol"}
              </Text>

              {error && (
                <View style={styles.errorContainer} accessibilityRole="alert">
                  <Text style={styles.errorText}>{error}</Text>
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
                  autoComplete="username"
                  textContentType="username"
                  left={<TextInput.Icon icon="account-outline" />}
                  style={styles.input}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
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
                  autoComplete="email"
                  textContentType="emailAddress"
                  left={<TextInput.Icon icon="email-outline" />}
                  style={styles.input}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
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
                  autoComplete="username"
                  left={<TextInput.Icon icon="account-box-outline" />}
                  style={styles.input}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
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
                autoComplete={isLogin ? "current-password" : "new-password"}
                textContentType={isLogin ? "password" : "newPassword"}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    forceTextInputFocus={false}
                    accessibilityLabel={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  />
                }
                style={styles.input}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
              />

              <PrimaryButton
                onPress={handleAuth}
                disabled={loading}
                style={{ marginTop: theme.spacing.xs }}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.onPrimary} size={20} />
                ) : isLogin ? (
                  "Giriş Yap"
                ) : (
                  "Hesap Oluştur"
                )}
              </PrimaryButton>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isLogin
                    ? "Henüz bir hesabınız yok mu? "
                    : "Zaten hesabınız var mı? "}
                </Text>
                <TouchableOpacity onPress={toggleMode} accessibilityRole="button">
                  <Text style={styles.switchLink}>
                    {isLogin ? "Kayıt Olun" : "Giriş Yapın"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Surface>
          </StaggerIn>

          <StaggerIn index={2}>
            <Text style={styles.footerText}>
              Ortak klasörler ile gerçek zamanlı iş birliği
            </Text>
          </StaggerIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </AmbientBackground>
  );
}

const makeStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      // AmbientBackground paints the background behind this layer.
      backgroundColor: "transparent",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: theme.spacing.xl,
    },
    subtitleText: {
      fontFamily: theme.fontFamily.regular,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    cardTitle: {
      fontFamily: theme.fontFamily.bold,
      fontSize: 22,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.lg,
      textAlign: "center",
    },
    errorContainer: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.radius.sm,
      padding: theme.spacing.sm + theme.spacing.xs,
      marginBottom: theme.spacing.md,
    },
    errorText: {
      fontFamily: theme.fontFamily.medium,
      color: theme.colors.onErrorContainer,
      fontSize: 13,
    },
    input: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: theme.spacing.lg,
    },
    switchText: {
      fontFamily: theme.fontFamily.regular,
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    switchLink: {
      fontFamily: theme.fontFamily.semibold,
      color: theme.colors.primary,
      fontSize: 14,
    },
    footerText: {
      fontFamily: theme.fontFamily.regular,
      textAlign: "center",
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: theme.spacing.xl,
      letterSpacing: 0.3,
    },
  });
