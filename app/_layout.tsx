import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  MD3LightTheme as DefaultTheme,
  PaperProvider,
} from "react-native-paper";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#6200ee",
    secondary: "#03dac6",
  },
};

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#f8f9fa",
            },
            headerTintColor: "#000",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: "LinkFlow" }} />
          <Stack.Screen
            name="add"
            options={{ title: "New Link", presentation: "modal" }}
          />
          <Stack.Screen
            name="edit/[id]"
            options={{ title: "Edit Link", presentation: "modal" }}
          />
          <Stack.Screen
            name="auth"
            options={{ title: "Login", presentation: "modal", headerShown: false }}
          />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
    </AuthProvider>
  );
}
