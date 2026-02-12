import { useState } from 'react';
import { View, ScrollView, Text, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { useReceivingStore, type PhotoEntry } from '@/stores/receivingStore';
import type { PhotoType } from '@/types/database';

const PHOTO_TYPES: { value: PhotoType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'damage', label: 'Damage' },
  { value: 'delivery_ticket', label: 'Delivery Ticket' },
];

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function PhotoStep({ onNext, onBack }: Props) {
  const { photos, addPhoto, removePhoto } = useReceivingStore();
  const [selectedType, setSelectedType] = useState<PhotoType>('general');

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      addPhoto({ uri: result.assets[0].uri, photo_type: selectedType });
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      addPhoto({ uri: result.assets[0].uri, photo_type: selectedType });
    }
  };

  const handleRemove = (index: number) => {
    Alert.alert('Remove Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePhoto(index) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Photos</Text>

      <Text style={styles.label}>Photo Type</Text>
      <View style={styles.row}>
        {PHOTO_TYPES.map((t) => (
          <Button
            key={t.value}
            title={t.label}
            variant={selectedType === t.value ? 'primary' : 'secondary'}
            onPress={() => setSelectedType(t.value)}
            style={styles.typeButton}
          />
        ))}
      </View>

      <View style={styles.row}>
        <Button title="Take Photo" onPress={takePhoto} style={{ flex: 1 }} />
        <Button title="From Library" variant="secondary" onPress={pickPhoto} style={{ flex: 1 }} />
      </View>

      {photos.length > 0 && (
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoCard}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <Text style={styles.photoType}>{photo.photo_type}</Text>
              <Button
                title="Remove"
                variant="danger"
                onPress={() => handleRemove(index)}
                style={styles.removeButton}
              />
            </View>
          ))}
        </View>
      )}

      <Text style={styles.hint}>
        {photos.length === 0
          ? 'No photos added yet (optional)'
          : `${photos.length} photo(s) attached`}
      </Text>

      <Button title="Next" onPress={onNext} style={{ marginTop: 16 }} />
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
  typeButton: { flex: 1, paddingVertical: 8 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  photoCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photo: { width: '100%', height: 120 },
  photoType: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 4,
  },
  removeButton: { paddingVertical: 6, borderRadius: 0 },
  hint: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});
