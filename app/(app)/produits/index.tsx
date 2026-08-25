import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useCategories, useProducts } from '@/features/products/hooks';
import { getStockStatus, type StockStatus } from '@/features/products/stockStatus';
import { useCompanyStore } from '@/stores/companyStore';

const STATUS_FILTERS: { value: StockStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'available', label: 'Disponible' },
  { value: 'low', label: 'Faible' },
  { value: 'outOfStock', label: 'Rupture' },
];

export default function ProductsScreen() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'all'>('all');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.sku ?? '').toLowerCase().includes(query) ||
        (product.barcode ?? '').toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || product.category_id === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' || getStockStatus(product.quantity, product.stock_min) === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Produits</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={() => router.push('/(app)/produits/scanner')}>
            <Ionicons name="barcode-outline" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.addButton} onPress={() => router.push('/(app)/produits/create')}>
            <Ionicons name="add" size={20} color={colors.textOnWhite} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un produit, SKU, code-barres..."
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.value}
        style={styles.filterRow}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterChip, statusFilter === item.value && styles.filterChipActive]}
            onPress={() => setStatusFilter(item.value)}
          >
            <Text
              style={[styles.filterChipLabel, statusFilter === item.value && styles.filterChipLabelActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {categories.length > 0 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          style={styles.filterRow}
          contentContainerStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => {
            const active = categoryFilter === item.id;
            return (
              <Pressable
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setCategoryFilter(active ? null : item.id)}
              >
                <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            currency={currency}
            onPress={() => router.push(`/(app)/produits/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="Aucun produit"
              description="Ajoutez votre premier produit pour commencer à vendre."
            />
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
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    paddingVertical: spacing.md,
  },
  filterRow: {
    flexGrow: 0,
    marginBottom: spacing.sm,
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
});
