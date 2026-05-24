import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Button, Text, Portal } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

type PaywallModalProps = {
  visible: boolean;
  onClose: () => void;
  reason?: string; // e.g., "Link limitine ulaştınız!"
};

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose, reason }) => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/payments/subscribe');
      if (response.data?.user) {
        await updateUser(response.data.user);
        Alert.alert(
          "Tebrikler! 🎉",
          "LinkFlow Pro üyeliğiniz başarıyla aktif edildi. Sınırsız özelliklerin keyfini çıkarın!",
          [{ text: "Harika!", onPress: onClose }]
        );
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      Alert.alert("Hata", error.response?.data?.message || "Ödeme işlemi gerçekleştirilemedi.");
    } finally {
      setLoading(false);
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
            {/* Header / Crown icon */}
            <View style={styles.header}>
              <View style={styles.crownContainer}>
                <Text style={styles.crownIcon}>👑</Text>
              </View>
              <Text style={styles.title}>LINKFLOW PRO</Text>
              {reason && <Text style={styles.reason}>{reason}</Text>}
              <Text style={styles.subtitle}>Sınırları kaldırın ve profesyonel olun!</Text>
            </View>

            {/* Features List */}
            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Text style={styles.checkIcon}>✨</Text>
                <View>
                  <Text style={styles.featureTitle}>Sınırsız Link & Klasör</Text>
                  <Text style={styles.featureDesc}>Limitlere takılmadan arşivleyin.</Text>
                </View>
              </View>
              
              <View style={styles.featureItem}>
                <Text style={styles.checkIcon}>👥</Text>
                <View>
                  <Text style={styles.featureTitle}>Gelişmiş Ortak Çalışma</Text>
                  <Text style={styles.featureDesc}>Klasörlerinize sınırsız editör ekleyin.</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.checkIcon}>🎨</Text>
                <View>
                  <Text style={styles.featureTitle}>Premium Profil Temaları</Text>
                  <Text style={styles.featureDesc}>Kamu profiliniz için hareketli & özel tasarımlar.</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.checkIcon}>📊</Text>
                <View>
                  <Text style={styles.featureTitle}>Detaylı İstatistikler</Text>
                  <Text style={styles.featureDesc}>Tıklanma ve ziyaretçi analizleri (Yakında).</Text>
                </View>
              </View>
            </View>

            {/* Plan Selector */}
            <View style={styles.plansContainer}>
              <TouchableOpacity 
                style={[
                  styles.planCard, 
                  selectedPlan === 'monthly' && styles.selectedPlanCard,
                  { borderColor: selectedPlan === 'monthly' ? '#6C63FF' : '#E0E0E0' }
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.planRadioRow}>
                  <View style={[styles.radioButton, selectedPlan === 'monthly' && styles.radioButtonChecked]} />
                  <Text style={styles.planTitle}>Aylık Plan</Text>
                </View>
                <Text style={styles.planPrice}>₺99 <Text style={styles.planPeriod}>/ ay</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.planCard, 
                  selectedPlan === 'yearly' && styles.selectedPlanCard,
                  { borderColor: selectedPlan === 'yearly' ? '#6C63FF' : '#E0E0E0' }
                ]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>EN POPÜLER (%40 TASARRUF)</Text>
                </View>
                <View style={styles.planRadioRow}>
                  <View style={[styles.radioButton, selectedPlan === 'yearly' && styles.radioButtonChecked]} />
                  <Text style={styles.planTitle}>Yıllık Plan</Text>
                </View>
                <Text style={styles.planPrice}>₺699 <Text style={styles.planPeriod}>/ yıl</Text></Text>
              </TouchableOpacity>
            </View>

            {/* Subscribe Button */}
            <Button
              mode="contained"
              onPress={handleSubscribe}
              loading={loading}
              disabled={loading}
              style={styles.subscribeBtn}
              labelStyle={styles.subscribeBtnLabel}
            >
              {loading ? "İşlem Yapılıyor..." : "Şimdi Pro'ya Geç"}
            </Button>

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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  crownContainer: {
    backgroundColor: '#FFF9C4',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FBC02D',
  },
  crownIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 1.2,
  },
  reason: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    fontWeight: '600',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#757575',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  features: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureDesc: {
    fontSize: 12,
    color: '#757575',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#FAFAFA',
  },
  selectedPlanCard: {
    backgroundColor: '#F5F4FF',
    borderWidth: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFA000',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#5D4037',
  },
  planRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#757575',
    marginRight: 8,
  },
  radioButtonChecked: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
    marginLeft: 24,
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: '400',
    color: '#757575',
  },
  subscribeBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  subscribeBtnLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  closeBtnText: {
    color: '#757575',
    fontSize: 13,
    fontWeight: '600',
  },
});
