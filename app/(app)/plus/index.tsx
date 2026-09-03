import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { signOut } from '@/features/auth/signOut';
import { useNotifications } from '@/features/notifications/hooks';
import { useActiveCompanyRole } from '@/features/company/hooks';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { formatNumber } from '@/utils/money';

const MENU_ITEMS = [
  { label: 'Clients', icon: 'people-outline' as const, href: '/(app)/plus/clients' as const },
  { label: 'Fournisseurs', icon: 'briefcase-outline' as const, href: '/(app)/plus/suppliers' as const },
  { label: 'Dépenses', icon: 'wallet-outline' as const, href: '/(app)/plus/expenses' as const },
  { label: 'Équipe', icon: 'person-add-outline' as const, href: '/(app)/plus/team' as const },
  { label: 'Rapports', icon: 'bar-chart-outline' as const, href: '/(app)/plus/reports' as const },
  { label: 'Abonnement', icon: 'star-outline' as const, href: '/(app)/plus/subscription' as const },
  { label: 'Synchronisation', icon: 'sync-outline' as const, href: '/(app)/plus/sync-queue' as const },
  { label: 'Notifications', icon: 'notifications-outline' as const, href: '/(app)/plus/notifications' as const },
  { label: 'Entreprise et boutique', icon: 'business-outline' as const, href: '/(app)/plus/business-settings' as const },
];

export default function PlusScreen() {
  const { t } = useTranslation();
  const role = useActiveCompanyRole();
  const { data: notifications = [] } = useNotifications();
  const unreadNotifications = notifications.filter((item) => !item.read_at).length;

  const onLogout = async () => {
    await signOut();
    router.replace('/(onboarding)/welcome');
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>{t('nav.more')}</Text>

        <View style={styles.menu}>
          {MENU_ITEMS.filter((item) => {
            if (item.label === 'Notifications') return role === 'owner' || role === 'accountant';
            if (item.label === 'Entreprise et boutique') return role === 'owner' || role === 'manager' || role === 'accountant';
            return true;
          }).map((item) => (
            <Pressable key={item.href} style={styles.menuItem} onPress={() => router.push(item.href)}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={18} color={colors.green} />
              </View>
              <Text style={styles.menuLabel}>
                {item.label === 'Notifications' && unreadNotifications > 0
                  ? `${item.label} (${formatNumber(unreadNotifications)})`
                  : item.label}
              </Text>
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
