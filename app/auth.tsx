import React from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import AuthScreen from '../components/AuthScreen';
import { useAuth } from '../context/AuthContext';

export default function AuthRoute() {
  const router = useRouter();
  const { login } = useAuth();

  const handleAuthSuccess = async (token: string, user: any) => {
    await login(token, user);
    
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.closeButtonContainer}>
        <IconButton
          icon="close"
          size={24}
          iconColor="#fff"
          onPress={handleClose}
        />
      </View>
      <AuthScreen onAuthSuccess={handleAuthSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0c20",
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 10,
  },
});
