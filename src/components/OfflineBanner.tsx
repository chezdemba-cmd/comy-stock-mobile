import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncQueueStore } from '@/stores/syncQueueStore';

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const pendingCount = useSyncQueueStore((state) => state.items.length);

  if (isOnline && pendingCount === 0) return null;

  return (
    <Pressable
      style={[styles.banner, !isOnline ? styles.bannerOffline : styles.bannerSyncing]}
      onPress={() => router.push('/(app)/plus/sync-queue')}
    >
      <Ionicons name={isOnline ? 'sync-outline' : 'cloud-offline-outline'} size={16} color={colors.textOnWhite} />
      <Text style={styles.text}>
        {!isOnline ? t('offline.banner') : t('offline.pendingCount', { count: pendingCount })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  bannerOffline: {
    backgroundColor: colors.danger,
  },
  bannerSyncing: {
    backgroundColor: colors.greenDeep,
  },
  text: {
    color: colors.textOnWhite,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    flexShrink: 1,
  },
});
