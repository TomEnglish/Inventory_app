import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useReceivingStore } from '@/stores/receivingStore';
import { materialStepSchema } from '@/lib/utils/validation';
import { MATERIAL_TYPES } from '@/constants/materialTypes';

interface Props {
  onNext: () => void;
}

export function MaterialStep({ onNext }: Props) {
  const { material, setMaterial } = useReceivingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [materialType, setMaterialType] = useState(material.material_type);
  const [qty, setQty] = useState(String(material.qty));
  const [size, setSize] = useState(material.size ?? '');
  const [grade, setGrade] = useState(material.grade ?? '');
  const [weight, setWeight] = useState(material.weight ? String(material.weight) : '');
  const [description, setDescription] = useState(material.description ?? '');
  const [spec, setSpec] = useState(material.spec ?? '');

  const handleNext = () => {
    const data = {
      material_type: materialType,
      qty: parseInt(qty, 10) || 0,
      size: size || undefined,
      grade: grade || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      description: description || undefined,
      spec: spec || undefined,
    };

    const result = materialStepSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        if (e.path[0] != null) fieldErrors[String(e.path[0])] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setMaterial(result.data);
    onNext();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Material Details</Text>

      <Text style={styles.label}>Material Type</Text>
      <View style={styles.typeGrid}>
        {MATERIAL_TYPES.map((type) => (
          <Button
            key={type}
            title={type}
            variant={materialType === type ? 'primary' : 'secondary'}
            onPress={() => {
              setMaterialType(type);
              setErrors((e) => ({ ...e, material_type: '' }));
            }}
            style={styles.typeButton}
          />
        ))}
      </View>
      {errors.material_type ? (
        <Text style={styles.error}>{errors.material_type}</Text>
      ) : null}

      <Input
        label="Quantity"
        value={qty}
        onChangeText={setQty}
        keyboardType="numeric"
        error={errors.qty}
      />
      <Input label="Size" value={size} onChangeText={setSize} placeholder="e.g. 4&quot;" />
      <Input label="Grade" value={grade} onChangeText={setGrade} placeholder="e.g. A106 Gr B" />
      <Input
        label="Weight"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholder="lbs"
      />
      <Input label="Description" value={description} onChangeText={setDescription} />
      <Input label="Spec" value={spec} onChangeText={setSpec} />

      <Button title="Next" onPress={handleNext} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeButton: { paddingVertical: 8, paddingHorizontal: 12 },
  error: { color: '#DC2626', fontSize: 12, marginBottom: 8 },
});
