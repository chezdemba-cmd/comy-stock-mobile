import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { ClientForm } from '@/components/ClientForm';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useCreateCustomerFull } from '@/features/customers/hooks';
import { customerFormSchema, type CustomerFormValues } from '@/features/customers/schemas';
import { colors, spacing, typography } from '@/constants/theme';

export default function CreateClientScreen() {
  const { mutateAsync, isPending } = useCreateCustomerFull();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { name: '', phone: '', whatsapp: '', email: '', address: '', notes: '' },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    setSubmitError(null);
    try {
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
          <Button label="Créer le client" onPress={handleSubmit(onSubmit)} loading={isPending} />
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
