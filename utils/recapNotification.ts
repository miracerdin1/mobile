import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { requestNotificationPermissions } from "./reminderHelper";

/** Fixed id: scheduling again replaces the previous one instead of stacking. */
const RECAP_ID = "weekly-recap";
/** Route the notification opens (handled by the home screen's response listener). */
export const RECAP_ROUTE = "/recap";

/**
 * Sunday 19:00, every week. With `askPermission` false this only schedules
 * when notifications are already allowed, so app start never prompts.
 * Returns whether the reminder is now scheduled.
 */
export async function scheduleWeeklyRecap(askPermission: boolean): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const allowed = status === "granted" || (askPermission && (await requestNotificationPermissions()));
    if (!allowed) return false;
    await Notifications.scheduleNotificationAsync({
      identifier: RECAP_ID,
      content: {
        title: "Haftan hazır",
        body: "Bu hafta ne kaydettin, neyi unuttun? Bir dakikalık özetin seni bekliyor.",
        data: { route: RECAP_ROUTE },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday (1 = Sunday in expo-notifications)
        hour: 19,
        minute: 0,
      },
    });
    return true;
  } catch (error) {
    console.warn("Weekly recap reminder not scheduled:", error);
    return false;
  }
}

export async function isWeeklyRecapScheduled(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((n) => n.identifier === RECAP_ID);
  } catch {
    return false;
  }
}
