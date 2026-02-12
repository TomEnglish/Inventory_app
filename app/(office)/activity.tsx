import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuthStore } from '@/stores/authStore';
import { fetchRecentActivity, type ActivityItem } from '@/lib/api/activity';

const ICONS: Record<string, { name: any; color: string; bg: string }> = {
  receiving: { name: 'download', color: '#2563EB', bg: '#EFF6FF' },
  transfer: { name: 'exchange', color: '#D97706', bg: '#FFFBEB' },
  issue: { name: 'sign-out', color: '#16A34A', bg: '#F0FDF4' },
};

export default function ActivityScreen() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchRecentActivity();
      setItems(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: ActivityItem }) => {
    const icon = ICONS[item.type] ?? ICONS.receiving;
    return (
      <View style={styles.card}>
        <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
          <FontAwesome name={icon.name} size={16} color={icon.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.description}</Text>
          <Text style={styles.cardDetail}>{item.detail}</Text>
        </View>
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="history" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  list: { padding: 12, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  cardDetail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  time: { fontSize: 11, color: '#94A3B8' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 12 },
});
