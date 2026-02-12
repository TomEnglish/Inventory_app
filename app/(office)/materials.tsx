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
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchMaterials, type MaterialWithLocation } from '@/lib/api/materials';
import { supabase } from '@/lib/supabase';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'in_yard', label: 'In Yard' },
  { value: 'issued', label: 'Issued' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'depleted', label: 'Depleted' },
];

export default function MaterialsScreen() {
  const [materials, setMaterials] = useState<MaterialWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Edit modal state
  const [editItem, setEditItem] = useState<MaterialWithLocation | null>(null);
  const [editType, setEditType] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSpec, setEditSpec] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMaterials({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setMaterials(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [statusFilter, search])
  );

  const openEdit = (item: MaterialWithLocation) => {
    setEditItem(item);
    setEditType(item.material_type);
    setEditSize(item.size ?? '');
    setEditGrade(item.grade ?? '');
    setEditSpec(item.spec ?? '');
    setEditWeight(item.weight ? String(item.weight) : '');
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('materials')
        .update({
          material_type: editType,
          size: editSize || null,
          grade: editGrade || null,
          spec: editSpec || null,
          weight: editWeight ? parseFloat(editWeight) : null,
        })
        .eq('id', editItem.id);

      if (error) throw new Error(error.message);
      setEditItem(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

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
    <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
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
          {item.location_zone} - Row {item.location_row}, Rack {item.location_rack}
        </Text>
      )}
      <Text style={styles.editHint}>Tap to edit</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
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
      </ScrollView>

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

      {/* Edit Modal */}
      <Modal visible={!!editItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Material</Text>
            <Input label="Material Type" value={editType} onChangeText={setEditType} />
            <Input label="Size" value={editSize} onChangeText={setEditSize} />
            <Input label="Grade" value={editGrade} onChangeText={setEditGrade} />
            <Input label="Spec" value={editSpec} onChangeText={setEditSpec} />
            <Input label="Weight" value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" />
            <Button title="Save" onPress={handleSave} loading={saving} />
            <Button title="Cancel" variant="secondary" onPress={() => setEditItem(null)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
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
  filterScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButton: { paddingVertical: 6, paddingHorizontal: 14 },
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
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardDetails: { flexDirection: 'row', gap: 12, marginTop: 6 },
  detail: { fontSize: 13, color: '#64748B' },
  location: { fontSize: 12, color: '#94A3B8', marginTop: 6 },
  editHint: { fontSize: 11, color: '#CBD5E1', marginTop: 4, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 12 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
});
