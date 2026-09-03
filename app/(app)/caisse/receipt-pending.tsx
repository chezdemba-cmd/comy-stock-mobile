import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useCompanyStore } from '@/stores/companyStore';
import { useSyncQueueStore } from '@/stores/syncQueueStore';
import { formatMoney, formatNumber } from '@/utils/money';

export default function ReceiptPendingScreen() {
  const { t } = useTranslation();
  const { queueId } = useLocalSearchParams<{ queueId: string }>();
  const item = useSyncQueueStore((state) => state.items.find((entry) => entry.id === queueId));
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency = memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  if (!item || item.type !== 'createSale') {
    return (
      <ScreenContainer edges={['bottom']}>
        <Button label={t('offline.receiptPendingBack')} onPress={() => router.replace('/(app)/caisse')} />
      </ScreenContainer>
    );
  }

  const sale = item.payload;

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.successBadge}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.warning} />
          <Text style={styles.successTitle}>{t('offline.receiptPendingTitle')}</Text>
          <Text style={styles.detail}>{t('offline.receiptPendingDetail')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.itemsBox}>
            {sale.items.map((line) => (
              <View key={line.productId} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {formatNumber(line.quantity)} × {line.name}
                </Text>
                <Text style={styles.itemTotal}>{formatMoney(line.unitPrice * line.quantity, currency)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatMoney(sale.total, currency)}</Text>
          </View>
        </View>

        <Button label={t('offline.receiptPendingBack')} onPress={() => router.replace('/(app)/caisse')} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  successBadge: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  successTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    textAlign: 'center',
  },
  detail: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.block,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  itemsBox: {
    paddingBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  itemName: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
  },
  itemTotal: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: 16,
  },
  totalValue: {
    color: colors.green,
    fontFamily: typography.fontHeading,
    fontSize: 18,
  },
});
