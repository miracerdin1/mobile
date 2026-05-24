import { useState, useEffect, useCallback } from "react";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Link, Reminder } from "~/types";
import {
  calculateReminderDelay,
  requestNotificationPermissions,
  scheduleLocalNotification,
  cancelLocalNotification,
  scheduleSmartWeeklyNotification,
} from "../utils/reminderHelper";

export function useReminders() {
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
          const storedReminders = await AsyncStorage.getItem("activeReminders");
          if (storedReminders) {
            setReminders(JSON.parse(storedReminders));
          }
          const storedSmart = await AsyncStorage.getItem(
            "smartRemindersEnabled",
          );
          if (storedSmart) {
            setSmartRemindersEnabled(JSON.parse(storedSmart));
          }
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
  }, []);

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
        // 1. Request permissions (Native only)
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
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
          Alert.alert(
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

        // 4. Schedule local notification / Web simulated notification
        const notificationId = await scheduleLocalNotification(
          link,
          delaySeconds,
          Platform.OS === "web"
            ? (message, url) => {
                if (confirm(message)) {
                  // In useReminders, we simulate clicking
                  window.open(url, "_blank");
                }
              }
            : undefined,
        );

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

        Alert.alert(
          "Hatırlatıcı Kuruldu 🔔",
          `"${link.title || "Bağlantı"}" için hatırlatıcı ${delayText} çalışacak şekilde başarıyla ayarlandı.`,
        );
      } catch (error) {
        console.error("Failed to schedule reminder:", error);
        Alert.alert("Hata", "Hatırlatıcı kurulurken bir hata oluştu.");
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
        Alert.alert("İptal Edildi 🔕", "Hatırlatıcı başarıyla iptal edildi.");
      } catch (error) {
        console.error("Failed to cancel reminder:", error);
        Alert.alert("Hata", "Hatırlatıcı iptal edilirken bir hata oluştu.");
      }
    },
    [reminders],
  );

  const handleToggleSmartReminders = useCallback(async (enabled: boolean) => {
    try {
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
        Alert.alert(
          "Akıllı Hatırlatıcı Aktif 🔔",
          "Haftalık akıllı okuma listesi önerileri başarıyla etkinleştirildi!",
        );
      } else {
        Alert.alert(
          "Devre Dışı Bırakıldı 🔕",
          "Akıllı okuma hatırlatıcıları kapatıldı.",
        );
      }
    } catch (error) {
      console.error("Smart reminder toggle failed:", error);
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
