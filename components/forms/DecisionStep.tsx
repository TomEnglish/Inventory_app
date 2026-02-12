import { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useReceivingStore } from '@/stores/receivingStore';
import type { ExceptionType } from '@/types/database';

type DecisionStatus = 'accepted' | 'partially_accepted' | 'rejected';

const STATUSES: { value: DecisionStatus; label: string; color: string }[] = [
  { value: 'accepted', label: 'Accept', color: '#16A34A' },
  { value: 'partially_accepted', label: 'Partial Accept', color: '#D97706' },
  { value: 'rejected', label: 'Reject', color: '#DC2626' },
];

const EXCEPTION_TYPES: { value: ExceptionType; label: string }[] = [
  { value: 'wrong_type', label: 'Wrong Type' },
  { value: 'wrong_count', label: 'Wrong Count' },
  { value: 'damage', label: 'Damage' },
];

interface Props {
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}

export function DecisionStep({ onSubmit, onBack, submitting }: Props) {
  const { decision, setDecision, inspection } = useReceivingStore();

  const [status, setStatus] = useState<DecisionStatus>(decision.status);
  const [hasException, setHasException] = useState(decision.has_exception);
  const [exceptionType, setExceptionType] = useState<ExceptionType | undefined>(
    decision.exception_type ?? undefined
  );

  // Auto-flag exception if condition is damaged or inspection failed
  const autoException = inspection.condition === 'damaged' || !inspection.inspection_pass;

  const handleSubmit = () => {
    const flagException = hasException || autoException;
    setDecision({
      status,
      has_exception: flagException,
      exception_type: flagException ? exceptionType : undefined,
    });
    onSubmit();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Decision</Text>

      <Text style={styles.label}>Status</Text>
      <View style={styles.row}>
        {STATUSES.map((s) => (
          <Button
            key={s.value}
            title={s.label}
            variant={status === s.value ? 'primary' : 'secondary'}
            onPress={() => setStatus(s.value)}
            style={styles.statusButton}
          />
        ))}
      </View>

      {autoException && (
        <View style={styles.autoAlert}>
          <Text style={styles.autoAlertText}>
            Exception auto-flagged due to{' '}
            {inspection.condition === 'damaged' ? 'damage' : 'failed inspection'}
          </Text>
        </View>
      )}

      {!autoException && (
        <>
          <Text style={styles.label}>Flag Exception?</Text>
          <View style={styles.row}>
            <Button
              title="No"
              variant={!hasException ? 'primary' : 'secondary'}
              onPress={() => setHasException(false)}
              style={styles.statusButton}
            />
            <Button
              title="Yes"
              variant={hasException ? 'danger' : 'secondary'}
              onPress={() => setHasException(true)}
              style={styles.statusButton}
            />
          </View>
        </>
      )}

      {(hasException || autoException) && (
        <>
          <Text style={styles.label}>Exception Type</Text>
          <View style={styles.row}>
            {EXCEPTION_TYPES.map((t) => (
              <Button
                key={t.value}
                title={t.label}
                variant={exceptionType === t.value ? 'primary' : 'secondary'}
                onPress={() => setExceptionType(t.value)}
                style={styles.statusButton}
              />
            ))}
          </View>
        </>
      )}

      <Button
        title={submitting ? 'Submitting...' : 'Submit'}
        onPress={handleSubmit}
        loading={submitting}
        style={{ marginTop: 16 }}
      />
      <Button title="Back" variant="secondary" onPress={onBack} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusButton: { flex: 1, paddingVertical: 10 },
  autoAlert: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  autoAlertText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '500',
  },
});
