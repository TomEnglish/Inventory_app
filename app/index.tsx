import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function IndexScreen() {
  const { user, loading, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/(auth)/login');
    } else if (user.role === 'field_worker') {
      router.replace('/(field)/scan');
    } else {
      router.replace('/(office)/dashboard');
    }
  }, [user, loading]);

  return <LoadingScreen message="Loading session..." />;
}
