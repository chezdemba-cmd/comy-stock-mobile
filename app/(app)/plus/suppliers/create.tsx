import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SupplierForm } from '@/components/SupplierForm';
import { useCreateSupplier } from '@/features/suppliers/hooks';
import { supplierFormSchema, type SupplierFormValues } from '@/features/suppliers/schemas';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, spacing, typography } from '@/constants/theme';

export default function CreateSupplierScreen() {
  const { mutateAsync, isPending } = useCreateSupplier();
  const { isOnline } = useNetworkStatus();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: { name: '', phone: '', whatsapp: '', email: '', address: '' },
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
          <Button label="Créer le fournisseur" onPress={handleSubmit(onSubmit)} loading={isPending} />
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
