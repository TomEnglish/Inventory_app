import { Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export function SignOutButton() {
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Pressable onPress={handleSignOut} style={{ marginRight: 15 }}>
      {({ pressed }) => (
        <FontAwesome
          name="sign-out"
          size={22}
          color="#64748B"
          style={{ opacity: pressed ? 0.5 : 1 }}
        />
      )}
    </Pressable>
  );
}
