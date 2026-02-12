import { router } from 'expo-router';
import { QRScanner } from '@/components/scanning/QRScanner';
import { useReceivingStore } from '@/stores/receivingStore';

export default function ScanScreen() {
  const { setQRCode, reset } = useReceivingStore();

  const handleScan = (code: string) => {
    reset();
    setQRCode(code, null);
    router.push('/(office)/receiving');
  };

  return <QRScanner onScan={handleScan} />;
}
