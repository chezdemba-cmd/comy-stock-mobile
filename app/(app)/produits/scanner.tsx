import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useProducts } from '@/features/products/hooks';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { data: products = [] } = useProducts();
  const [manualBarcode, setManualBarcode] = useState('');
  const [locked, setLocked] = useState(false);

  const goToProductOrCreate = (barcode: string) => {
    const match = products.find((product) => product.barcode === barcode);
    if (match) {
      router.replace(`/(app)/produits/${match.id}`);
    } else {
      router.replace({ pathname: '/(app)/produits/create', params: { barcode } });
    }
  };

  const onScanned = (result: BarcodeScanningResult) => {
    if (locked) return;
    setLocked(true);
    goToProductOrCreate(result.data);
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
        <Button label="Autoriser la caméra" onPress={requestPermission} style={styles.permissionButton} />
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

      <Text style={styles.hint}>Visez un code-barres, ou saisissez-le manuellement.</Text>

      <View style={styles.manualRow}>
        <View style={styles.manualInput}>
          <TextField
            label="Saisie manuelle"
            placeholder="Ex. 6120000000001"
            keyboardType="number-pad"
            value={manualBarcode}
            onChangeText={setManualBarcode}
          />
        </View>
      </View>
      <Button
        label="Valider"
        onPress={() => manualBarcode && goToProductOrCreate(manualBarcode)}
        disabled={!manualBarcode}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cameraWrapper: {
    height: 320,
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
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  manualRow: {
    marginBottom: spacing.sm,
  },
  manualInput: {
    flex: 1,
  },
  permissionText: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    alignSelf: 'center',
  },
});
