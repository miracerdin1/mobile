import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const USER_TOKEN_KEY = "userToken";
const USER_DATA_KEY = "userData";

const getItem = async (key: string) => {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(key);
  }

  const secureValue = await SecureStore.getItemAsync(key);
  if (secureValue) return secureValue;

  const legacyValue = await AsyncStorage.getItem(key);
  if (!legacyValue) return null;

  await SecureStore.setItemAsync(key, legacyValue);
  await AsyncStorage.removeItem(key);

  return legacyValue;
};

const setItem = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
  await AsyncStorage.removeItem(key);
};

const removeItem = async (key: string) => {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
  await AsyncStorage.removeItem(key);
};

export const getStoredAuth = async () => {
  const [token, userData] = await Promise.all([
    getItem(USER_TOKEN_KEY),
    getItem(USER_DATA_KEY),
  ]);

  return { token, userData };
};

export const saveStoredAuth = async (token: string, userData: unknown) => {
  await Promise.all([
    setItem(USER_TOKEN_KEY, token),
    setItem(USER_DATA_KEY, JSON.stringify(userData)),
  ]);
};

export const clearStoredAuth = async () => {
  await Promise.all([
    removeItem(USER_TOKEN_KEY),
    removeItem(USER_DATA_KEY),
  ]);
};

export const getStoredToken = async () => getItem(USER_TOKEN_KEY);
