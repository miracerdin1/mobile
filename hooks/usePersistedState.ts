import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * useState backed by AsyncStorage: loads the stored value (if valid) on
 * mount and best-effort persists every update, silently falling back to
 * `defaultValue` when storage is empty, invalid, or unavailable.
 */
export function usePersistedState<T extends string>(
  key: string,
  defaultValue: T,
  isValid: (value: string) => value is T,
) {
  const [value, setValueState] = useState<T>(defaultValue);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((stored) => {
        if (stored && isValid(stored)) setValueState(stored);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      setValueState((current) => {
        const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
        AsyncStorage.setItem(key, resolved).catch(() => undefined);
        return resolved;
      });
    },
    [key],
  );

  return [value, setValue] as const;
}
