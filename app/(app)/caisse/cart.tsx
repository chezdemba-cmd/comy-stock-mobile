import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { CartLineItem } from '@/components/CartLineItem';
import { CustomerPicker } from '@/components/CustomerPicker';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { cartSubtotal, useCartStore } from '@/stores/cartStore';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';

export default function CartScreen() {
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const discountAmount = useCartStore((state) => state.discountAmount);
  const setDiscount = useCartStore((state) => state.setDiscount);
  const customerId = useCartStore((state) => state.customerId);
  const setCustomer = useCartStore((state) => state.setCustomer);

  const subtotal = cartSubtotal(items);
  const total = Math.max(subtotal - discountAmount, 0);

  if (items.length === 0) {
    return (
      <ScreenContainer edges={['bottom']}>
        <EmptyState title="Panier vide" description="Ajoutez des produits depuis la caisse." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.list}>
          {items.map((item) => (
            <CartLineItem
              key={item.productId}
              item={item}
              currency={currency}
              onIncrement={() => updateQuantity(item.productId, item.quantity + 1)}
              onDecrement={() => updateQuantity(item.productId, item.quantity - 1)}
              onRemove={() => removeItem(item.productId)}
            />
          ))}
        </View>

        <TextField
          label="Réduction (montant)"
          placeholder="0"
          keyboardType="numeric"
          value={String(discountAmount || '')}
          onChangeText={(value) => setDiscount(Number(value) || 0)}
        />

        <CustomerPicker value={customerId} onChange={setCustomer} />

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{formatMoney(subtotal, currency)}</Text>
          </View>
          {discountAmount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Réduction</Text>
              <Text style={styles.totalValue}>-{formatMoney(discountAmount, currency)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelFinal}>Total</Text>
            <Text style={styles.totalValueFinal}>{formatMoney(total, currency)}</Text>
          </View>
        </View>

        <Button label="Continuer" onPress={() => router.push('/(app)/caisse/payment')} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  totals: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
  },
  totalValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
  totalRowFinal: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabelFinal: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: 16,
  },
  totalValueFinal: {
    color: colors.green,
    fontFamily: typography.fontHeading,
    fontSize: 18,
  },
});
