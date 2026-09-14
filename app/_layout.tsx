import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityIndicator } from "react-native-paper";

import { AuthProvider } from "../context/AuthContext";
import { VisualThemeProvider } from "../context/VisualThemeContext";
import { useAppTheme } from "../hooks/useAppTheme";
import Logo from "../components/Logo";

function AppNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const theme = useAppTheme();

  // Keep the splash-like state on-brand while fonts load (avoids FOUT on
  // web). AuthProvider above already started its token check in parallel.
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerTintColor: theme.colors.onBackground,
          headerTitleStyle: {
            fontFamily: theme.fontFamily.semibold,
            fontSize: 18,
          },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerTitle: () => <Logo size={22} /> }}
        />
        <Stack.Screen
          name="add"
          options={{ title: "Yeni Bağlantı", presentation: "modal" }}
        />
        <Stack.Screen
          name="edit/[id]"
          options={{ title: "Bağlantıyı Düzenle", presentation: "modal" }}
        />
        <Stack.Screen
          name="auth"
          options={{ title: "Giriş", presentation: "modal", headerShown: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Fraunces_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <VisualThemeProvider>
        <AuthProvider>
          <AppNavigator fontsLoaded={fontsLoaded} />
        </AuthProvider>
      </VisualThemeProvider>
    </GestureHandlerRootView>
  );
}
