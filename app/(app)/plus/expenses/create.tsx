import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SelectPills } from '@/components/SelectPills';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useCreateExpense } from '@/features/expenses/hooks';
import { uploadExpenseReceipt } from '@/features/expenses/api';
import { expenseCategoryOptions, expenseFormSchema, type ExpenseFormValues } from '@/features/expenses/schemas';
import { usePickImage } from '@/hooks/usePickImage';
import { useCompanyStore } from '@/stores/companyStore';
import type { ExpenseCategory } from '@/types/database';

export default function CreateExpenseScreen() {
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const { mutateAsync, isPending } = useCreateExpense();
  const { localUri, pendingUpload, pick } = usePickImage();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { amount: '', category: '', description: '' },
  });

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!activeCompanyId) return;
    setSubmitError(null);
    try {
      let receiptPhotoUrl: string | null = null;
      if (pendingUpload && localUri) {
        receiptPhotoUrl = await uploadExpenseReceipt(activeCompanyId, localUri);
      }

      await mutateAsync({
        category: values.category as ExpenseCategory,
        amount: Number(values.amount),
        description: values.description ?? '',
        expenseDate: new Date().toISOString().slice(0, 10),
        receiptPhotoUrl,
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
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Montant"
                placeholder="0"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.amount?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <SelectPills
                label="Catégorie"
                options={[...expenseCategoryOptions]}
                value={value || null}
                onChange={onChange}
                error={errors.category?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Description (facultatif)"
                placeholder="Ex. Livraison de marchandises"
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          <Text style={styles.photoLabel}>Justificatif (facultatif)</Text>
          <Pressable style={styles.photoPicker} onPress={pick}>
            {localUri ? (
              <Image source={{ uri: localUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.photoPlaceholderText}>Ajouter une photo</Text>
              </View>
            )}
          </Pressable>

          {submitError ? <Text style={styles.formError}>{submitError}</Text> : null}

          <Button label="Enregistrer la dépense" onPress={handleSubmit(onSubmit)} loading={isPending} />
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
  photoLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  photoPicker: {
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
  photoPlaceholderText: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 11,
    textAlign: 'center',
  },
  formError: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 14,
    marginBottom: spacing.md,
  },
});
