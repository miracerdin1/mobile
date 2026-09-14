import React, { useEffect, useState } from "react";
import { Alert, Modal, TouchableOpacity, View } from "react-native";
import { Button, IconButton, Portal, Text } from "react-native-paper";

import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";
import PrimaryButton from "./PrimaryButton";
import {
  DEFAULT_STORE_PLAN_OPTIONS,
  getStoreBillingErrorMessage,
  isPurchaseCancelled,
  isStoreBillingConfigured,
  loadStorePlanOptions,
  purchaseProPlan,
  restoreProPurchase,
} from "../services/storeBilling";
import { PaywallModalProps, StorePlan, StorePlanOption } from "../types/payment";

const FEATURES = [
  {
    title: "Sınırsız Link & Klasör",
    desc: "Limitlere takılmadan arşivleyin.",
  },
  {
    title: "Gelişmiş Ortak Çalışma",
    desc: "Klasörlerinize sınırsız editör ekleyin.",
  },
  {
    title: "Premium Profil Temaları",
    desc: "Kamu profiliniz için özel tasarımlar.",
  },
];

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  reason,
}) => {
  const { user, updateUser } = useAuth();
  const theme = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StorePlan>("yearly");
  const [planOptions, setPlanOptions] = useState<StorePlanOption[]>(
    DEFAULT_STORE_PLAN_OPTIONS,
  );
  const billingConfigured = isStoreBillingConfigured();

  useEffect(() => {
    let cancelled = false;

    if (!visible || !billingConfigured) {
      setPlanOptions(DEFAULT_STORE_PLAN_OPTIONS);
      return () => {
        cancelled = true;
      };
    }

    loadStorePlanOptions(user)
      .then((options) => {
        if (!cancelled) {
          setPlanOptions(options);
        }
      })
      .catch((error) => {
        console.warn("Store plan options could not be loaded:", error);
        if (!cancelled) {
          setPlanOptions(DEFAULT_STORE_PLAN_OPTIONS);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible, user, billingConfigured]);

  const handleSubscribe = async () => {
    if (!billingConfigured) {
      Alert.alert("Hata", "Mağaza ödeme anahtarları yapılandırılmamış.");
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await purchaseProPlan(user, selectedPlan);
      await updateUser(updatedUser);
      Alert.alert(
        "Tebrikler!",
        "LinkFlow Pro üyeliğiniz başarıyla aktif edildi. Sınırsız özelliklerin keyfini çıkarın!",
        [{ text: "Harika!", onPress: onClose }],
      );
    } catch (error) {
      if (isPurchaseCancelled(error)) return;

      console.error("Payment error:", error);
      Alert.alert("Hata", getStoreBillingErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!billingConfigured) {
      Alert.alert("Hata", "Mağaza ödeme anahtarları yapılandırılmamış.");
      return;
    }

    setRestoring(true);
    try {
      const updatedUser = await restoreProPurchase(user);
      await updateUser(updatedUser);
      Alert.alert("Başarılı", "Pro satın alımınız geri yüklendi.", [
        { text: "Tamam", onPress: onClose },
      ]);
    } catch (error) {
      if (isPurchaseCancelled(error)) return;

      console.error("Restore purchase error:", error);
      Alert.alert("Hata", getStoreBillingErrorMessage(error));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.backdrop,
            justifyContent: "center",
            alignItems: "center",
            padding: theme.spacing.lg,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.lg,
              width: "100%",
              maxWidth: 380,
              elevation: 8,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: theme.spacing.lg }}>
              <View
                style={{
                  backgroundColor: theme.app.warningContainer,
                  minWidth: 60,
                  height: 60,
                  borderRadius: theme.radius.full,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: theme.spacing.sm + theme.spacing.xs,
                  borderWidth: 1,
                  borderColor: theme.app.warning,
                  paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
                }}
              >
                <Text style={{ color: theme.app.onWarningContainer, fontSize: 15, fontFamily: theme.fontFamily.bold, letterSpacing: 0.5 }}>
                  PRO
                </Text>
              </View>
              <Text style={{ fontSize: 22, fontFamily: theme.fontFamily.bold, color: theme.colors.onSurface, letterSpacing: 0.5 }}>
                LINKFLOW PRO
              </Text>
              {reason && (
                <Text
                  style={{
                    backgroundColor: theme.colors.errorContainer,
                    color: theme.colors.onErrorContainer,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: 14,
                    paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.radius.md,
                    marginTop: theme.spacing.sm,
                    textAlign: "center",
                  }}
                >
                  {reason}
                </Text>
              )}
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, marginTop: theme.spacing.xs + 2, textAlign: "center" }}>
                Sınırları kaldırın ve profesyonel olun.
              </Text>
            </View>

            <View style={{ marginBottom: theme.spacing.lg }}>
              {FEATURES.map((feature) => (
                <View key={feature.title} style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.sm + theme.spacing.xs }}>
                  <IconButton
                    icon="check-circle"
                    size={20}
                    iconColor={theme.app.success}
                    style={{ margin: 0, marginRight: theme.spacing.xs }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}>
                      {feature.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={{ marginBottom: theme.spacing.lg }}>
              {planOptions.map((option) => {
                const selected = selectedPlan === option.plan;
                return (
                  <TouchableOpacity
                    key={option.plan}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={{
                      borderWidth: selected ? 2 : 1.5,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.sm + theme.spacing.xs,
                      position: "relative",
                      backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                      borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                    }}
                    onPress={() => setSelectedPlan(option.plan)}
                  >
                    {option.badge && (
                      <View
                        style={{
                          position: "absolute",
                          top: -10,
                          right: 12,
                          backgroundColor: theme.app.warning,
                          paddingHorizontal: theme.spacing.xs + 2,
                          paddingVertical: 2,
                          borderRadius: theme.radius.sm,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontFamily: theme.fontFamily.bold, color: theme.app.onWarningContainer }}>
                          {option.badge}
                        </Text>
                      </View>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.xs }}>
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: theme.radius.full,
                          borderWidth: 1.5,
                          borderColor: selected ? theme.colors.primary : theme.colors.outline,
                          backgroundColor: selected ? theme.colors.primary : "transparent",
                          marginRight: theme.spacing.sm,
                        }}
                      />
                      <Text style={{ fontSize: 14, fontFamily: theme.fontFamily.semibold, color: theme.colors.onSurface }}>
                        {option.title}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 18, fontFamily: theme.fontFamily.bold, color: theme.colors.onSurface, marginLeft: theme.spacing.lg }}>
                      {option.price}{" "}
                      <Text style={{ fontSize: 12, fontFamily: theme.fontFamily.regular, color: theme.colors.onSurfaceVariant }}>
                        {option.period}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <PrimaryButton
              onPress={handleSubscribe}
              loading={loading}
              disabled={loading || restoring}
              style={{ paddingVertical: theme.spacing.xs - 2, marginBottom: theme.spacing.sm + 2 }}
              labelStyle={{ fontSize: 16, fontFamily: theme.fontFamily.bold }}
            >
              {loading ? "İşlem Yapılıyor..." : "Şimdi Pro'ya Geç"}
            </PrimaryButton>

            <TouchableOpacity
              onPress={handleRestore}
              style={{ alignItems: "center", paddingVertical: theme.spacing.sm }}
              disabled={loading || restoring}
            >
              <Text style={{ color: theme.colors.primary, fontSize: 13, fontFamily: theme.fontFamily.semibold }}>
                {restoring ? "Geri Yükleniyor..." : "Satın Alımı Geri Yükle"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={{ alignItems: "center", paddingVertical: theme.spacing.xs + 2 }}>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, fontFamily: theme.fontFamily.medium }}>
                Daha Sonra
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};
