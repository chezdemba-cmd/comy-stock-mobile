import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { supabase } from '@/services/supabase';
import { useCompanyStore } from '@/stores/companyStore';
import { colors, radii, spacing, typography } from '@/constants/theme';

const MENU_ITEMS = [
  { label: 'Clients', icon: 'people-outline' as const, href: '/(app)/plus/clients' as const },
  { label: 'Fournisseurs', icon: 'briefcase-outline' as const, href: '/(app)/plus/suppliers' as const },
];

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

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <Pressable key={item.href} style={styles.menuItem} onPress={() => router.push(item.href)}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={18} color={colors.green} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        <Button label={t('common.logout')} variant="secondary" onPress={onLogout} style={styles.logout} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
    marginBottom: spacing.xl,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.button,
    backgroundColor: colors.greenDeepest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 15,
  },
  logout: {
    marginTop: 'auto',
    marginBottom: spacing.xxl,
  },
});
