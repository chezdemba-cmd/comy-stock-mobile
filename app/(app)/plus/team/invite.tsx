import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SelectPills } from '@/components/SelectPills';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useActiveCompanyRole, useMyMemberships } from '@/features/company/hooks';
import { useInviteMember } from '@/features/team/hooks';
import {
  inviteMemberSchema,
  invitableRoles,
  roleLabel,
  type InviteMemberFormValues,
} from '@/features/team/schemas';
import { useCompanyStore } from '@/stores/companyStore';
import type { AppRole } from '@/types/database';

export default function InviteMemberScreen() {
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const { data: memberships } = useMyMemberships();
  const callerRole = useActiveCompanyRole();
  const inviteMember = useInviteMember();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const shops = useMemo(
    () => (memberships?.shops ?? []).filter((shop) => shop.company_id === activeCompanyId),
    [memberships, activeCompanyId]
  );
  const roleOptionsForCaller = useMemo(
    () => invitableRoles(callerRole ?? 'cashier').map((value) => ({ value, label: roleLabel[value] })),
    [callerRole]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { shopId: shops.length === 1 ? shops[0].id : '', role: '' },
  });

  const onSubmit = async (values: InviteMemberFormValues) => {
    setSubmitError(null);
    if (!activeCompanyId) return;
    try {
      const invitation = await inviteMember.mutateAsync({
        companyId: activeCompanyId,
        shopId: values.shopId,
        role: values.role as AppRole,
      });
      setGeneratedCode(invitation.code);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  const shareCode = (code: string) => {
    Share.share({
      message: `Rejoignez notre entreprise sur Comy_stock ! Téléchargez l'application, créez un compte, puis entrez ce code d'invitation : ${code}`,
    });
  };

  if (generatedCode) {
    return (
      <ScreenContainer>
        <View style={styles.successContainer}>
          <Text style={styles.title}>Code généré</Text>
          <Text style={styles.subtitle}>
            Ce code expire dans 7 jours et ne peut être utilisé qu&apos;une seule fois. Partagez-le à
            la personne à inviter.
          </Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{generatedCode}</Text>
          </View>
          <Button label="Partager le code" onPress={() => shareCode(generatedCode)} style={styles.share} />
          <Button label="Terminé" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenContainer>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Inviter un membre</Text>
            <Text style={styles.subtitle}>
              Choisissez la boutique et le rôle, puis partagez le code généré à la personne à inviter.
            </Text>
          </View>

          {shops.length > 1 ? (
            <Controller
              control={control}
              name="shopId"
              render={({ field: { onChange, value } }) => (
                <SelectPills
                  label="Boutique"
                  options={shops.map((shop) => ({ value: shop.id, label: shop.name }))}
                  value={value || null}
                  onChange={onChange}
                  error={errors.shopId?.message}
                />
              )}
            />
          ) : null}

          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <SelectPills
                label="Rôle"
                options={roleOptionsForCaller}
                value={value || null}
                onChange={onChange}
                error={errors.role?.message}
              />
            )}
          />

          {submitError ? <Text style={styles.formError}>{submitError}</Text> : null}

          <Button
            label="Générer le code"
            onPress={handleSubmit(onSubmit)}
            loading={inviteMember.isPending}
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
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  codeBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  code: {
    color: colors.green,
    fontFamily: typography.fontHeadingBold,
    fontSize: 32,
    letterSpacing: 4,
  },
  share: {
    marginBottom: spacing.md,
  },
});
