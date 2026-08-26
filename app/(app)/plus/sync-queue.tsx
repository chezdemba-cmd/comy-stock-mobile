import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ListRow } from '@/components/ListRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { processQueue } from '@/services/syncQueue';
import { useCompanyStore } from '@/stores/companyStore';
import { useSyncQueueStore, type QueuedMutation } from '@/stores/syncQueueStore';
import { formatMoney } from '@/utils/money';

function itemTypeLabel(item: QueuedMutation, t: (key: string) => string): string {
  return t(`offline.type${item.type[0].toUpperCase()}${item.type.slice(1)}`);
}

function itemAmount(item: QueuedMutation, currency: string): string | undefined {
  switch (item.type) {
    case 'createSale':
      return formatMoney(item.payload.total, currency);
    case 'addCashMovement':
      return formatMoney(item.payload.amount, currency);
    case 'createExpense':
      return formatMoney(item.payload.amount, currency);
    case 'adjustStock':
      return undefined;
  }
}

export default function SyncQueueScreen() {
  const { t } = useTranslation();
  const items = useSyncQueueStore((state) => state.items);
  const retry = useSyncQueueStore((state) => state.retry);
  const discard = useSyncQueueStore((state) => state.discard);
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency = memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  if (items.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title={t('offline.queueTitle')} description={t('offline.queueEmpty')} />
      </ScreenContainer>
    );
  }

  const statusLabel = (status: QueuedMutation['status']) =>
    status === 'syncing'
      ? t('offline.queueStatusSyncing')
      : status === 'error'
        ? t('offline.queueStatusError')
        : t('offline.queueStatusPending');

  const confirmDiscard = (item: QueuedMutation) => {
    Alert.alert(t('offline.discardConfirmTitle'), t('offline.discardConfirmMessage'), [
      { text: t('offline.discardConfirmCancel'), style: 'cancel' },
      { text: t('offline.discard'), style: 'destructive', onPress: () => discard(item.id) },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id}>
            <ListRow
              icon={item.status === 'error' ? 'alert-circle-outline' : 'time-outline'}
              iconTone={item.status === 'error' ? 'danger' : 'warning'}
              title={itemTypeLabel(item, t)}
              subtitle={item.errorMessage ?? statusLabel(item.status)}
              trailingTop={itemAmount(item, currency)}
            />
            {item.status === 'error' ? (
              <View style={styles.actions}>
                <Button label={t('offline.retry')} variant="ghost" onPress={() => retry(item.id)} />
                <Button label={t('offline.discard')} variant="ghost" onPress={() => confirmDiscard(item)} />
              </View>
            ) : null}
          </View>
        ))}
      </View>
      <Text style={styles.hint}>{t('offline.queueHint')}</Text>
      <Button label={t('offline.syncNow')} onPress={() => processQueue()} style={styles.retryAll} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  retryAll: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
});
