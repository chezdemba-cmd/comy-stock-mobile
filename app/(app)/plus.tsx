import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { supabase } from '@/services/supabase';
import { useCompanyStore } from '@/stores/companyStore';
import { colors, spacing, typography } from '@/constants/theme';

export default function PlusScreen() {
  const { t } = useTranslation();
  const clearCompanyStore = useCompanyStore((state) => state.clear);

  const onLogout = async () => {
    await supabase.auth.signOut();
    clearCompanyStore();
    router.replace('/(onboarding)/welcome');
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>{t('nav.more')}</Text>
        <Text style={styles.description}>{t('common.comingSoonDetail')}</Text>
        <Button label={t('common.logout')} variant="secondary" onPress={onLogout} style={styles.logout} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: typography.body.fontSize,
  },
  logout: {
    marginTop: spacing.xxl,
  },
});
