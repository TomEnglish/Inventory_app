import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { QRScanner } from '@/components/scanning/QRScanner';
import { useReceivingStore } from '@/stores/receivingStore';
import { lookupMaterialByQR } from '@/lib/api/qrcodes';

export default function ScanScreen() {
  const { setQRCode, reset } = useReceivingStore();
  const [checking, setChecking] = useState(false);

  const handleScan = async (code: string) => {
    if (checking) return;
    setChecking(true);

    try {
      const result = await lookupMaterialByQR(code);

      if (result) {
        // QR is linked to an existing material — go to detail
        router.push({ pathname: '/(field)/material-detail' as any, params: { id: result.materialId } });
      } else {
        // New or unlinked QR — start receiving wizard
        reset();
        setQRCode(code, null);
        router.push('/(office)/receiving');
      }
    } catch {
      // Offline or error — fall back to receiving
      reset();
      setQRCode(code, null);
      router.push('/(office)/receiving');
    } finally {
      setChecking(false);
    }
  };

  return <QRScanner onScan={handleScan} />;
}
