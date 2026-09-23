import { useEffect, useState } from "react";

import type { Link } from "../types";

/**
 * "A link was just saved" signal shared across screens: the add screen and
 * the clipboard prompt report the saved link, and the home screen answers
 * with a tab bump and a highlighted row. Module state rather than context,
 * because the add screen has usually unmounted by the time home reacts.
 */

export interface JustSaved {
  id: string;
  category: string;
  /** Changes on every save, so saving the same category twice still bumps. */
  nonce: number;
}

/** How long the saved link stays highlighted (ms). */
export const JUST_SAVED_MS = 2600;

let current: JustSaved | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(value: JustSaved | null) => void>();

const emit = () => listeners.forEach((listener) => listener(current));

export function markJustSaved(link: Pick<Link, "_id" | "category">) {
  current = { id: link._id, category: link.category || "Other", nonce: Date.now() };
  emit();
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    current = null;
    emit();
  }, JUST_SAVED_MS);
}

export function useJustSaved() {
  const [value, setValue] = useState<JustSaved | null>(current);
  useEffect(() => {
    listeners.add(setValue);
    setValue(current);
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}
