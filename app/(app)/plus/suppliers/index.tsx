import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SupplierCard } from '@/components/SupplierCard';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useOutstandingDebtsBySupplier, useSuppliers } from '@/features/suppliers/hooks';
import { useCompanyStore } from '@/stores/companyStore';

export default function SuppliersScreen() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: outstandingBySupplier = {} } = useOutstandingDebtsBySupplier();
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return suppliers;
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(query) || (supplier.phone ?? '').includes(query)
    );
  }, [suppliers, search]);

  return (
    <ScreenContainer edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un fournisseur..."
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
          />
        </View>
        <Pressable style={styles.addButton} onPress={() => router.push('/(app)/plus/suppliers/create')}>
          <Ionicons name="add" size={20} color={colors.textOnWhite} />
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <SupplierCard
            supplier={item}
            outstandingDebt={outstandingBySupplier[item.id] ?? 0}
            currency={currency}
            onPress={() => router.push(`/(app)/plus/suppliers/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState title="Aucun fournisseur" description="Ajoutez votre premier fournisseur." />
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    paddingVertical: spacing.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: spacing.xxxl,
  },
});
