import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SupplierForm } from '@/components/SupplierForm';
import { useSupplier, useUpdateSupplier } from '@/features/suppliers/hooks';
import { supplierFormSchema, type SupplierFormValues } from '@/features/suppliers/schemas';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, spacing, typography } from '@/constants/theme';
import type { Supplier } from '@/types/database';

export default function EditSupplierScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: supplier } = useSupplier(id);

  if (!supplier) return null;

  return <EditSupplierForm key={supplier.id} supplier={supplier} />;
}

function EditSupplierForm({ supplier }: { supplier: Supplier }) {
  const { mutateAsync, isPending } = useUpdateSupplier(supplier.id);
  const { isOnline } = useNetworkStatus();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier.name,
      phone: supplier.phone ?? '',
      whatsapp: supplier.whatsapp ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
    },
  });

  const onSubmit = async (values: SupplierFormValues) => {
    setSubmitError(null);
    try {
      if (!isOnline) throw new Error('Connexion requise pour cette action.');
      await mutateAsync({
        name: values.name,
        phone: values.phone ?? '',
        whatsapp: values.whatsapp ?? '',
        email: values.email ?? '',
        address: values.address ?? '',
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
          <SupplierForm control={control} errors={errors} />
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
