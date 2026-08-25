import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { ClientForm } from '@/components/ClientForm';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useCustomer, useUpdateCustomer } from '@/features/customers/hooks';
import { customerFormSchema, type CustomerFormValues } from '@/features/customers/schemas';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, spacing, typography } from '@/constants/theme';
import type { Customer } from '@/types/database';

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: customer } = useCustomer(id);

  if (!customer) return null;

  return <EditClientForm key={customer.id} customer={customer} />;
}

function EditClientForm({ customer }: { customer: Customer }) {
  const { mutateAsync, isPending } = useUpdateCustomer(customer.id);
  const { isOnline } = useNetworkStatus();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone ?? '',
      whatsapp: customer.whatsapp ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
      notes: customer.notes ?? '',
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    setSubmitError(null);
    try {
      if (!isOnline) throw new Error('Connexion requise pour cette action.');
      await mutateAsync({
        name: values.name,
        phone: values.phone ?? '',
        whatsapp: values.whatsapp ?? '',
        email: values.email ?? '',
        address: values.address ?? '',
        notes: values.notes ?? '',
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
          <ClientForm control={control} errors={errors} />
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
