import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export function usePickProductPhoto(initialUri: string | null = null) {
  const [localUri, setLocalUri] = useState<string | null>(initialUri);
  const [pendingUpload, setPendingUpload] = useState(false);

  async function pick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      setLocalUri(result.assets[0].uri);
      setPendingUpload(true);
    }
  }

  function reset() {
    setLocalUri(null);
    setPendingUpload(false);
  }

  return { localUri, pendingUpload, pick, reset };
}
