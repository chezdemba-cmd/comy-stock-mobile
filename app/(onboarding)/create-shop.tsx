import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useCreateShop } from '@/features/company/hooks';
import { createShopSchema, type CreateShopFormValues } from '@/features/company/schemas';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCompanyStore } from '@/stores/companyStore';
import { colors, spacing, typography } from '@/constants/theme';

export default function CreateShopScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const { mutateAsync, isPending } = useCreateShop();
  const { isOnline } = useNetworkStatus();
  const setActiveCompany = useCompanyStore((state) => state.setActiveCompany);
  const setActiveShop = useCompanyStore((state) => state.setActiveShop);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateShopFormValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { name: '', location: '', phone: '', address: '' },
  });

  const onSubmit = async (values: CreateShopFormValues) => {
    if (!companyId) {
      setSubmitError('Entreprise introuvable, veuillez recommencer.');
      return;
    }
    setSubmitError(null);
    try {
      if (!isOnline) throw new Error('Connexion requise pour cette action.');
      const shop = await mutateAsync({ companyId, ...values });
      setActiveCompany(companyId);
      setActiveShop(shop.id);
      router.replace('/(app)');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenContainer>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Votre première boutique</Text>
            <Text style={styles.subtitle}>Ce sera le point de vente que vous gérerez au quotidien.</Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Nom de la boutique"
                placeholder="Ex. Djeli Shop Cocody"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Localisation"
                placeholder="Ex. Cocody, Angré"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.location?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Téléphone"
                placeholder="Ex. 07 00 00 00 00"
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.phone?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Adresse (facultatif)"
                placeholder="Ex. Rue des Jardins, Résidence X"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.address?.message}
              />
            )}
          />

          {submitError ? <Text style={styles.formError}>{submitError}</Text> : null}

          <Button
            label="Terminer"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            style={styles.submit}
          />
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
