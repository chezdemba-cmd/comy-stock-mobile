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
import { useProduct, useUpdateProduct } from '@/features/products/hooks';
import { productFormSchema, type ProductFormValues } from '@/features/products/schemas';
import { usePickProductPhoto } from '@/features/products/usePickPhoto';
import type { ProductWithStock } from '@/features/products/api';
import { useCompanyStore } from '@/stores/companyStore';
import { colors, spacing, typography } from '@/constants/theme';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product } = useProduct(id);

  if (!product) return null;

  // Clé sur l'id : le formulaire se (re)monte une fois le produit chargé, avec ses
  // valeurs initiales directement — pas besoin d'un effet pour synchroniser l'état.
  return <EditProductForm key={product.id} product={product} />;
}

function EditProductForm({ product }: { product: ProductWithStock }) {
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const { data: memberships } = useMyMemberships();
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const [categoryId, setCategoryId] = useState<string | null>(product.category_id);
  const [supplierId, setSupplierId] = useState<string | null>(product.supplier_id);
  const [existingPhotoUrl] = useState<string | null>(product.photo_url);
  const { localUri, pendingUpload, pick } = usePickProductPhoto();
  const { mutateAsync, isPending } = useUpdateProduct(product.id);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product.name,
      categoryId: product.category_id,
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      purchasePrice: String(product.purchase_price),
      salePrice: String(product.sale_price),
      stockMin: String(product.stock_min),
      unit: product.unit,
      description: product.description ?? '',
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    if (!activeCompanyId) return;
    setSubmitError(null);
    try {
      let photoUrl = existingPhotoUrl;
      if (pendingUpload && localUri) {
        photoUrl = await uploadProductPhoto(activeCompanyId, localUri);
      }

      await mutateAsync({
        categoryId,
        name: values.name,
        sku: values.sku ?? '',
        barcode: values.barcode ?? '',
        purchasePrice: Number(values.purchasePrice),
        salePrice: Number(values.salePrice),
        stockMin: Number(values.stockMin),
        unit: values.unit,
        supplierId,
        description: values.description ?? '',
        photoUrl,
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
            supplierId={supplierId}
            onSupplierChange={setSupplierId}
            photoUri={localUri ?? existingPhotoUrl}
            onPickPhoto={pick}
            showInitialStock={false}
            currency={currency}
          />

          {submitError ? <Text style={styles.formError}>{submitError}</Text> : null}

          <Button label="Enregistrer" onPress={handleSubmit(onSubmit)} loading={isPending} />
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
