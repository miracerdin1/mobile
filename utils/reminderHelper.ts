import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Config from "../constants/Config";
import apiClient from "../services/api";
import { enableWebPush, setWebPushPrefs, webPushProblem } from "./webPush";

/**
 * Calculates delay in seconds and descriptive Turkish text for various preset triggers
 */
export function calculateReminderDelay(
  delayType: "1hour" | "evening" | "tomorrow" | "nextweek" | "instant" | "custom",
  customDate?: Date,
): { delaySeconds: number; delayText: string } {
  const now = new Date();
  let delaySeconds = 0;
  let delayText = "";

  if (delayType === "instant") {
    delaySeconds = 10; // 10 seconds for instant testing
    delayText = "10 saniye sonra";
  } else if (delayType === "1hour") {
    delaySeconds = 60 * 60; // 1 hour
    delayText = "1 saat sonra";
  } else if (delayType === "evening") {
    const target = new Date();
    target.setHours(20, 0, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    delaySeconds = Math.max(
      1,
      Math.round((target.getTime() - now.getTime()) / 1000),
    );
    delayText = "bu akşam saat 20:00'de";
  } else if (delayType === "tomorrow") {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);
    delaySeconds = Math.max(
      1,
      Math.round((target.getTime() - now.getTime()) / 1000),
    );
    delayText = "yarın sabah saat 09:00'da";
  } else if (delayType === "nextweek") {
    const target = new Date();
    target.setDate(target.getDate() + ((1 + 7 - target.getDay()) % 7 || 7));
    target.setHours(9, 0, 0, 0);
    delaySeconds = Math.max(
      1,
      Math.round((target.getTime() - now.getTime()) / 1000),
    );
    delayText = "gelecek Pazartesi sabah saat 09:00'da";
  } else if (delayType === "custom" && customDate) {
    const diffMs = customDate.getTime() - now.getTime();
    if (diffMs <= 0) {
      throw new Error("Lütfen gelecekteki bir tarih ve saat seçin.");
    }
    delaySeconds = Math.max(1, Math.round(diffMs / 1000));
    const hoursStr = String(customDate.getHours()).padStart(2, "0");
    const minsStr = String(customDate.getMinutes()).padStart(2, "0");
    delayText = `${customDate.toLocaleDateString("tr-TR")} saat ${hoursStr}:${minsStr} için`;
  } else {
    throw new Error("Geçersiz hatırlatıcı tipi.");
  }

  return { delaySeconds, delayText };
}

/**
 * Request system permissions for Push Notifications (iOS / Android).
 * Web asks through enableWebPush instead, which also reports why it failed.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return (await enableWebPush()).ok;
  
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      return req.status === "granted";
    }
    return true;
  } catch (error) {
    console.error("Failed to get notification permissions:", error);
    return false;
  }
}

import { Link } from "../types";

/** Web reminders are kept by the server; their id carries the link id. */
const SERVER_REMINDER_PREFIX = "server:";
export const serverReminderId = (linkId: string) => `${SERVER_REMINDER_PREFIX}${linkId}`;
const WEB_SMART_ID = "web-smart";

/**
 * Schedules a local push notification. On web the server sends it as a Web Push
 * (see utils/webPush.ts); call enableWebPush first.
 */
export async function scheduleLocalNotification(
  link: Link,
  delaySeconds: number,
): Promise<string> {
  if (Platform.OS === "web") {
    await apiClient.put(`/api/push/reminders/${link._id}`, {
      fireAt: new Date(Date.now() + delaySeconds * 1000).toISOString(),
    });
    return serverReminderId(link._id);
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daha Sonra Oku 🔔",
      body: `Kaydettiğin "${link.title || "bağlantıya"}" göz atmak ister misin?`,
      data: { url: link.url },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });
}

/**
 * Cancels a scheduled local notification
 */
export async function cancelLocalNotification(notificationId: string): Promise<void> {
  if (!notificationId) return;
  if (Platform.OS === "web") {
    if (notificationId === WEB_SMART_ID) {
      await setWebPushPrefs({ smart: false });
    } else if (notificationId.startsWith(SERVER_REMINDER_PREFIX)) {
      await apiClient.delete(`/api/push/reminders/${notificationId.slice(SERVER_REMINDER_PREFIX.length)}`);
    }
    return;
  }
  
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Failed to cancel local notification:", error);
  }
}

/**
 * Schedules the smart repeating weekly notifications
 */
export async function scheduleSmartWeeklyNotification(): Promise<string> {
  if (Platform.OS === "web") {
    const push = await enableWebPush({ smart: true });
    if (push.ok === false) throw new Error(webPushProblem(push.reason));
    return WEB_SMART_ID;
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: "Haftalık Akıllı Hatırlatıcı 🔔",
      body: "Pazartesi günü kaydettiğin bağlantıları incelemek ve okuma listeni düzenlemek ister misin?",
      data: { url: Config.API_URL + "/bio" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 7 * 24 * 60 * 60,
      repeats: true,
    },
  });
}
