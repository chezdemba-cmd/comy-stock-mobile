import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/constants/theme';

export default function AuthChoiceScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer centered>
      <View style={styles.top}>
        <Logo variant="mark" size={64} />
        <Text style={styles.title}>{t('onboarding.authChoice.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.authChoice.subtitle')}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label={t('onboarding.authChoice.createAccount')}
          onPress={() => router.push('/(auth)/signup')}
        />
        <Button
          label={t('onboarding.authChoice.login')}
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
          style={styles.secondButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  actions: {
    marginBottom: spacing.xxl,
  },
  secondButton: {
    marginTop: spacing.md,
  },
});
