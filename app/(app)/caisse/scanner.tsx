import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useProducts } from '@/features/products/hooks';
import { useCartStore } from '@/stores/cartStore';

export default function CaisseScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { data: products = [] } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const [locked, setLocked] = useState(false);

  const onScanned = (result: BarcodeScanningResult) => {
    if (locked) return;
    setLocked(true);

    const match = products.find((product) => product.barcode === result.data);
    if (!match) {
      Alert.alert('Produit introuvable', 'Aucun produit ne correspond à ce code-barres.', [
        { text: 'OK', onPress: () => setLocked(false) },
      ]);
      return;
    }

    addItem({
      productId: match.id,
      name: match.name,
      unitPrice: match.sale_price,
      unitCost: match.purchase_price,
      availableQuantity: match.quantity,
    });
    router.back();
  };

  if (!permission) {
    return <ScreenContainer centered />;
  }

  if (!permission.granted) {
    return (
      <ScreenContainer centered>
        <Text style={styles.permissionText}>
          L&apos;accès à la caméra est nécessaire pour scanner un code-barres.
        </Text>
        <Button label="Autoriser la caméra" onPress={requestPermission} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <View style={styles.cameraWrapper}>
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'upc_a'] }}
          onBarcodeScanned={onScanned}
        />
      </View>
      <Text style={styles.hint}>Visez le code-barres du produit à ajouter au panier.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cameraWrapper: {
    height: 380,
    borderRadius: radii.card,
    overflow: 'hidden',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  hint: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
    textAlign: 'center',
  },
  permissionText: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
