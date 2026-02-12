import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { useReceivingStore } from '@/stores/receivingStore';
import { useAuthStore } from '@/stores/authStore';
import { lookupOrCreateQRCode, submitReceivingRecord } from '@/lib/api/receiving';
import { useNetworkStore } from '@/lib/sync/networkStore';
import { addToQueue } from '@/lib/sync/offlineQueue';
import { MaterialStep } from '@/components/forms/MaterialStep';
import { POStep } from '@/components/forms/POStep';
import { InspectionStep } from '@/components/forms/InspectionStep';
import { PhotoStep } from '@/components/forms/PhotoStep';
import { LocationStep } from '@/components/forms/LocationStep';
import { DecisionStep } from '@/components/forms/DecisionStep';

const STEP_TITLES = [
  'Material Details',
  'PO / Delivery',
  'Inspection',
  'Photos',
  'Location',
  'Decision',
];

export default function ReceivingScreen() {
  const store = useReceivingStore();
  const user = useAuthStore((s) => s.user);
  const isOnline = useNetworkStore((s) => s.isOnline);
  const [submitting, setSubmitting] = useState(false);

  const goTo = (step: number) => store.setStep(step);

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      if (!isOnline) {
        await addToQueue({
          type: 'receiving',
          payload: {
            qrCodeValue: store.qrCodeValue,
            material: store.material,
            po: store.po,
            inspection: store.inspection,
            photos: [],
            location: store.location,
            decision: store.decision,
            userId: user.id,
          },
        });
        store.reset();
        Alert.alert('Queued', 'Record saved offline and will sync when reconnected. Photos must be added later.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const qr = await lookupOrCreateQRCode(store.qrCodeValue);

        await submitReceivingRecord({
          qrCodeId: qr.id,
          material: store.material,
          po: store.po,
          inspection: store.inspection,
          photos: store.photos,
          location: store.location,
          decision: store.decision,
          userId: user.id,
        });

        store.reset();
        Alert.alert('Success', 'Receiving record submitted', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: STEP_TITLES[store.step] ?? 'Receiving',
          headerBackTitle: 'Cancel',
        }}
      />

      <View style={styles.stepBar}>
        {STEP_TITLES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.stepDot,
              i <= store.step && styles.stepDotActive,
            ]}
          />
        ))}
      </View>

      <Text style={styles.qrLabel}>QR: {store.qrCodeValue}</Text>

      {store.step === 0 && <MaterialStep onNext={() => goTo(1)} />}
      {store.step === 1 && <POStep onNext={() => goTo(2)} onBack={() => goTo(0)} />}
      {store.step === 2 && <InspectionStep onNext={() => goTo(3)} onBack={() => goTo(1)} />}
      {store.step === 3 && <PhotoStep onNext={() => goTo(4)} onBack={() => goTo(2)} />}
      {store.step === 4 && <LocationStep onNext={() => goTo(5)} onBack={() => goTo(3)} />}
      {store.step === 5 && (
        <DecisionStep onSubmit={handleSubmit} onBack={() => goTo(4)} submitting={submitting} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: '#2563EB',
  },
  qrLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
});
