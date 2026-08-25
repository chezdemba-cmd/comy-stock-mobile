import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { EmptyState } from '@/components/EmptyState';
import { ListRow } from '@/components/ListRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useExpenses } from '@/features/expenses/hooks';
import { expenseCategoryLabel, expenseCategoryOptions } from '@/features/expenses/schemas';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';

export default function ExpensesScreen() {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = useMemo(
    () => (categoryFilter ? expenses.filter((expense) => expense.category === categoryFilter) : expenses),
    [expenses, categoryFilter]
  );

  const monthTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((expense) => {
        const date = new Date(expense.expense_date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  return (
    <ScreenContainer edges={['bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.totalLabel}>Total ce mois-ci</Text>
          <Text style={styles.totalValue}>{formatMoney(monthTotal, currency)}</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => router.push('/(app)/plus/expenses/create')}>
          <Ionicons name="add" size={20} color={colors.textOnWhite} />
        </Pressable>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={expenseCategoryOptions}
        keyExtractor={(item) => item.value}
        style={styles.filterRow}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => {
          const active = categoryFilter === item.value;
          return (
            <Pressable
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setCategoryFilter(active ? null : item.value)}
            >
              <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ListRow
            icon="wallet-outline"
            iconTone="danger"
            title={expenseCategoryLabel[item.category] ?? item.category}
            subtitle={item.description ?? undefined}
            trailingTop={formatMoney(item.amount, currency)}
            trailingBottom={new Date(item.expense_date).toLocaleDateString('fr-FR')}
            trailingTone="danger"
          />
        )}
        ListEmptyComponent={
          isLoading ? null : <EmptyState title="Aucune dépense" description="Ajoutez votre première dépense." />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
  },
  totalValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  filterChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterChipActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenDeepest,
  },
  filterChipLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
  },
  filterChipLabelActive: {
    color: colors.textPrimary,
  },
  list: {
    paddingBottom: spacing.xxxl,
  },
});
