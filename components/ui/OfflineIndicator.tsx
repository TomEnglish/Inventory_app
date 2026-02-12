import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStore } from '@/lib/sync/networkStore';

export function OfflineIndicator() {
  const isOnline = useNetworkStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You are offline — changes will sync when reconnected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
