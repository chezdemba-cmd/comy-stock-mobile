import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ListRow } from '@/components/ListRow';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useProductSales } from '@/features/reports/hooks';
import { getPeriodRange } from '@/features/reports/periods';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';

export default function ProductReportsScreen() {
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const range = params.from && params.to ? { from: params.from, to: params.to } : getPeriodRange('month');

  const { data: rows = [], isLoading, isError, refetch } = useProductSales(range);
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const topProducts = useMemo(
    () => [...rows].sort((a, b) => b.quantity_sold - a.quantity_sold).slice(0, 5),
    [rows]
  );
  const worstProducts = useMemo(
    () => [...rows].sort((a, b) => a.quantity_sold - b.quantity_sold).slice(0, 5),
    [rows]
  );
  const bestCategories = useMemo(() => {
    const byCategory = new Map<string, { name: string; revenue: number }>();
    for (const row of rows) {
      const key = row.category_id ?? 'none';
      const name = row.category_name ?? 'Sans catégorie';
      const existing = byCategory.get(key);
      byCategory.set(key, { name, revenue: (existing?.revenue ?? 0) + row.revenue });
    }
    return Array.from(byCategory.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [rows]);

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
        <Text style={styles.sectionTitle}>Produits les plus vendus</Text>
        <View style={styles.card}>
          {topProducts.map((row) => (
            <ListRow
              key={row.product_id}
              icon="trending-up"
              iconTone="success"
              title={row.product_name}
              subtitle={`${row.quantity_sold} vendu(s)`}
              trailingTop={formatMoney(row.revenue, currency)}
              trailingBottom={`Marge ${formatMoney(row.margin, currency)}`}
              trailingTone="success"
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Produits les moins vendus</Text>
        <View style={styles.card}>
          {worstProducts.map((row) => (
            <ListRow
              key={row.product_id}
              icon="trending-down"
              iconTone="warning"
              title={row.product_name}
              subtitle={`${row.quantity_sold} vendu(s)`}
              trailingTop={formatMoney(row.revenue, currency)}
              trailingTone="default"
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Meilleures catégories</Text>
        <View style={styles.card}>
          {bestCategories.map((category) => (
            <ListRow
              key={category.name}
              icon="pricetag-outline"
              iconTone="success"
              title={category.name}
              trailingTop={formatMoney(category.revenue, currency)}
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
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
});
