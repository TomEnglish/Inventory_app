import { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface QRScannerProps {
  onScan: (code: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState('');

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera access is needed to scan QR codes</Text>
        <Button title="Grant Permission" onPress={requestPermission} style={{ marginTop: 16 }} />
        <Button
          title="Enter Code Manually"
          variant="secondary"
          onPress={() => setShowManual(true)}
          style={{ marginTop: 12 }}
        />
        <ManualEntryModal
          visible={showManual}
          code={manualCode}
          onChangeCode={setManualCode}
          onSubmit={() => {
            if (manualCode.trim()) {
              onScan(manualCode.trim());
              setManualCode('');
              setShowManual(false);
            }
          }}
          onClose={() => setShowManual(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={
          scanned
            ? undefined
            : ({ data }) => {
                setScanned(true);
                onScan(data);
              }
        }
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
      </CameraView>

      <View style={styles.controls}>
        {scanned && (
          <Button title="Scan Again" onPress={() => setScanned(false)} style={{ marginBottom: 8 }} />
        )}
        <Button
          title="Enter Code Manually"
          variant="secondary"
          onPress={() => setShowManual(true)}
        />
      </View>

      <ManualEntryModal
        visible={showManual}
        code={manualCode}
        onChangeCode={setManualCode}
        onSubmit={() => {
          if (manualCode.trim()) {
            onScan(manualCode.trim());
            setManualCode('');
            setShowManual(false);
          }
        }}
        onClose={() => setShowManual(false)}
      />
    </View>
  );
}

function ManualEntryModal({
  visible,
  code,
  onChangeCode,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  code: string;
  onChangeCode: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter QR Code</Text>
          <Input
            label="Code Value"
            value={code}
            onChangeText={onChangeCode}
            placeholder="Type or paste QR code value"
            autoFocus
          />
          <Button title="Submit" onPress={onSubmit} />
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onClose}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  controls: {
    padding: 16,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
});
