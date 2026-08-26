import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListRow } from '@/components/ListRow';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useEmployeeSales } from '@/features/reports/hooks';
import { getPeriodRange } from '@/features/reports/periods';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';

export default function EmployeeReportsScreen() {
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const range = params.from && params.to ? { from: params.from, to: params.to } : getPeriodRange('month');

  const { data: rows = [], isLoading, isError, refetch } = useEmployeeSales(range);
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  if (isLoading) {
    return (
      <ScreenContainer edges={['bottom']}>
        <LoadingIndicator fullScreen />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ErrorState onRetry={() => refetch()} />
      </ScreenContainer>
    );
  }

  if (rows.length === 0) {
    return (
      <ScreenContainer edges={['bottom']}>
        <EmptyState title="Aucune vente sur la période" description="Changez de période depuis Rapports." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {[...rows]
            .sort((a, b) => b.revenue - a.revenue)
            .map((row) => (
              <ListRow
                key={row.employee_id}
                icon="person-outline"
                title={row.employee_name}
                subtitle={`${row.sales_count} vente(s)${row.total_discounts > 0 ? ` · ${formatMoney(row.total_discounts, currency)} de remises` : ''}`}
                trailingTop={formatMoney(row.revenue, currency)}
                trailingTone="success"
              />
            ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
});
