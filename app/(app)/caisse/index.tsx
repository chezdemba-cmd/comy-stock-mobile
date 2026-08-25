import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useProducts } from '@/features/products/hooks';
import { useOpenCashSession, useOpenSession } from '@/features/pos/hooks';
import { useCartStore, cartSubtotal } from '@/stores/cartStore';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';

export default function CaisseScreen() {
  const { data: session, isLoading } = useOpenSession();

  if (isLoading) return null;

  return session ? <PosScreen /> : <OpenSessionScreen />;
}

function OpenSessionScreen() {
  const [amount, setAmount] = useState('0');
  const openSession = useOpenCashSession();
  const [error, setError] = useState<string | null>(null);

  const onOpen = async () => {
    setError(null);
    try {
      await openSession.mutateAsync(Number(amount) || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  return (
    <ScreenContainer centered>
      <Text style={styles.openTitle}>Ouvrir la caisse</Text>
      <Text style={styles.openSubtitle}>
        Indiquez le montant en espèces présent dans la caisse au démarrage de la journée.
      </Text>
      <TextField
        label="Montant initial"
        placeholder="0"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Ouvrir la caisse" onPress={onOpen} loading={openSession.isPending} />
    </ScreenContainer>
  );
}

function PosScreen() {
  const { data: products = [] } = useProducts();
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const [search, setSearch] = useState('');
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) || (product.sku ?? '').toLowerCase().includes(query)
    );
  }, [products, search]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartSubtotal(items);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Caisse</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={() => router.push('/(app)/caisse/register')}>
            <Ionicons name="wallet-outline" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/(app)/caisse/scanner')}>
            <Ionicons name="barcode-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un produit..."
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={styles.grid}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.productTile}
            onPress={() =>
              addItem({
                productId: item.id,
                name: item.name,
                unitPrice: item.sale_price,
                unitCost: item.purchase_price,
                availableQuantity: item.quantity,
              })
            }
          >
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>{formatMoney(item.sale_price, currency)}</Text>
            <Text style={styles.productStock}>
              {item.quantity} {item.unit}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState title="Aucun produit" description="Ajoutez des produits depuis l'onglet Produits." />
        }
      />

      {itemCount > 0 ? (
        <Pressable style={styles.cartBar} onPress={() => router.push('/(app)/caisse/cart')}>
          <Text style={styles.cartBarLabel}>
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </Text>
          <Text style={styles.cartBarTotal}>{formatMoney(total, currency)}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textOnWhite} />
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  openTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  openSubtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
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
  grid: {
    paddingBottom: spacing.xxxl * 2,
  },
  productTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 92,
  },
  productName: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  productPrice: {
    color: colors.green,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  productStock: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 11,
    marginTop: 2,
  },
  cartBar: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.green,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  cartBarLabel: {
    color: colors.textOnWhite,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  cartBarTotal: {
    color: colors.textOnWhite,
    fontFamily: typography.fontHeading,
    fontSize: 15,
  },
});
