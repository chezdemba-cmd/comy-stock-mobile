import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export function usePickImage(initialUri: string | null = null) {
  const [localUri, setLocalUri] = useState<string | null>(initialUri);
  const [pendingUpload, setPendingUpload] = useState(false);

  function saveSelectedImage(result: ImagePicker.ImagePickerResult) {
    if (!result.canceled && result.assets[0]) {
      setLocalUri(result.assets[0].uri);
      setPendingUpload(true);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Accès à la caméra requis',
        "Autorisez Comy à utiliser la caméra dans les réglages du téléphone pour prendre une photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    saveSelectedImage(result);
  }

  async function chooseFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Accès aux photos requis',
        "Autorisez Comy à accéder aux photos dans les réglages du téléphone pour choisir une image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    saveSelectedImage(result);
  }

  function pick() {
    Alert.alert('Photo du produit', 'Choisissez la source de la photo.', [
      { text: 'Prendre une photo', onPress: () => void takePhoto() },
      { text: 'Choisir dans la galerie', onPress: () => void chooseFromLibrary() },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  function reset() {
    setLocalUri(null);
    setPendingUpload(false);
  }

  return { localUri, pendingUpload, pick, takePhoto, chooseFromLibrary, reset };
}
