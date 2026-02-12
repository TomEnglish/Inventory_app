import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/Button';
import { fetchMaterials, type MaterialWithLocation } from '@/lib/api/materials';
import { useNetworkStore } from '@/lib/sync/networkStore';
import { getCached, setCache } from '@/lib/sync/readCache';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'in_yard', label: 'In Yard' },
  { value: 'issued', label: 'Issued' },
  { value: 'depleted', label: 'Depleted' },
];

export default function InventoryScreen() {
  const [materials, setMaterials] = useState<MaterialWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isOnline = useNetworkStore((s) => s.isOnline);

  const load = async () => {
    setLoading(true);
    const cacheKey = `materials_${statusFilter}_${search}`;
    try {
      const data = await fetchMaterials({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setMaterials(data);
      await setCache(cacheKey, data);
    } catch (e: any) {
      // If offline, try cache
      const cached = await getCached<MaterialWithLocation[]>(cacheKey);
      if (cached) {
        setMaterials(cached);
      } else {
        Alert.alert('Error', e.message);
      }
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [statusFilter, search])
  );

  const statusColor = (status: string) => {
    switch (status) {
      case 'in_yard': return '#16A34A';
      case 'issued': return '#D97706';
      case 'shipped': return '#2563EB';
      case 'depleted': return '#94A3B8';
      default: return '#64748B';
    }
  };

  const renderItem = ({ item }: { item: MaterialWithLocation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/(field)/material-detail' as any, params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.material_type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        {item.size && <Text style={styles.detail}>Size: {item.size}</Text>}
        {item.grade && <Text style={styles.detail}>Grade: {item.grade}</Text>}
        <Text style={styles.detail}>Qty: {item.current_quantity}/{item.qty}</Text>
      </View>

      {item.location_zone && (
        <Text style={styles.location}>
          <FontAwesome name="map-marker" size={12} color="#94A3B8" />
          {'  '}{item.location_zone} - Row {item.location_row}, Rack {item.location_rack}
        </Text>
      )}

      {item.qr_code_value && (
        <Text style={styles.qrCode}>QR: {item.qr_code_value}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by type, grade, or QR code..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            title={f.label}
            variant={statusFilter === f.value ? 'primary' : 'secondary'}
            onPress={() => setStatusFilter(f.value)}
            style={styles.filterButton}
          />
        ))}
      </View>

      <FlatList
        data={materials}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="cubes" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No materials found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchBar: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1E293B',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterButton: { flex: 1, paddingVertical: 6, paddingHorizontal: 4 },
  list: { padding: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  detail: { fontSize: 13, color: '#64748B' },
  location: { fontSize: 12, color: '#94A3B8', marginTop: 6 },
  qrCode: { fontSize: 11, color: '#CBD5E1', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 12 },
});
