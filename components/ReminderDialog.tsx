import React from "react";
import { ScrollView, View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import {
  Dialog,
  Text,
  Button,
  IconButton,
  Chip,
  Switch,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";

interface ReminderDialogProps {
  visible: boolean;
  onDismiss: () => void;
  selectedReminderLink: any;
  customReminderDate: Date;
  setCustomReminderDate: (d: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (b: boolean) => void;
  showTimePicker: boolean;
  setShowTimePicker: (b: boolean) => void;
  webCustomDateTime: string;
  setWebCustomDateTime: (s: string) => void;
  reminders: { linkId: string; notificationId: string }[];
  smartRemindersEnabled: boolean;
  onScheduleReminder: (
    link: any,
    type: "1hour" | "evening" | "tomorrow" | "nextweek" | "instant" | "custom",
    customDate?: Date,
  ) => Promise<void>;
  onCancelReminder: (linkId: string) => Promise<void>;
  onToggleSmartReminders: (val: boolean) => Promise<void>;
}

export default function ReminderDialog({
  visible,
  onDismiss,
  selectedReminderLink,
  customReminderDate,
  setCustomReminderDate,
  showDatePicker,
  setShowDatePicker,
  showTimePicker,
  setShowTimePicker,
  webCustomDateTime,
  setWebCustomDateTime,
  reminders,
  smartRemindersEnabled,
  onScheduleReminder,
  onCancelReminder,
  onToggleSmartReminders,
}: ReminderDialogProps) {

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === "dismissed") {
      return;
    }
    if (selectedDate) {
      const newDate = new Date(customReminderDate);
      newDate.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
      setCustomReminderDate(newDate);

      // Auto-open time picker on Native for a seamless wizard flow
      if (Platform.OS !== "web") {
        setTimeout(() => {
          setShowTimePicker(true);
        }, 300);
      }
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === "dismissed") {
      return;
    }
    if (selectedTime) {
      const newDate = new Date(customReminderDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setCustomReminderDate(newDate);
    }
  };

  const hasActiveReminder = selectedReminderLink
    ? reminders.some((r) => r.linkId === selectedReminderLink._id)
    : false;

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ borderRadius: 20, backgroundColor: "#ffffff" }}
    >
      <Dialog.Title
        style={{
          textAlign: "center",
          fontWeight: "bold",
          color: "#1a1a2e",
        }}
      >
        🔔 Hatırlatıcı Ayarla
      </Dialog.Title>
      <Dialog.Content>
        {selectedReminderLink && (
          <ScrollView
            style={{ maxHeight: 380 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              variant="titleSmall"
              style={{
                fontWeight: "bold",
                marginBottom: 4,
                color: "#1a1a2e",
              }}
            >
              Seçilen Bağlantı:
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: "#666", marginBottom: 16, lineHeight: 20 }}
              numberOfLines={2}
            >
              {selectedReminderLink.title || selectedReminderLink.url}
            </Text>

            <Text
              variant="labelLarge"
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                color: "#1a1a2e",
              }}
            >
              📅 Tarih & Saat Seç:
            </Text>

            {Platform.OS === "web" ? (
              <View style={{ marginBottom: 16 }}>
                <input
                  type="datetime-local"
                  value={webCustomDateTime}
                  onChange={(e) => setWebCustomDateTime(e.target.value)}
                  style={webStyles.datetimeInput}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <Button
                  mode="contained"
                  icon="bell-plus"
                  disabled={!webCustomDateTime}
                  onPress={() => {
                    if (webCustomDateTime) {
                      const chosenDate = new Date(webCustomDateTime);
                      onScheduleReminder(
                        selectedReminderLink,
                        "custom",
                        chosenDate,
                      );
                    }
                  }}
                  style={styles.customReminderButton}
                  buttonColor="#6200ee"
                >
                  Hatırlatıcıyı Kur
                </Button>
              </View>
            ) : (
              <View style={{ marginBottom: 16 }}>
                {Platform.OS === "ios" ? (
                  <View
                    style={{
                      marginBottom: 12,
                      backgroundColor: "#f5f3ff",
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      variant="labelSmall"
                      style={{
                        color: "#6200ee",
                        fontWeight: "bold",
                        marginBottom: 8,
                      }}
                    >
                      Tarih & Saat Seçin:
                    </Text>
                    <View style={{ alignItems: "center", width: "100%" }}>
                      <DateTimePicker
                        value={customReminderDate}
                        mode="datetime"
                        display="compact"
                        themeVariant="light"
                        onChange={(event, date) => {
                          if (date) setCustomReminderDate(date);
                        }}
                        minimumDate={new Date()}
                      />
                    </View>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.dateTimePickerCard}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.8}
                    >
                      <IconButton
                        icon="calendar-clock"
                        iconColor="#6200ee"
                        size={26}
                        style={{ margin: 0 }}
                      />
                      <View style={{ flex: 1, marginLeft: 4 }}>
                        <Text
                          variant="labelSmall"
                          style={{ color: "#666", fontWeight: "bold" }}
                        >
                          Kurulacak Zaman:
                        </Text>
                        <Text
                          variant="titleMedium"
                          style={{ fontWeight: "bold", color: "#1a1a2e" }}
                        >
                          {customReminderDate.toLocaleDateString("tr-TR")} -{" "}
                          {customReminderDate.toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <IconButton
                        icon="chevron-right"
                        iconColor="#666"
                        size={20}
                        style={{ margin: 0 }}
                      />
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={customReminderDate}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        minimumDate={new Date()}
                      />
                    )}
                    {showTimePicker && (
                      <DateTimePicker
                        value={customReminderDate}
                        mode="time"
                        display="default"
                        onChange={onChangeTime}
                      />
                    )}
                  </>
                )}

                <Button
                  mode="contained"
                  icon="bell-plus"
                  onPress={() =>
                    onScheduleReminder(
                      selectedReminderLink,
                      "custom",
                      customReminderDate,
                    )
                  }
                  style={styles.customReminderButton}
                  buttonColor="#6200ee"
                >
                  Hatırlatıcıyı Kur
                </Button>
              </View>
            )}

            <Text
              variant="labelLarge"
              style={{
                fontWeight: "bold",
                marginTop: 8,
                marginBottom: 8,
                color: "#1a1a2e",
              }}
            >
              ⚡ Veya Hızlı Seçenekler:
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 8,
                paddingVertical: 4,
                marginBottom: 16,
              }}
            >
              <Chip
                icon="clock-outline"
                onPress={() =>
                  onScheduleReminder(selectedReminderLink, "1hour")
                }
                style={{ backgroundColor: "#f0f0f5" }}
              >
                1 Saat
              </Chip>
              <Chip
                icon="weather-night"
                onPress={() =>
                  onScheduleReminder(selectedReminderLink, "evening")
                }
                style={{ backgroundColor: "#f0f0f5" }}
              >
                Akşam (20:00)
              </Chip>
              <Chip
                icon="weather-sunset-up"
                onPress={() =>
                  onScheduleReminder(selectedReminderLink, "tomorrow")
                }
                style={{ backgroundColor: "#f0f0f5" }}
              >
                Yarın (09:00)
              </Chip>
              <Chip
                icon="calendar-week"
                onPress={() =>
                  onScheduleReminder(selectedReminderLink, "nextweek")
                }
                style={{ backgroundColor: "#f0f0f5" }}
              >
                Haftaya
              </Chip>
              <Chip
                icon="timer-sand"
                onPress={() =>
                  onScheduleReminder(selectedReminderLink, "instant")
                }
                style={{
                  backgroundColor: "#fff9db",
                  borderColor: "#ffe066",
                  borderWidth: 1,
                }}
                textStyle={{ color: "#856404", fontWeight: "bold" }}
              >
                Test (10s)
              </Chip>
            </ScrollView>

            {/* Cancel existing reminder if scheduled */}
            {hasActiveReminder && (
              <Button
                mode="contained"
                buttonColor="#d32f2f"
                icon="bell-off"
                onPress={() => onCancelReminder(selectedReminderLink._id)}
                style={{ marginBottom: 16, borderRadius: 12 }}
              >
                Mevcut Hatırlatıcıyı İptal Et
              </Button>
            )}

            <View
              style={{
                borderTopWidth: 0.5,
                borderTopColor: "#eee",
                paddingTop: 16,
                marginTop: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    variant="labelLarge"
                    style={{ fontWeight: "bold", color: "#1a1a2e" }}
                  >
                    Haftalık Akıllı Hatırlatıcı
                  </Text>
                  <Text variant="bodySmall" style={{ color: "#666" }}>
                    Pazartesi günleri kaydettiğin bağlantıları incelemek ve
                    okuma listeni düzenlemek için hatırlatıcı gönderir.
                  </Text>
                </View>
                <Switch
                  value={smartRemindersEnabled}
                  onValueChange={onToggleSmartReminders}
                  color="#6200ee"
                />
              </View>
            </View>
          </ScrollView>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor="#666">
          Vazgeç
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const webStyles = {
  datetimeInput: {
    width: "100%",
    padding: 12,
    fontSize: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#6200ee",
    backgroundColor: "#ffffff",
    color: "#1a1a2e",
    outlineWidth: 0,
    marginBottom: 12,
    boxSizing: "border-box" as any,
  },
};

const styles = StyleSheet.create({
  dateTimePickerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "#e0d9ff",
    marginBottom: 12,
  },
  customReminderButton: {
    borderRadius: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
});
