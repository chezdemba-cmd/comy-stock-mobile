import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SelectPills } from '@/components/SelectPills';
import { TextField } from '@/components/TextField';
import { useCreateCompany } from '@/features/company/hooks';
import {
  businessTypeOptions,
  currencyOptions,
  createCompanySchema,
  type CreateCompanyFormValues,
} from '@/features/company/schemas';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, spacing, typography } from '@/constants/theme';

export default function CreateCompanyScreen() {
  const { mutateAsync, isPending } = useCreateCompany();
  const { isOnline } = useNetworkStatus();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: { name: '', country: '', city: '', currency: '', businessType: '' },
  });

  const onSubmit = async (values: CreateCompanyFormValues) => {
    setSubmitError(null);
    try {
      if (!isOnline) throw new Error('Connexion requise pour cette action.');
      const company = await mutateAsync(values);
      router.replace({ pathname: '/(onboarding)/create-shop', params: { companyId: company.id } });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenContainer>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Votre entreprise</Text>
            <Text style={styles.subtitle}>Parlez-nous de votre commerce pour commencer.</Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Nom du commerce"
                placeholder="Ex. Djeli Shop"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="country"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Pays"
                placeholder="Ex. Côte d'Ivoire"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.country?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Ville"
                placeholder="Ex. Abidjan"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.city?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="currency"
            render={({ field: { onChange, value } }) => (
              <SelectPills
                label="Devise"
                options={currencyOptions}
                value={value || null}
                onChange={onChange}
                error={errors.currency?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="businessType"
            render={({ field: { onChange, value } }) => (
              <SelectPills
                label="Type d'activité"
                options={businessTypeOptions}
                value={value || null}
                onChange={onChange}
                error={errors.businessType?.message}
              />
            )}
          />

          {submitError ? <Text style={styles.formError}>{submitError}</Text> : null}

          <Button label="Continuer" onPress={handleSubmit(onSubmit)} loading={isPending} style={styles.submit} />
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: typography.body.fontSize,
  },
  formError: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  submit: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
});
