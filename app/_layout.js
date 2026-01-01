import React, { useState, useEffect } from 'react';
import { Stack, useRouter, SplashScreen } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Keep the splash screen open while we check for a user
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    SplashScreen.hideAsync();

    // Force navigation to the correct path
    if (!user) {
      router.replace('/login');
    } else {
      // Assuming you renamed your folder back to (tabs)
      router.replace('/(tabs)');
    }
  }, [isReady, user]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e028b1" />
      </View>
    );
  }

  return (
    <Stack>
      {/* These are the only two valid screens */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
});