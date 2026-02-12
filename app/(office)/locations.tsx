import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import type { Location } from '@/types/database';

export default function LocationsScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Add form
  const [zone, setZone] = useState('');
  const [row, setRow] = useState('');
  const [rack, setRack] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isHold, setIsHold] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('zone')
      .order('row')
      .order('rack');

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setLocations((data as Location[]) ?? []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const handleAdd = async () => {
    if (!zone || !row || !rack) {
      Alert.alert('Error', 'Zone, Row, and Rack are required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('locations').insert({
        zone,
        row,
        rack,
        is_hold_area: isHold,
        capacity: capacity ? parseInt(capacity, 10) : null,
      });
      if (error) throw new Error(error.message);
      setShowAdd(false);
      setZone('');
      setRow('');
      setRack('');
      setCapacity('');
      setIsHold(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const renderItem = ({ item }: { item: Location }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>
          {item.zone} - Row {item.row}, Rack {item.rack}
        </Text>
        {item.is_hold_area && <Text style={styles.holdBadge}>HOLD AREA</Text>}
      </View>
      {item.capacity && (
        <Text style={styles.cardDetail}>Capacity: {item.capacity}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{locations.length} locations</Text>
        <Button title="+ Add" onPress={() => setShowAdd(true)} style={styles.addButton} />
      </View>

      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="map-marker" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No locations configured</Text>
          </View>
        }
      />

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Location</Text>
            <Input label="Zone" value={zone} onChangeText={setZone} placeholder="e.g. A, B, HOLD" />
            <Input label="Row" value={row} onChangeText={setRow} placeholder="e.g. 1, 2, 3" />
            <Input label="Rack" value={rack} onChangeText={setRack} placeholder="e.g. 1, 2, 3" />
            <Input
              label="Capacity (optional)"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
              placeholder="Max items"
            />

            <Text style={styles.label}>Hold Area?</Text>
            <View style={styles.toggleRow}>
              <Button
                title="No"
                variant={!isHold ? 'primary' : 'secondary'}
                onPress={() => setIsHold(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Yes"
                variant={isHold ? 'danger' : 'secondary'}
                onPress={() => setIsHold(true)}
                style={{ flex: 1 }}
              />
            </View>

            <Button title="Save" onPress={handleAdd} loading={saving} style={{ marginTop: 8 }} />
            <Button title="Cancel" variant="secondary" onPress={() => setShowAdd(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 15, color: '#64748B' },
  addButton: { paddingVertical: 8, paddingHorizontal: 16 },
  list: { padding: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  holdBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardDetail: { fontSize: 13, color: '#64748B', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 12 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
});
