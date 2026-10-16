import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Link, Reminder } from "~/types";
import {
  calculateReminderDelay,
  requestNotificationPermissions,
  scheduleLocalNotification,
  cancelLocalNotification,
  scheduleSmartWeeklyNotification,
  serverReminderId,
} from "../utils/reminderHelper";
import { enableWebPush, getWebPushPrefs, webPushProblem } from "../utils/webPush";
import { showAlert } from "../utils/alert";
import apiClient from "../services/api";
import { useAuth } from "../context/AuthContext";

export function useReminders() {
  const { isAuthenticated } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderDialogVisible, setReminderDialogVisible] = useState(false);
  const [selectedReminderLink, setSelectedReminderLink] = useState<Link | null>(
    null,
  );
  const [smartRemindersEnabled, setSmartRemindersEnabled] = useState(false);
  const [customReminderDate, setCustomReminderDate] = useState<Date>(
    new Date(Date.now() + 10 * 60 * 1000),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [webCustomDateTime, setWebCustomDateTime] = useState("");

  // Setup Notifications on mount
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        if (Platform.OS === "web") {
          // The server holds web reminders (it sends them), so it is the source of truth.
          if (!isAuthenticated) return;
          const { data } = await apiClient.get<{ linkId: string }[]>("/api/push/reminders");
          setReminders(
            data.map((r) => ({ linkId: r.linkId, notificationId: serverReminderId(r.linkId) })),
          );
          const prefs = await getWebPushPrefs();
          setSmartRemindersEnabled(prefs?.smart ?? false);
          return;
        }

        // Request Permissions
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          await Notifications.requestPermissionsAsync();
        }

        // Load active reminders from storage
        const storedReminders = await AsyncStorage.getItem("activeReminders");
        if (storedReminders) {
          setReminders(JSON.parse(storedReminders));
        }

        // Load smart reminder setting
        const storedSmart = await AsyncStorage.getItem("smartRemindersEnabled");
        if (storedSmart) {
          setSmartRemindersEnabled(JSON.parse(storedSmart));
        }
      } catch (e) {
        console.error("Error setting up notifications in useReminders:", e);
      }
    };

    setupNotifications();
  }, [isAuthenticated]);

  const handleScheduleReminder = useCallback(
    async (
      link: Link,
      delayType:
        | "1hour"
        | "evening"
        | "tomorrow"
        | "nextweek"
        | "instant"
        | "custom",
      customDate?: Date,
    ) => {
      try {
        // 1. Request permissions. On web this must be the first await: iOS
        // only shows the prompt while the tap still counts as a user gesture.
        if (Platform.OS === "web") {
          const push = await enableWebPush();
          if (push.ok === false) {
            showAlert("Bildirimler açılamadı", webPushProblem(push.reason));
            return;
          }
        } else if (!(await requestNotificationPermissions())) {
          showAlert(
            "İzin Gerekli",
            "Hatırlatıcı eklemek için bildirim izinlerini onaylamanız gerekmektedir.",
          );
          return;
        }

        // 2. Calculate delay in seconds
        let delaySeconds = 0;
        let delayText = "";
        try {
          const delayResult = calculateReminderDelay(delayType, customDate);
          delaySeconds = delayResult.delaySeconds;
          delayText = delayResult.delayText;
        } catch (err: any) {
          showAlert(
            "Geçersiz Zaman",
            err.message || "Lütfen gelecekteki bir tarih ve saat seçin.",
          );
          return;
        }

        // 3. Cancel any existing reminder for this specific link first
        const existing = reminders.find((r) => r.linkId === link._id);
        if (existing) {
          await cancelLocalNotification(existing.notificationId);
        }

        // 4. Schedule local notification (web: the server sends a push)
        const notificationId = await scheduleLocalNotification(link, delaySeconds);

        // 5. Update state and AsyncStorage
        const updatedReminders = reminders.filter((r) => r.linkId !== link._id);
        const newReminders = [
          ...updatedReminders,
          { linkId: link._id, notificationId },
        ];

        setReminders(newReminders);
        await AsyncStorage.setItem(
          "activeReminders",
          JSON.stringify(newReminders),
        );
        setReminderDialogVisible(false);

        showAlert(
          "Hatırlatıcı Kuruldu 🔔",
          `"${link.title || "Bağlantı"}" için hatırlatıcı ${delayText} çalışacak şekilde başarıyla ayarlandı.`,
        );
      } catch (error) {
        console.error("Failed to schedule reminder:", error);
        showAlert("Hata", "Hatırlatıcı kurulurken bir hata oluştu.");
      }
    },
    [reminders],
  );

  const handleCancelReminder = useCallback(
    async (linkId: string) => {
      try {
        const existing = reminders.find((r) => r.linkId === linkId);
        if (existing) {
          await cancelLocalNotification(existing.notificationId);

          const updated = reminders.filter((r) => r.linkId !== linkId);
          setReminders(updated);
          await AsyncStorage.setItem(
            "activeReminders",
            JSON.stringify(updated),
          );
        }

        setReminderDialogVisible(false);
        showAlert("İptal Edildi 🔕", "Hatırlatıcı başarıyla iptal edildi.");
      } catch (error) {
        console.error("Failed to cancel reminder:", error);
        showAlert("Hata", "Hatırlatıcı iptal edilirken bir hata oluştu.");
      }
    },
    [reminders],
  );

  const handleToggleSmartReminders = useCallback(async (enabled: boolean) => {
    try {
      if (Platform.OS === "web") {
        // Turning it on may prompt, so it goes first (see handleScheduleReminder).
        if (enabled) {
          await scheduleSmartWeeklyNotification();
        } else {
          await cancelLocalNotification("web-smart");
        }
        setSmartRemindersEnabled(enabled);
        await AsyncStorage.setItem("smartRemindersEnabled", JSON.stringify(enabled));
        showAlert(
          enabled ? "Akıllı Hatırlatıcı Aktif 🔔" : "Devre Dışı Bırakıldı 🔕",
          enabled
            ? "Her Pazartesi 09:00'da okuma listen için bildirim gelecek."
            : "Akıllı okuma hatırlatıcıları kapatıldı.",
        );
        return;
      }

      setSmartRemindersEnabled(enabled);
      await AsyncStorage.setItem(
        "smartRemindersEnabled",
        JSON.stringify(enabled),
      );

      const smartNotificationId = await AsyncStorage.getItem(
        "smartNotificationId",
      );
      if (smartNotificationId) {
        await cancelLocalNotification(smartNotificationId);
        await AsyncStorage.removeItem("smartNotificationId");
      }

      if (enabled) {
        const notificationId = await scheduleSmartWeeklyNotification();
        await AsyncStorage.setItem("smartNotificationId", notificationId);
        showAlert(
          "Akıllı Hatırlatıcı Aktif 🔔",
          "Haftalık akıllı okuma listesi önerileri başarıyla etkinleştirildi!",
        );
      } else {
        showAlert(
          "Devre Dışı Bırakıldı 🔕",
          "Akıllı okuma hatırlatıcıları kapatıldı.",
        );
      }
    } catch (error: any) {
      console.error("Smart reminder toggle failed:", error);
      if (Platform.OS === "web") showAlert("Bildirimler açılamadı", error?.message || webPushProblem("server"));
    }
  }, []);

  return {
    reminders,
    setReminders,
    reminderDialogVisible,
    setReminderDialogVisible,
    selectedReminderLink,
    setSelectedReminderLink,
    smartRemindersEnabled,
    setSmartRemindersEnabled,
    customReminderDate,
    setCustomReminderDate,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    webCustomDateTime,
    setWebCustomDateTime,
    handleScheduleReminder,
    handleCancelReminder,
    handleToggleSmartReminders,
  };
}
