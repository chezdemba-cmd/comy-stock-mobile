import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/useAuth';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/schemas';
import { supabase } from '@/services/supabase';
import { colors, spacing, typography } from '@/constants/theme';

type LinkStatus = 'exchanging' | 'ready' | 'invalid';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { updatePassword, isSubmitting } = useAuth();
  const [linkStatus, setLinkStatus] = useState<LinkStatus>(() => (code ? 'exchanging' : 'invalid'));
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    // Le lien de l'email de réinitialisation redirige ici avec ?code=... (flux PKCE) :
    // on l'échange contre une session temporaire, juste le temps de choisir un nouveau
    // mot de passe. Sans code (écran ouvert directement, lien déjà utilisé/expiré), l'état
    // initial "invalid" (ci-dessus) affiche déjà le bon message, rien à faire ici.
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      setLinkStatus(error ? 'invalid' : 'ready');
    });
  }, [code]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setSubmitError(null);
    const errorMessage = await updatePassword(values.password);
    if (!errorMessage) {
      // La session établie par exchangeCodeForSession est maintenant une session normale :
      // la porte de routage racine décide de la suite (généralement /(app) directement).
      router.replace('/');
    } else {
      setSubmitError(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer edges={['top', 'bottom']}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Logo variant="mark" size={56} />
            <Text style={styles.title}>{t('auth.resetPassword.title')}</Text>
            {linkStatus === 'ready' ? (
              <Text style={styles.subtitle}>{t('auth.resetPassword.subtitle')}</Text>
            ) : null}
          </View>

          {linkStatus === 'exchanging' ? (
            <Text style={styles.info}>{t('auth.resetPassword.checkingLink')}</Text>
          ) : linkStatus === 'invalid' ? (
            <Text style={styles.formError}>{t('auth.resetPassword.invalidLink')}</Text>
          ) : (
            <>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label={t('auth.resetPassword.passwordLabel')}
                    placeholder={t('auth.resetPassword.passwordPlaceholder')}
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password ? t(errors.password.message ?? '') : undefined}
                  />
                )}
              />

              {submitError ? <Text style={styles.formError}>{submitError}</Text> : null}

              <Button
                label={t('auth.resetPassword.submit')}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                style={styles.submit}
              />
            </>
          )}
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  info: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  formError: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
