import Config from "../constants/Config";
import apiClient from "../services/api";

/**
 * Web Push for the PWA. Browsers cannot schedule a notification on the device,
 * so reminders live on the server and arrive as pushes through the service
 * worker (public/sw.js). On iPhone this only works once LinkFlow is added to
 * the Home Screen and opened from there (iOS 16.4+).
 */

export type WebPushSupport = "supported" | "needs-install" | "unsupported";
export type WebPushPrefs = { recap: boolean; smart: boolean };
export type WebPushResult =
  | ({ ok: true } & WebPushPrefs)
  | { ok: false; reason: "needs-install" | "unsupported" | "denied" | "server" };

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as any).standalone === true;

export function getWebPushSupport(): WebPushSupport {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return "unsupported";
  // A Safari tab on iPhone has no PushManager at all; the installed app does.
  if (isIos() && !isStandalone()) return "needs-install";
  if (!("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return "supported";
}

export function webPushProblem(reason: Extract<WebPushResult, { ok: false }>["reason"]): string {
  switch (reason) {
    case "needs-install":
      return "iPhone'da bildirimler için LinkFlow'u Safari'de Paylaş > Ana Ekrana Ekle ile kurup ana ekrandaki ikonundan açman gerekiyor.";
    case "denied":
      return "Bildirim izni verilmedi. iPhone'da Ayarlar > Bildirimler > LinkFlow'dan izin verebilirsin.";
    case "unsupported":
      return "Bu tarayıcı bildirimleri desteklemiyor.";
    default:
      return "Bildirimler şu an açılamadı. Biraz sonra tekrar dene.";
  }
}

let publicKeyPromise: Promise<string | null> | null = null;

/** Fetched ahead of time so the tap that enables push does not wait on the network. */
export function prefetchVapidKey() {
  publicKeyPromise ??= apiClient
    .get("/api/push/public-key")
    .then((response) => response.data.publicKey as string)
    .catch(() => {
      publicKeyPromise = null;
      return null;
    });
  return publicKeyPromise;
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function getRegistration() {
  if (!(await navigator.serviceWorker.getRegistration())) {
    await navigator.serviceWorker.register("/sw.js");
  }
  return navigator.serviceWorker.ready;
}

async function getExistingSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

async function getOrCreateSubscription() {
  const registration = await getRegistration();
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const publicKey = await prefetchVapidKey();
  if (!publicKey) return null;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

/**
 * Asks for permission (if needed), subscribes and saves the subscription.
 * Call it straight from a tap: iOS only shows the prompt for a user gesture,
 * so nothing may be awaited before it.
 */
export async function enableWebPush(prefs: Partial<WebPushPrefs> = {}): Promise<WebPushResult> {
  const support = getWebPushSupport();
  if (support !== "supported") return { ok: false, reason: support };

  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  try {
    const subscription = await getOrCreateSubscription();
    if (!subscription) return { ok: false, reason: "server" };

    const { data } = await apiClient.post("/api/push/subscriptions", {
      subscription: subscription.toJSON(),
      ...prefs,
    });
    return { ok: true, ...data };
  } catch (error) {
    console.warn("Web push could not be enabled:", error);
    return { ok: false, reason: "server" };
  }
}

/** Changes this browser's settings without ever prompting. */
export async function setWebPushPrefs(prefs: Partial<WebPushPrefs>): Promise<WebPushResult> {
  const subscription = getWebPushSupport() === "supported" ? await getExistingSubscription() : null;
  // Nothing subscribed means nothing will be sent, which is what "off" asks for.
  if (!subscription) return { ok: true, recap: false, smart: false };

  try {
    const { data } = await apiClient.post("/api/push/subscriptions", {
      subscription: subscription.toJSON(),
      ...prefs,
    });
    return { ok: true, ...data };
  } catch {
    return { ok: false, reason: "server" };
  }
}

export async function getWebPushPrefs(): Promise<WebPushPrefs | null> {
  if (getWebPushSupport() !== "supported" || Notification.permission !== "granted") return null;

  const subscription = await getExistingSubscription();
  if (!subscription) return null;

  try {
    const { data } = await apiClient.get("/api/push/subscriptions/current", {
      params: { endpoint: subscription.endpoint },
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * On app start: re-saves the subscription under the signed-in user when
 * permission was already given (it may have rotated). Never prompts.
 */
export async function syncWebPush() {
  if (getWebPushSupport() !== "supported") return;
  prefetchVapidKey();
  if (Notification.permission !== "granted") return;

  try {
    const subscription = await getOrCreateSubscription();
    if (subscription) {
      await apiClient.post("/api/push/subscriptions", { subscription: subscription.toJSON() });
    }
  } catch (error) {
    console.warn("Web push sync failed:", error);
  }
}

/**
 * On logout, so the next person on this phone does not get these pushes.
 * Uses fetch rather than apiClient: a 401 here must not trigger another logout.
 */
export async function disableWebPush(token: string | null) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const subscription = await getExistingSubscription();
    if (!subscription) return;

    if (token) {
      fetch(`${Config.API_URL}/api/push/subscriptions`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {});
    }
    await subscription.unsubscribe();
  } catch (error) {
    console.warn("Web push could not be disabled:", error);
  }
}
