import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Resize to max 1200px wide and compress to JPEG 0.7 quality (~300-500KB)
export async function compressPhoto(uri: string): Promise<string> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  return result.uri;
}
