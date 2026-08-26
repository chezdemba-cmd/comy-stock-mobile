import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ListRow } from '@/components/ListRow';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { MoneyCard } from '@/components/MoneyCard';
import { QuickAction } from '@/components/QuickAction';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StatCard } from '@/components/StatCard';
import { useDashboardData } from '@/features/dashboard/hooks';
import type { OperationKind } from '@/features/dashboard/types';
import { useMyMemberships } from '@/features/company/hooks';
import { useCompanyStore } from '@/stores/companyStore';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { formatMoney } from '@/utils/money';

const OPERATION_ICON: Record<OperationKind, keyof typeof Ionicons.glyphMap> = {
  sale: 'cart',
  expense: 'arrow-down-circle',
  payment: 'cash',
  stock: 'cube',
};

export default function DashboardScreen() {
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);

  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const { data, isLoading } = useDashboardData(currency);

  if (isLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <LoadingIndicator fullScreen />
      </ScreenContainer>
    );
  }

  const variationPercent = data.revenueYesterday
    ? Math.round(((data.revenueToday - data.revenueYesterday) / data.revenueYesterday) * 100)
    : 0;

  const averageBasket = data.salesCount > 0 ? Math.round(data.revenueToday / data.salesCount) : 0;

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <AppHeader />

        <MoneyCard
          label="Chiffre d'affaires du jour"
          amount={data.revenueToday}
          currency={currency}
          variationPercent={variationPercent}
          footer={`${formatMoney(data.profitEstimate, currency)} de bénéfice estimé`}
        />

        <View style={styles.quickActions}>
          <QuickAction icon="cart" label="Nouvelle vente" onPress={() => router.push('/(app)/caisse')} />
          <QuickAction icon="cube" label="Ajouter produit" onPress={() => router.push('/(app)/produits')} />
          <QuickAction icon="wallet" label="Ajouter dépense" onPress={() => router.push('/(app)/plus/expenses/create')} />
          <QuickAction icon="card" label="Encaisser dette" onPress={() => router.push('/(app)/plus/clients')} />
          <QuickAction icon="sparkles" label="Comy IA" onPress={() => router.push('/(app)/comy-ia')} />
        </View>

        <Text style={styles.sectionTitle}>Aujourd&apos;hui</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="cart" label="Ventes" value={String(data.salesCount)} />
          <StatCard icon="wallet" label="Dépenses" value={formatMoney(data.expensesToday, currency)} />
          <StatCard icon="trending-up" label="Bénéfice" value={formatMoney(data.profitEstimate, currency)} />
          <StatCard icon="pricetag" label="Panier moyen" value={formatMoney(averageBasket, currency)} />
        </View>

        <Text style={styles.sectionTitle}>Stock</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="checkmark-circle" label="Disponibles" value={String(data.stock.available)} />
          <StatCard
            icon="alert-circle"
            label="Stock faible"
            value={String(data.stock.low)}
            tone="warning"
          />
          <StatCard
            icon="close-circle"
            label="Rupture"
            value={String(data.stock.outOfStock)}
            tone="danger"
          />
        </View>

        <Text style={styles.sectionTitle}>Alertes</Text>
        {data.alerts.length === 0 ? (
          <EmptyState title="Aucune alerte" description="Tout est sous contrôle." />
        ) : (
          <View style={styles.listCard}>
            {data.alerts.map((alert) => (
              <ListRow
                key={alert.id}
                icon={alert.severity === 'danger' ? 'alert-circle' : 'warning'}
                iconTone={alert.severity}
                title={alert.message}
              />
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Dernières opérations</Text>
        {data.recentOperations.length === 0 ? (
          <EmptyState title="Aucune opération" description="Vos ventes et dépenses apparaîtront ici." />
        ) : (
          <View style={styles.listCard}>
            {data.recentOperations.map((operation) => (
              <ListRow
                key={operation.id}
                icon={OPERATION_ICON[operation.kind]}
                iconTone={operation.amount > 0 ? 'success' : operation.amount < 0 ? 'danger' : 'default'}
                title={operation.title}
                subtitle={operation.subtitle}
                trailingTop={operation.amount !== 0 ? formatMoney(operation.amount, currency) : undefined}
                trailingBottom={operation.time}
                trailingTone={operation.amount > 0 ? 'success' : operation.amount < 0 ? 'danger' : 'default'}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
});
