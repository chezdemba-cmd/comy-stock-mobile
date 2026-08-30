import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useAcceptInvite } from '@/features/team/hooks';
import { joinCompanySchema, type JoinCompanyFormValues } from '@/features/team/schemas';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCompanyStore } from '@/stores/companyStore';
import { colors, spacing, typography } from '@/constants/theme';

export default function JoinCompanyScreen() {
  const acceptInvite = useAcceptInvite();
  const { isOnline } = useNetworkStatus();
  const setActiveCompany = useCompanyStore((state) => state.setActiveCompany);
  const setActiveShop = useCompanyStore((state) => state.setActiveShop);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinCompanyFormValues>({
    resolver: zodResolver(joinCompanySchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async (values: JoinCompanyFormValues) => {
    setSubmitError(null);
    try {
      if (!isOnline) throw new Error('Connexion requise pour cette action.');
      const result = await acceptInvite.mutateAsync(values.code);
      setActiveCompany(result.companyId);
      setActiveShop(result.shopId);
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
            <Text style={styles.title}>Rejoindre une entreprise</Text>
            <Text style={styles.subtitle}>
              Entrez le code d&apos;invitation reçu de votre employeur pour rejoindre son entreprise
              sur Comy_stock.
            </Text>
          </View>

          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Code d'invitation"
                placeholder="Ex. A1B2C3D4"
                autoCapitalize="characters"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.code?.message}
              />
            )}
          />

          {submitError ? <Text style={styles.formError}>{submitError}</Text> : null}

          <Button
            label="Rejoindre"
            onPress={handleSubmit(onSubmit)}
            loading={acceptInvite.isPending}
            style={styles.submit}
          />

          <Button label="Retour" variant="ghost" onPress={() => router.back()} />
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
    marginBottom: spacing.sm,
  },
});
