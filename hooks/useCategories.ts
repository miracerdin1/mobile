import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_CATEGORIES } from "../constants";

export function useCategories() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [manageCategoriesVisible, setManageCategoriesVisible] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("categories");
      if (stored) {
        setCategories(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const saveCategories = useCallback(async (newCategories: string[]) => {
    try {
      setCategories(newCategories);
      await AsyncStorage.setItem("categories", JSON.stringify(newCategories));
    } catch (e) {
      console.error("Failed to save categories", e);
    }
  }, []);

  const moveCategory = useCallback(
    (index: number, direction: "up" | "down") => {
      const newCategories = [...categories];
      if (index === 0) return;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 1 || targetIndex >= newCategories.length) return;

      [newCategories[index], newCategories[targetIndex]] = [
        newCategories[targetIndex],
        newCategories[index],
      ];
      saveCategories(newCategories);
    },
    [categories, saveCategories],
  );

  return {
    categories,
    setCategories,
    selectedCategory,
    setSelectedCategory,
    manageCategoriesVisible,
    setManageCategoriesVisible,
    moveCategory,
  };
}
