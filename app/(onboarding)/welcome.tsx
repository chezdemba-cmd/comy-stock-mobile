import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/constants/theme';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer centered>
      <View style={styles.center}>
        <Logo variant="mark" size={96} />
        <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
      </View>
      <Button
        label={t('onboarding.welcome.cta')}
        onPress={() => router.push('/(onboarding)/auth-choice')}
        style={styles.cta}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    textAlign: 'center',
  },
  cta: {
    marginBottom: spacing.xxl,
  },
});
