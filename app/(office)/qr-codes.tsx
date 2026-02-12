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
import * as Print from 'expo-print';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  fetchQRCodes,
  batchCreateQRCodes,
  fetchQRCodeDetail,
  type QRCodeRecord,
} from '@/lib/api/qrcodes';

export default function QRCodesScreen() {
  const [qrCodes, setQRCodes] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [batchCount, setBatchCount] = useState('10');
  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Detail modal
  const [detailQR, setDetailQR] = useState<QRCodeRecord | null>(null);
  const [detailMaterial, setDetailMaterial] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchQRCodes();
      setQRCodes(data);
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

  const handleGenerate = async () => {
    const count = parseInt(batchCount, 10);
    if (!count || count < 1 || count > 100) {
      Alert.alert('Error', 'Enter a number between 1 and 100');
      return;
    }
    setGenerating(true);
    try {
      await batchCreateQRCodes(count);
      setShowGenerate(false);
      load();
      Alert.alert('Success', `${count} QR codes created`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setGenerating(false);
  };

  const handlePrintLabels = async (codes: QRCodeRecord[]) => {
    setPrinting(true);
    try {
      // Generate QR code data URLs
      const qrImages = await Promise.all(
        codes.map(async (code) => {
          const dataUrl = await QRCode.toDataURL(code.code_value, {
            width: 200,
            margin: 1,
          });
          return { code: code.code_value, dataUrl };
        })
      );

      // Build printable HTML
      const labelsHtml = qrImages
        .map(
          (item) => `
        <div class="label">
          <img src="${item.dataUrl}" />
          <p>${item.code}</p>
        </div>
      `
        )
        .join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: sans-serif; margin: 0; padding: 10px; }
              .grid { display: flex; flex-wrap: wrap; gap: 10px; }
              .label {
                width: 180px;
                text-align: center;
                border: 1px solid #ccc;
                padding: 10px;
                page-break-inside: avoid;
              }
              .label img { width: 150px; height: 150px; }
              .label p { font-size: 10px; margin: 4px 0 0; word-break: break-all; }
            </style>
          </head>
          <body>
            <div class="grid">${labelsHtml}</div>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setPrinting(false);
  };

  const openDetail = async (qr: QRCodeRecord) => {
    try {
      const { qr: detail, material } = await fetchQRCodeDetail(qr.id);
      setDetailQR(detail);
      setDetailMaterial(material);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const unlinked = qrCodes.filter((q) => !q.entity_id);

  const renderItem = ({ item }: { item: QRCodeRecord }) => (
    <Card
      style={{ ...styles.card, ...(!item.entity_id ? styles.cardUnlinked : {}) }}
      onPress={() => openDetail(item)}
    >
      <View style={styles.cardRow}>
        <FontAwesome
          name="qrcode"
          size={20}
          color={item.entity_id ? '#16A34A' : '#94A3B8'}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.codeText}>{item.code_value}</Text>
          <Text style={styles.statusLabel}>
            {item.entity_id ? 'Linked' : 'Available'}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {qrCodes.length} total / {unlinked.length} available
        </Text>
        <View style={styles.headerActions}>
          <Button
            title="Print"
            variant="secondary"
            onPress={() => handlePrintLabels(unlinked.length > 0 ? unlinked : qrCodes)}
            loading={printing}
            style={styles.headerBtn}
          />
          <Button
            title="+ Generate"
            onPress={() => setShowGenerate(true)}
            style={styles.headerBtn}
          />
        </View>
      </View>

      <FlatList
        data={qrCodes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="qrcode" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No QR codes generated yet</Text>
          </View>
        }
      />

      {/* Generate Modal */}
      <Modal visible={showGenerate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generate QR Codes</Text>
            <Input
              label="How many?"
              value={batchCount}
              onChangeText={setBatchCount}
              keyboardType="numeric"
              placeholder="1-100"
            />
            <Button title="Generate" onPress={handleGenerate} loading={generating} />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setShowGenerate(false)}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={!!detailQR} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>QR Code Detail</Text>
            {detailQR && (
              <>
                <DetailRow label="Code" value={detailQR.code_value} />
                <DetailRow label="Status" value={detailQR.entity_id ? 'Linked' : 'Available'} />
                <DetailRow label="Created" value={new Date(detailQR.created_at).toLocaleDateString()} />
                {detailMaterial && (
                  <>
                    <Text style={styles.sectionLabel}>Linked Material</Text>
                    <DetailRow label="Type" value={detailMaterial.material_type} />
                    <DetailRow label="Status" value={detailMaterial.status} />
                    <DetailRow label="Qty" value={`${detailMaterial.current_quantity} / ${detailMaterial.qty}`} />
                  </>
                )}
                <Button
                  title="Print This Label"
                  variant="secondary"
                  onPress={() => {
                    handlePrintLabels([detailQR]);
                  }}
                  style={{ marginTop: 12 }}
                />
              </>
            )}
            <Button
              title="Close"
              variant="secondary"
              onPress={() => {
                setDetailQR(null);
                setDetailMaterial(null);
              }}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  headerTitle: { fontSize: 13, color: '#64748B' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  list: { padding: 12, paddingBottom: 40 },
  card: {
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cardUnlinked: { borderColor: '#CBD5E1', borderStyle: 'dashed' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1 },
  codeText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  statusLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: { fontSize: 13, color: '#64748B' },
  detailValue: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
});
