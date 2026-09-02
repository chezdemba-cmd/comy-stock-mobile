import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useCreateSale } from '@/features/pos/hooks';
import { useProducts } from '@/features/products/hooks';
import { cartSubtotal, useCartStore } from '@/stores/cartStore';
import { useCompanyStore } from '@/stores/companyStore';
import type { PaymentMethod } from '@/types/database';
import { formatMoney } from '@/utils/money';

interface PaymentLine {
  method: PaymentMethod;
  amount: string;
}

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }[] = [
  { value: 'cash', label: 'Espèces', icon: 'cash-outline' },
  { value: 'card', label: 'Carte', icon: 'card-outline' },
  { value: 'orange_money', label: 'Orange Money', icon: 'phone-portrait-outline' },
  { value: 'wave', label: 'Wave', icon: 'phone-portrait-outline' },
  { value: 'moov_money', label: 'Moov Money', icon: 'phone-portrait-outline' },
  { value: 'credit', label: 'Crédit client', icon: 'time-outline' },
];

export default function PaymentScreen() {
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const activeShopId = useCompanyStore((state) => state.activeShopId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const items = useCartStore((state) => state.items);
  const discountAmount = useCartStore((state) => state.discountAmount);
  const customerId = useCartStore((state) => state.customerId);
  const clearCart = useCartStore((state) => state.clear);

  const subtotal = cartSubtotal(items);
  const total = Math.max(subtotal - discountAmount, 0);

  const [lines, setLines] = useState<PaymentLine[]>([{ method: 'cash', amount: String(total) }]);
  const [error, setError] = useState<string | null>(null);
  const createSale = useCreateSale();
  const { data: products = [] } = useProducts();

  const paidTotal = useMemo(() => lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0), [lines]);
  const remaining = Math.round((total - paidTotal) * 100) / 100;
  const hasCredit = lines.some((line) => line.method === 'credit' && Number(line.amount) > 0);

  const addMethod = (method: PaymentMethod) => {
    if (lines.some((line) => line.method === method)) return;
    setLines((prev) => [...prev, { method, amount: remaining > 0 ? String(remaining) : '0' }]);
  };

  const updateAmount = (method: PaymentMethod, amount: string) => {
    setLines((prev) => prev.map((line) => (line.method === method ? { ...line, amount } : line)));
  };

  const removeLine = (method: PaymentMethod) => {
    setLines((prev) => prev.filter((line) => line.method !== method));
  };

  const completeSale = async () => {
    if (!activeCompanyId || !activeShopId) return;
    try {
      const result = await createSale.mutateAsync({
        companyId: activeCompanyId,
        shopId: activeShopId,
        customerId,
        subtotal,
        discountAmount,
        total,
        items,
        payments: lines
          .filter((line) => Number(line.amount) > 0)
          .map((line) => ({ method: line.method, amount: Number(line.amount) })),
      });

      clearCart();
      if (result.status === 'synced') {
        router.replace({ pathname: '/(app)/caisse/receipt', params: { saleId: result.sale.id } });
      } else {
        router.replace({ pathname: '/(app)/caisse/receipt-pending', params: { queueId: result.queueId } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const onConfirm = () => {
    setError(null);

    if (remaining !== 0) {
      setError('La somme des paiements doit être égale au total.');
      return;
    }
    if (hasCredit && !customerId) {
      setError('Un client est requis pour une vente à crédit.');
      return;
    }
    if (!activeCompanyId || !activeShopId) return;

    const stockByProduct = new Map(products.map((product) => [product.id, product.quantity]));
    const insufficientItems = items.filter(
      (item) => item.quantity > (stockByProduct.get(item.productId) ?? 0),
    );

    if (insufficientItems.length > 0) {
      const details = insufficientItems
        .slice(0, 5)
        .map((item) => `${item.name} : demandé ${item.quantity}, disponible ${stockByProduct.get(item.productId) ?? 0}`)
        .join('\n');
      Alert.alert(
        'Stock insuffisant',
        `${details}${insufficientItems.length > 5 ? '\n…' : ''}\n\nLe stock deviendra négatif. Vérifiez la quantité ou confirmez la vente.`,
        [
          { text: 'Vérifier', style: 'cancel' },
          { text: 'Encaisser quand même', style: 'destructive', onPress: () => void completeSale() },
        ],
      );
      return;
    }

    void completeSale();
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.totalDue}>{formatMoney(total, currency)}</Text>
        <Text style={styles.totalDueLabel}>Total à encaisser</Text>

        <View style={styles.methodsGrid}>
          {METHOD_OPTIONS.map((option) => {
            const active = lines.some((line) => line.method === option.value);
            return (
              <Pressable
                key={option.value}
                style={[styles.methodChip, active && styles.methodChipActive]}
                onPress={() => addMethod(option.value)}
              >
                <Ionicons name={option.icon} size={16} color={active ? colors.textOnWhite : colors.textSecondary} />
                <Text style={[styles.methodChipLabel, active && styles.methodChipLabelActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {lines.map((line) => {
          const option = METHOD_OPTIONS.find((item) => item.value === line.method);
          return (
            <View key={line.method} style={styles.lineRow}>
              <View style={styles.lineField}>
                <TextField
                  label={option?.label ?? line.method}
                  placeholder="0"
                  keyboardType="numeric"
                  value={line.amount}
                  onChangeText={(value) => updateAmount(line.method, value)}
                />
              </View>
              <Pressable onPress={() => removeLine(line.method)} style={styles.removeLine}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          );
        })}

        <View style={styles.remainingBox}>
          <Text style={styles.remainingLabel}>Restant</Text>
          <Text
            style={[
              styles.remainingValue,
              { color: remaining === 0 ? colors.green : colors.warning },
            ]}
          >
            {formatMoney(remaining, currency)}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="ENCAISSER" onPress={onConfirm} loading={createSale.isPending} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  totalDue: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.h1.fontSize,
    textAlign: 'center',
  },
  totalDueLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  methodChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  methodChipLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
  },
  methodChipLabelActive: {
    color: colors.textOnWhite,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lineField: {
    flex: 1,
  },
  removeLine: {
    marginBottom: spacing.lg,
  },
  remainingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  remainingLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
  remainingValue: {
    fontFamily: typography.fontHeading,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
