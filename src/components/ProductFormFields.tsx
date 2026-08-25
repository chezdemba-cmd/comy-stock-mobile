import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { CategoryPicker } from '@/components/CategoryPicker';
import { SelectPills } from '@/components/SelectPills';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { unitOptions, type ProductFormValues } from '@/features/products/schemas';

interface ProductFormFieldsProps {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  categoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  photoUri: string | null;
  onPickPhoto: () => void;
  showInitialStock: boolean;
  currency: string;
}

export function ProductFormFields({
  control,
  errors,
  categoryId,
  onCategoryChange,
  photoUri,
  onPickPhoto,
  showInitialStock,
  currency,
}: ProductFormFieldsProps) {
  const purchasePrice = Number(useWatch({ control, name: 'purchasePrice' })) || 0;
  const salePrice = Number(useWatch({ control, name: 'salePrice' })) || 0;
  const marginUnit = salePrice - purchasePrice;
  const marginRate = salePrice > 0 ? Math.round((marginUnit / salePrice) * 100) : 0;

  return (
    <View>
      <Pressable style={styles.photoPicker} onPress={onPickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.photoLabel}>Ajouter une photo</Text>
          </View>
        )}
      </Pressable>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nom du produit"
            placeholder="Ex. Riz 25kg"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.name?.message}
          />
        )}
      />

      <CategoryPicker value={categoryId} onChange={onCategoryChange} />

      <View style={styles.rowFields}>
        <View style={styles.half}>
          <Controller
            control={control}
            name="sku"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Référence (SKU)"
                placeholder="Ex. RIZ-25"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>
        <View style={styles.half}>
          <Controller
            control={control}
            name="barcode"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Code-barres"
                placeholder="Ex. 6120000000001"
                keyboardType="number-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>
      </View>

      <View style={styles.rowFields}>
        <View style={styles.half}>
          <Controller
            control={control}
            name="purchasePrice"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Prix d'achat"
                placeholder="0"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={String(value ?? '')}
                error={errors.purchasePrice?.message}
              />
            )}
          />
        </View>
        <View style={styles.half}>
          <Controller
            control={control}
            name="salePrice"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Prix de vente"
                placeholder="0"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={String(value ?? '')}
                error={errors.salePrice?.message}
              />
            )}
          />
        </View>
      </View>

      {salePrice > 0 || purchasePrice > 0 ? (
        <View style={styles.marginBox}>
          <Text style={styles.marginText}>
            Marge unitaire : {marginUnit.toLocaleString('fr-FR')} {currency} · Taux : {marginRate}%
          </Text>
        </View>
      ) : null}

      <View style={styles.rowFields}>
        {showInitialStock ? (
          <View style={styles.half}>
            <Controller
              control={control}
              name="initialStock"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Stock initial"
                  placeholder="0"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={String(value ?? '')}
                />
              )}
            />
          </View>
        ) : null}
        <View style={showInitialStock ? styles.half : undefined}>
          <Controller
            control={control}
            name="stockMin"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Stock minimum"
                placeholder="0"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={String(value ?? '')}
                error={errors.stockMin?.message}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="unit"
        render={({ field: { onChange, value } }) => (
          <SelectPills label="Unité" options={unitOptions} value={value || null} onChange={onChange} />
        )}
      />

      <Controller
        control={control}
        name="supplierName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Fournisseur (facultatif)"
            placeholder="Ex. Grossiste Koné"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Description (facultatif)"
            placeholder="Notes sur le produit"
            multiline
            numberOfLines={3}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  photoPicker: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: radii.card,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 11,
    textAlign: 'center',
  },
  rowFields: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  marginBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  marginText: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
  },
});
