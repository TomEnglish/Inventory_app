import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface AgingItem {
  id: string;
  material_type: string;
  size: string | null;
  grade: string | null;
  current_quantity: number;
  zone: string | null;
  row: string | null;
  rack: string | null;
  days_in_yard: number;
}

interface InventorySummary {
  material_type: string;
  status: string;
  item_count: number;
  total_quantity: number;
  total_weight: number;
}

export default function ReportsScreen() {
  const [aging, setAging] = useState<AgingItem[]>([]);
  const [inventory, setInventory] = useState<InventorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<'inventory' | 'aging'>('inventory');

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: agingData }, { data: invData }] = await Promise.all([
        supabase.from('v_aging_report').select('*').order('days_in_yard', { ascending: false }),
        supabase.from('v_inventory_summary').select('*').order('material_type'),
      ]);
      setAging((agingData ?? []) as AgingItem[]);
      setInventory((invData ?? []) as InventorySummary[]);
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

  const exportCSV = async () => {
    try {
      let csv = '';
      let fileName = '';

      if (activeReport === 'inventory') {
        csv = 'Material Type,Status,Item Count,Total Quantity,Total Weight\n';
        for (const row of inventory) {
          csv += `"${row.material_type}","${row.status}",${row.item_count},${row.total_quantity},${row.total_weight}\n`;
        }
        fileName = 'inventory_summary.csv';
      } else {
        csv = 'Material Type,Size,Grade,Quantity,Zone,Row,Rack,Days In Yard\n';
        for (const row of aging) {
          csv += `"${row.material_type}","${row.size ?? ''}","${row.grade ?? ''}",${row.current_quantity},"${row.zone ?? ''}","${row.row ?? ''}","${row.rack ?? ''}",${row.days_in_yard}\n`;
        }
        fileName = 'aging_report.csv';
      }

      const filePath = `${cacheDirectory}${fileName}`;
      await writeAsStringAsync(filePath, csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, { mimeType: 'text/csv' });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (e: any) {
      Alert.alert('Export Error', e.message);
    }
  };

  const agingColor = (days: number) => {
    if (days > 90) return '#DC2626';
    if (days > 30) return '#D97706';
    return '#16A34A';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={styles.tabRow}>
        <Button
          title="Inventory"
          variant={activeReport === 'inventory' ? 'primary' : 'secondary'}
          onPress={() => setActiveReport('inventory')}
          style={{ flex: 1 }}
        />
        <Button
          title="Aging"
          variant={activeReport === 'aging' ? 'primary' : 'secondary'}
          onPress={() => setActiveReport('aging')}
          style={{ flex: 1 }}
        />
      </View>

      <Button
        title="Export CSV"
        variant="secondary"
        onPress={exportCSV}
        style={styles.exportButton}
      />

      {activeReport === 'inventory' ? (
        <Card>
          {inventory.length === 0 ? (
            <Text style={styles.emptyText}>No inventory data</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.cellWide]}>Type</Text>
                <Text style={styles.tableCell}>Status</Text>
                <Text style={styles.tableCell}>Count</Text>
                <Text style={styles.tableCell}>Qty</Text>
              </View>
              {inventory.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.cellWide]}>{row.material_type}</Text>
                  <Text style={styles.tableCell}>{row.status.replace('_', ' ')}</Text>
                  <Text style={styles.tableCell}>{row.item_count}</Text>
                  <Text style={styles.tableCell}>{row.total_quantity}</Text>
                </View>
              ))}
            </>
          )}
        </Card>
      ) : (
        <Card>
          {aging.length === 0 ? (
            <Text style={styles.emptyText}>No aging items</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.cellWide]}>Material</Text>
                <Text style={styles.tableCell}>Qty</Text>
                <Text style={styles.tableCell}>Location</Text>
                <Text style={styles.tableCell}>Days</Text>
              </View>
              {aging.map((row) => (
                <View key={row.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.cellWide]}>{row.material_type}</Text>
                  <Text style={styles.tableCell}>{row.current_quantity}</Text>
                  <Text style={styles.tableCell}>
                    {row.zone ? `${row.zone}-${row.row}` : '—'}
                  </Text>
                  <Text style={[styles.tableCell, { color: agingColor(row.days_in_yard) }]}>
                    {Math.round(row.days_in_yard)}d
                  </Text>
                </View>
              ))}
            </>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  exportButton: { marginBottom: 12 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  cellWide: { flex: 2 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingVertical: 12 },
});
