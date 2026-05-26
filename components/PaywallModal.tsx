import React, { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Portal, Text } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
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

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  reason,
}) => {
  const { user, updateUser } = useAuth();
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
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.crownContainer}>
                <Text style={styles.crownIcon}>PRO</Text>
              </View>
              <Text style={styles.title}>LINKFLOW PRO</Text>
              {reason && <Text style={styles.reason}>{reason}</Text>}
              <Text style={styles.subtitle}>
                Sınırları kaldırın ve profesyonel olun.
              </Text>
            </View>

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Sınırsız Link & Klasör</Text>
                  <Text style={styles.featureDesc}>
                    Limitlere takılmadan arşivleyin.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Gelişmiş Ortak Çalışma</Text>
                  <Text style={styles.featureDesc}>
                    Klasörlerinize sınırsız editör ekleyin.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Premium Profil Temaları</Text>
                  <Text style={styles.featureDesc}>
                    Kamu profiliniz için özel tasarımlar.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.plansContainer}>
              {planOptions.map((option) => (
                <TouchableOpacity
                  key={option.plan}
                  style={[
                    styles.planCard,
                    selectedPlan === option.plan && styles.selectedPlanCard,
                    {
                      borderColor:
                        selectedPlan === option.plan ? "#6C63FF" : "#E0E0E0",
                    },
                  ]}
                  onPress={() => setSelectedPlan(option.plan)}
                >
                  {option.badge && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>{option.badge}</Text>
                    </View>
                  )}
                  <View style={styles.planRadioRow}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedPlan === option.plan && styles.radioButtonChecked,
                      ]}
                    />
                    <Text style={styles.planTitle}>{option.title}</Text>
                  </View>
                  <Text style={styles.planPrice}>
                    {option.price}{" "}
                    <Text style={styles.planPeriod}>{option.period}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={handleSubscribe}
              loading={loading}
              disabled={loading || restoring}
              style={styles.subscribeBtn}
              labelStyle={styles.subscribeBtnLabel}
            >
              {loading ? "İşlem Yapılıyor..." : "Şimdi Pro'ya Geç"}
            </Button>

            <TouchableOpacity
              onPress={handleRestore}
              style={styles.restoreBtn}
              disabled={loading || restoring}
            >
              <Text style={styles.restoreBtnText}>
                {restoring ? "Geri Yükleniyor..." : "Satın Alımı Geri Yükle"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Daha Sonra</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  crownContainer: {
    backgroundColor: "#FFF9C4",
    minWidth: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FBC02D",
    paddingHorizontal: 12,
  },
  crownIcon: {
    color: "#F57F17",
    fontSize: 16,
    fontWeight: "900",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    letterSpacing: 1.2,
  },
  reason: {
    backgroundColor: "#FFEBEE",
    color: "#C62828",
    fontWeight: "600",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#757575",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  features: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  checkIcon: {
    color: "#2E7D32",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 12,
    width: 22,
    textAlign: "center",
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212121",
  },
  featureDesc: {
    fontSize: 12,
    color: "#757575",
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: "relative",
    backgroundColor: "#FAFAFA",
  },
  selectedPlanCard: {
    backgroundColor: "#F5F4FF",
    borderWidth: 2,
  },
  badgeContainer: {
    position: "absolute",
    top: -10,
    right: 12,
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFA000",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#5D4037",
  },
  planRadioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#757575",
    marginRight: 8,
  },
  radioButtonChecked: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },
  planTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212121",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#212121",
    marginLeft: 24,
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: "400",
    color: "#757575",
  },
  subscribeBtn: {
    backgroundColor: "#6C63FF",
    borderRadius: 14,
    paddingVertical: 6,
    marginBottom: 10,
  },
  subscribeBtnLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  restoreBtnText: {
    color: "#6C63FF",
    fontSize: 13,
    fontWeight: "700",
  },
  closeBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  closeBtnText: {
    color: "#757575",
    fontSize: 13,
    fontWeight: "600",
  },
});
