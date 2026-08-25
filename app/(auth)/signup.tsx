import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/useAuth';
import { signupSchema, type SignupFormValues } from '@/features/auth/schemas';
import { colors, spacing, typography } from '@/constants/theme';

export default function SignupScreen() {
  const { t } = useTranslation();
  const { signup, isSubmitting } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setSubmitError(null);
    const errorMessage = await signup(values);
    if (!errorMessage) {
      // Passe par la porte de routage racine : c'est elle qui redirige vers
      // create-company puisqu'un tout nouveau compte n'a encore aucune entreprise.
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
            <Text style={styles.title}>{t('auth.signup.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>
          </View>

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.signup.nameLabel')}
                placeholder={t('auth.signup.namePlaceholder')}
                autoCapitalize="words"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.fullName ? t(errors.fullName.message ?? '') : undefined}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.signup.emailLabel')}
                placeholder={t('auth.signup.emailPlaceholder')}
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email ? t(errors.email.message ?? '') : undefined}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('auth.signup.passwordLabel')}
                placeholder={t('auth.signup.passwordPlaceholder')}
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
            label={t('auth.signup.submit')}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={styles.submit}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.signup.hasAccount')} </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.footerLink}>{t('auth.signup.goToLogin')}</Text>
            </Pressable>
          </View>
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
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  formError: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  submit: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
  },
  footerLink: {
    color: colors.green,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
});
