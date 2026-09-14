import React from "react";
import { Platform, ScrollView, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, Chip, Dialog, IconButton, Switch, Text } from "react-native-paper";

import { useAppTheme } from "../hooks/useAppTheme";
import PrimaryButton from "./PrimaryButton";
import { ReminderDialogProps } from "../types";

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
  const theme = useAppTheme();

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

  const quickChipStyle = {
    backgroundColor: theme.colors.surfaceVariant,
  };
  const quickChipTextStyle = {
    color: theme.colors.onSurfaceVariant,
    fontFamily: theme.fontFamily.medium,
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface }}
    >
      <Dialog.Title
        style={{
          textAlign: "center",
          fontFamily: theme.fontFamily.bold,
          color: theme.colors.onSurface,
        }}
      >
        Hatırlatıcı Ayarla
      </Dialog.Title>
      <Dialog.Content>
        {selectedReminderLink && (
          <ScrollView
            style={{ maxHeight: 380 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              variant="titleSmall"
              style={{ fontFamily: theme.fontFamily.semibold, marginBottom: theme.spacing.xs, color: theme.colors.onSurface }}
            >
              Seçilen Bağlantı:
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.md, lineHeight: 20 }}
              numberOfLines={2}
            >
              {selectedReminderLink.title || selectedReminderLink.url}
            </Text>

            <Text
              variant="labelLarge"
              style={{ fontFamily: theme.fontFamily.semibold, marginBottom: theme.spacing.sm, color: theme.colors.onSurface }}
            >
              Tarih & Saat Seç
            </Text>

            {Platform.OS === "web" ? (
              <View style={{ marginBottom: theme.spacing.md }}>
                <input
                  type="datetime-local"
                  value={webCustomDateTime}
                  onChange={(e) => setWebCustomDateTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    fontSize: 15,
                    borderRadius: theme.radius.md,
                    borderWidth: 1.5,
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.onSurface,
                    outlineWidth: 0,
                    marginBottom: theme.spacing.sm + theme.spacing.xs,
                    boxSizing: "border-box" as any,
                  }}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <PrimaryButton
                  icon="bell-plus"
                  disabled={!webCustomDateTime}
                  onPress={() => {
                    if (webCustomDateTime) {
                      const chosenDate = new Date(webCustomDateTime);
                      onScheduleReminder(selectedReminderLink, "custom", chosenDate);
                    }
                  }}
                  style={{ marginBottom: theme.spacing.md }}
                >
                  Hatırlatıcıyı Kur
                </PrimaryButton>
              </View>
            ) : (
              <View style={{ marginBottom: theme.spacing.md }}>
                {Platform.OS === "ios" ? (
                  <View
                    style={{
                      marginBottom: theme.spacing.sm + theme.spacing.xs,
                      backgroundColor: theme.colors.primaryContainer,
                      borderRadius: theme.radius.lg,
                      paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
                      paddingVertical: theme.spacing.sm + 2,
                    }}
                  >
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onPrimaryContainer, fontFamily: theme.fontFamily.semibold, marginBottom: theme.spacing.sm }}
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
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: theme.colors.primaryContainer,
                        borderRadius: theme.radius.lg,
                        paddingVertical: theme.spacing.sm + 2,
                        paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
                        marginBottom: theme.spacing.sm + theme.spacing.xs,
                      }}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Tarih ve saat seç"
                    >
                      <IconButton
                        icon="calendar-clock"
                        iconColor={theme.colors.primary}
                        size={26}
                        style={{ margin: 0 }}
                      />
                      <View style={{ flex: 1, marginLeft: theme.spacing.xs }}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, fontFamily: theme.fontFamily.semibold }}>
                          Kurulacak Zaman:
                        </Text>
                        <Text variant="titleMedium" style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onPrimaryContainer }}>
                          {customReminderDate.toLocaleDateString("tr-TR")} -{" "}
                          {customReminderDate.toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <IconButton
                        icon="chevron-right"
                        iconColor={theme.colors.onPrimaryContainer}
                        size={20}
                        style={{ margin: 0 }}
                      />
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={customReminderDate}
                        mode="date"
                        display="default"
                        themeVariant="light"
                        onChange={onChangeDate}
                        minimumDate={new Date()}
                      />
                    )}
                    {showTimePicker && (
                      <DateTimePicker
                        value={customReminderDate}
                        mode="time"
                        display="default"
                        themeVariant="light"
                        onChange={onChangeTime}
                      />
                    )}
                  </>
                )}

                <PrimaryButton
                  icon="bell-plus"
                  onPress={() =>
                    onScheduleReminder(selectedReminderLink, "custom", customReminderDate)
                  }
                  style={{ marginBottom: theme.spacing.md }}
                >
                  Hatırlatıcıyı Kur
                </PrimaryButton>
              </View>
            )}

            <Text
              variant="labelLarge"
              style={{ fontFamily: theme.fontFamily.semibold, marginTop: theme.spacing.xs, marginBottom: theme.spacing.sm, color: theme.colors.onSurface }}
            >
              Veya Hızlı Seçenekler
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.xs, marginBottom: theme.spacing.md }}
            >
              <Chip icon="clock-outline" onPress={() => onScheduleReminder(selectedReminderLink, "1hour")} style={quickChipStyle} textStyle={quickChipTextStyle}>
                1 Saat
              </Chip>
              <Chip icon="weather-night" onPress={() => onScheduleReminder(selectedReminderLink, "evening")} style={quickChipStyle} textStyle={quickChipTextStyle}>
                Akşam (20:00)
              </Chip>
              <Chip icon="weather-sunset-up" onPress={() => onScheduleReminder(selectedReminderLink, "tomorrow")} style={quickChipStyle} textStyle={quickChipTextStyle}>
                Yarın (09:00)
              </Chip>
              <Chip icon="calendar-week" onPress={() => onScheduleReminder(selectedReminderLink, "nextweek")} style={quickChipStyle} textStyle={quickChipTextStyle}>
                Haftaya
              </Chip>
              <Chip
                icon="timer-sand"
                onPress={() => onScheduleReminder(selectedReminderLink, "instant")}
                style={{ backgroundColor: theme.app.warningContainer, borderColor: theme.app.warning, borderWidth: 1 }}
                textStyle={{ color: theme.app.onWarningContainer, fontFamily: theme.fontFamily.semibold }}
              >
                Test (10s)
              </Chip>
            </ScrollView>

            {/* Cancel existing reminder if scheduled */}
            {hasActiveReminder && (
              <Button
                mode="contained"
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
                icon="bell-off"
                onPress={() => onCancelReminder(selectedReminderLink._id)}
                style={{ marginBottom: theme.spacing.md, borderRadius: theme.radius.md }}
              >
                Mevcut Hatırlatıcıyı İptal Et
              </Button>
            )}

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.colors.outlineVariant,
                paddingTop: theme.spacing.md,
                marginTop: theme.spacing.sm,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                  <Text variant="labelLarge" style={{ fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}>
                    Haftalık Akıllı Hatırlatıcı
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Pazartesi günleri kaydettiğin bağlantıları incelemek ve
                    okuma listeni düzenlemek için hatırlatıcı gönderir.
                  </Text>
                </View>
                <Switch value={smartRemindersEnabled} onValueChange={onToggleSmartReminders} color={theme.colors.primary} />
              </View>
            </View>
          </ScrollView>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={theme.colors.onSurfaceVariant}>
          Vazgeç
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
