import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { ProductFormFields } from '@/components/ProductFormFields';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useMyMemberships } from '@/features/company/hooks';
import { uploadProductPhoto } from '@/features/products/api';
import { useCreateProduct } from '@/features/products/hooks';
import { productFormSchema, type ProductFormValues } from '@/features/products/schemas';
import { usePickProductPhoto } from '@/features/products/usePickPhoto';
import { useCompanyStore } from '@/stores/companyStore';
import { colors, spacing, typography } from '@/constants/theme';

export default function CreateProductScreen() {
  const { barcode: scannedBarcode } = useLocalSearchParams<{ barcode?: string }>();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const activeShopId = useCompanyStore((state) => state.activeShopId);
  const { data: memberships } = useMyMemberships();
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { localUri, pendingUpload, pick } = usePickProductPhoto();
  const { mutateAsync, isPending } = useCreateProduct();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      categoryId: null,
      sku: '',
      barcode: scannedBarcode ?? '',
      purchasePrice: '',
      salePrice: '',
      initialStock: '',
      stockMin: '0',
      unit: 'unité',
      supplierName: '',
      description: '',
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    if (!activeCompanyId || !activeShopId) return;
    setSubmitError(null);
    try {
      let photoUrl: string | null = null;
      if (pendingUpload && localUri) {
        photoUrl = await uploadProductPhoto(activeCompanyId, localUri);
      }

      await mutateAsync({
        input: {
          companyId: activeCompanyId,
          shopId: activeShopId,
          categoryId,
          name: values.name,
          sku: values.sku ?? '',
          barcode: values.barcode ?? '',
          purchasePrice: Number(values.purchasePrice),
          salePrice: Number(values.salePrice),
          stockMin: Number(values.stockMin),
          unit: values.unit,
          supplierName: values.supplierName ?? '',
          description: values.description ?? '',
          photoUrl,
        },
        initialStock: Number(values.initialStock) || 0,
      });

      router.back();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenContainer edges={['bottom']}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <ProductFormFields
            control={control}
            errors={errors}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            photoUri={localUri}
            onPickPhoto={pick}
            showInitialStock
            currency={currency}
          />

          {submitError ? <Text style={styles.formError}>{submitError}</Text> : null}

          <Button label="Créer le produit" onPress={handleSubmit(onSubmit)} loading={isPending} />
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  formError: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 14,
    marginBottom: spacing.md,
  },
});
