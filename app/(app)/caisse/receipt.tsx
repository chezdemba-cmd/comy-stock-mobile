import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { QrCodeReceipt } from '@/components/QrCodeReceipt';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useSaleReceipt } from '@/features/pos/hooks';
import { buildReceiptHtml, printReceipt, shareReceiptPdf } from '@/features/pos/receiptPdf';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte',
  orange_money: 'Orange Money',
  wave: 'Wave',
  moov_money: 'Moov Money',
  credit: 'Crédit',
};

export default function ReceiptScreen() {
  const { saleId } = useLocalSearchParams<{ saleId: string }>();
  const { data: receipt } = useSaleReceipt(saleId);
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const activeShopId = useCompanyStore((state) => state.activeShopId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';
  const shopName = memberships?.shops.find((shop) => shop.id === activeShopId)?.name ?? 'Boutique';

  const [actionError, setActionError] = useState<string | null>(null);

  if (!receipt) return null;

  const html = buildReceiptHtml(receipt, shopName, currency);

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.successBadge}>
          <Ionicons name="checkmark-circle" size={40} color={colors.green} />
          <Text style={styles.successTitle}>Vente enregistrée</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.shopName}>{shopName}</Text>
          <Text style={styles.meta}>
            Reçu #{receipt.sale.sale_number} · {new Date(receipt.sale.created_at).toLocaleString('fr-FR')}
          </Text>
          {receipt.sellerName ? <Text style={styles.meta}>Vendeur : {receipt.sellerName}</Text> : null}
          {receipt.customer ? <Text style={styles.meta}>Client : {receipt.customer.name}</Text> : null}

          <View style={styles.itemsBox}>
            {receipt.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.quantity} × {item.product_name}
                </Text>
                <Text style={styles.itemTotal}>{formatMoney(item.line_total, currency)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatMoney(receipt.sale.total, currency)}</Text>
          </View>

          {receipt.payments.map((payment) => (
            <View key={payment.id} style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{PAYMENT_LABEL[payment.method] ?? payment.method}</Text>
              <Text style={styles.paymentValue}>{formatMoney(payment.amount, currency)}</Text>
            </View>
          ))}

          <QrCodeReceipt value={`comystock://receipt/${receipt.sale.id}`} />
        </View>

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

        <View style={styles.actions}>
          <Button
            label="Partager"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => shareReceiptPdf(html).catch((err) => setActionError(err.message))}
          />
          <Button
            label="Imprimer"
            variant="secondary"
            style={styles.actionButton}
            onPress={() => printReceipt(html).catch((err) => setActionError(err.message))}
          />
        </View>

        <Button label="Nouvelle vente" onPress={() => router.replace('/(app)/caisse')} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  successBadge: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  successTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.block,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  shopName: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
  },
  meta: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
  },
  itemsBox: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  itemName: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
  },
  itemTotal: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: 16,
  },
  totalValue: {
    color: colors.green,
    fontFamily: typography.fontHeading,
    fontSize: 18,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
  },
  paymentValue: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
