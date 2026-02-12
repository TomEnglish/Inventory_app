import { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useReceivingStore } from '@/stores/receivingStore';
import { supabase } from '@/lib/supabase';
import type { Location } from '@/types/database';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function LocationStep({ onNext, onBack }: Props) {
  const { location, setLocation } = useReceivingStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected] = useState(location.location_id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const { data, error: err } = await supabase
      .from('locations')
      .select('*')
      .order('zone')
      .order('row')
      .order('rack');

    if (err) {
      setError('Failed to load locations');
    } else {
      setLocations(data as Location[]);
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (!selected) {
      setError('Please select a location');
      return;
    }
    setLocation({ location_id: selected });
    onNext();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Loading locations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Storage Location</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {locations.length === 0 ? (
        <Text style={styles.hint}>
          No locations configured. Ask an office admin to add yard locations.
        </Text>
      ) : (
        locations.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            style={[styles.locationCard, selected === loc.id && styles.locationSelected]}
            onPress={() => {
              setSelected(loc.id);
              setError('');
            }}
          >
            <Text style={[styles.locationText, selected === loc.id && styles.locationTextSelected]}>
              {loc.zone} - Row {loc.row}, Rack {loc.rack}
            </Text>
            {loc.is_hold_area && <Text style={styles.holdBadge}>HOLD AREA</Text>}
          </TouchableOpacity>
        ))
      )}

      <Button title="Next" onPress={handleNext} style={{ marginTop: 16 }} />
      <Button title="Back" variant="secondary" onPress={onBack} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  error: { color: '#DC2626', fontSize: 14, marginBottom: 8 },
  hint: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  locationText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  locationTextSelected: {
    color: '#2563EB',
  },
  holdBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
