import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import {
  fetchKPIs,
  fetchInventoryByType,
  fetchYardOverview,
  type KPIData,
  type InventoryByType,
  type YardLocation,
} from '@/lib/api/dashboard';

export default function DashboardScreen() {
  const [kpis, setKPIs] = useState<KPIData | null>(null);
  const [byType, setByType] = useState<InventoryByType[]>([]);
  const [yardOverview, setYardOverview] = useState<YardLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [k, t, y] = await Promise.all([
        fetchKPIs(),
        fetchInventoryByType(),
        fetchYardOverview(),
      ]);
      setKPIs(k);
      setByType(t);
      setYardOverview(y);
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

  const maxTypeCount = Math.max(...byType.map((t) => t.item_count), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <KPICard
          icon="cubes"
          label="In Yard"
          value={kpis?.totalInYard ?? 0}
          subvalue={`${kpis?.totalQuantityInYard ?? 0} total qty`}
          color="#2563EB"
        />
        <KPICard
          icon="list"
          label="All Materials"
          value={kpis?.totalMaterials ?? 0}
          color="#64748B"
        />
        <KPICard
          icon="exclamation-triangle"
          label="Open Exceptions"
          value={kpis?.openExceptions ?? 0}
          color={kpis?.openExceptions ? '#DC2626' : '#16A34A'}
        />
        <KPICard
          icon="clock-o"
          label="Aging > 30d"
          value={kpis?.agingOver30 ?? 0}
          subvalue={`${kpis?.agingOver90 ?? 0} over 90d`}
          color="#D97706"
        />
      </View>

      {/* Inventory by Type */}
      <Text style={styles.sectionTitle}>Inventory by Type</Text>
      <Card style={{ marginBottom: 16 }}>
        {byType.length === 0 ? (
          <Text style={styles.emptyText}>No materials in yard</Text>
        ) : (
          byType.map((t) => (
            <View key={t.material_type} style={styles.barRow}>
              <Text style={styles.barLabel}>{t.material_type}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(t.item_count / maxTypeCount) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{t.item_count}</Text>
            </View>
          ))
        )}
      </Card>

      {/* Yard Overview */}
      <Text style={styles.sectionTitle}>Yard Overview</Text>
      <Card>
        {yardOverview.length === 0 ? (
          <Text style={styles.emptyText}>No locations configured</Text>
        ) : (
          yardOverview.map((loc) => (
            <View key={loc.location_id} style={styles.locationRow}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>
                  {loc.zone} - R{loc.row}/Rk{loc.rack}
                </Text>
                {loc.is_hold_area && <Text style={styles.holdBadge}>HOLD</Text>}
              </View>
              <Text style={styles.locationCount}>
                {loc.items_stored} items ({loc.total_quantity} qty)
              </Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function KPICard({
  icon,
  label,
  value,
  subvalue,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  subvalue?: string;
  color: string;
}) {
  return (
    <Card style={styles.kpiCard}>
      <FontAwesome name={icon} size={20} color={color} />
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {subvalue && <Text style={styles.kpiSub}>{subvalue}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  kpiValue: { fontSize: 28, fontWeight: '700', marginTop: 6 },
  kpiLabel: { fontSize: 13, color: '#64748B', marginTop: 2 },
  kpiSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  barLabel: { width: 100, fontSize: 13, color: '#374151' },
  barTrack: {
    flex: 1,
    height: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  barValue: { width: 30, fontSize: 13, color: '#1E293B', fontWeight: '600', textAlign: 'right' },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationName: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  holdBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  locationCount: { fontSize: 13, color: '#64748B' },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingVertical: 12 },
});
