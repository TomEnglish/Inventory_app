import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useNetworkStore } from '@/lib/sync/networkStore';
import { startAutoSync } from '@/lib/sync/syncManager';
import { AppErrorBoundary } from '@/components/ui/ErrorBoundary';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Start network monitoring and auto-sync
  useEffect(() => {
    const unsubNetwork = useNetworkStore.getState().startListening();
    const unsubSync = startAutoSync();
    return () => {
      unsubNetwork();
      unsubSync();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(field)" />
        <Stack.Screen name="(office)" />
      </Stack>
    </AppErrorBoundary>
  );
}
