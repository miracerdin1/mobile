import type { SharedLinkInput } from "../types/sharedLink";

const HTTP_URL_IN_TEXT = /https?:\/\/[^\s<>"']+/i;
const DOMAIN_IN_TEXT = /(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z]{2,})+(?:[/?][^\s<>"']*)?/i;
const TRAILING_PUNCTUATION = /[),.;!?]+$/;
const MAX_URL_LENGTH = 2048;

const getFirstValue = (value: SharedLinkInput) =>
  Array.isArray(value) ? value[0] : value;

export const normalizeHttpUrl = (value: string): string | null => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;
  if (trimmedValue.length > MAX_URL_LENGTH) return null;

  const candidate = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const parsedUrl = new URL(candidate);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:")
      return null;

    if (parsedUrl.username || parsedUrl.password) return null;

    const hasNetworkHost =
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname.includes(".") ||
      parsedUrl.hostname.includes(":");
    if (!hasNetworkHost) return null;

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

export const extractHttpUrl = (value: SharedLinkInput): string | null => {
  const rawValue = getFirstValue(value)?.trim();
  if (!rawValue) return null;

  const matchedValue =
    rawValue.match(HTTP_URL_IN_TEXT)?.[0] ??
    rawValue.match(DOMAIN_IN_TEXT)?.[0];
  if (!matchedValue) return null;

  const sanitizedValue = matchedValue.replace(TRAILING_PUNCTUATION, "");
  return normalizeHttpUrl(sanitizedValue);
};
