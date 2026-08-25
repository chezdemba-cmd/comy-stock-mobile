import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ListRow } from '@/components/ListRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StockBadge } from '@/components/StockBadge';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import {
  useAdjustStock,
  useDeleteProduct,
  useProduct,
  useStockMovements,
} from '@/features/products/hooks';
import { getStockStatus } from '@/features/products/stockStatus';
import { useSupplier } from '@/features/suppliers/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';

const MOVEMENT_LABEL: Record<string, string> = {
  entry: 'Entrée',
  sale: 'Vente',
  return: 'Retour',
  correction: 'Correction',
  loss: 'Perte',
  breakage: 'Casse',
  transfer: 'Transfert',
  inventory: 'Inventaire',
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product } = useProduct(id);
  const { data: movements = [] } = useStockMovements(id);
  const { data: supplier } = useSupplier(product?.supplier_id ?? undefined);
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const adjustStock = useAdjustStock(id as string);
  const deleteProduct = useDeleteProduct();
  const { isOnline } = useNetworkStatus();

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  if (!product) return null;

  const status = getStockStatus(product.quantity, product.stock_min);
  const marginUnit = product.sale_price - product.purchase_price;
  const marginRate = product.sale_price > 0 ? Math.round((marginUnit / product.sale_price) * 100) : 0;

  const submitAdjust = async () => {
    const value = Number(adjustAmount);
    if (!value) return;
    await adjustStock.mutateAsync({ quantityChange: value, reason: adjustReason });
    setIsAdjustOpen(false);
    setAdjustAmount('');
    setAdjustReason('');
  };

  const confirmDelete = () => {
    Alert.alert('Supprimer ce produit ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!isOnline) throw new Error('Connexion requise pour cette action.');
            await deleteProduct.mutateAsync(product.id);
            router.back();
          } catch (error) {
            Alert.alert(
              'Impossible de supprimer',
              error instanceof Error ? error.message : 'Une erreur est survenue.'
            );
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          {product.photo_url ? (
            <Image source={{ uri: product.photo_url }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="cube-outline" size={28} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{product.name}</Text>
            {product.sku ? <Text style={styles.sku}>{product.sku}</Text> : null}
            <StockBadge status={status} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Stock actuel</Text>
            <Text style={styles.statValue}>
              {product.quantity} {product.unit}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Prix de vente</Text>
            <Text style={styles.statValue}>{formatMoney(product.sale_price, currency)}</Text>
          </View>
        </View>

        <View style={styles.marginBox}>
          <Text style={styles.marginText}>
            Marge unitaire : {formatMoney(marginUnit, currency)} · Taux : {marginRate}%
          </Text>
        </View>

        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
        {supplier ? (
          <Text style={styles.meta}>Fournisseur : {supplier.name}</Text>
        ) : null}

        <View style={styles.actionsRow}>
          <Button
            label="Modifier"
            variant="secondary"
            onPress={() => router.push(`/(app)/produits/${product.id}/edit`)}
            style={styles.actionButton}
          />
          <Button
            label="Ajuster le stock"
            variant="secondary"
            onPress={() => setIsAdjustOpen(true)}
            style={styles.actionButton}
          />
        </View>
        <Button label="Supprimer" variant="ghost" onPress={confirmDelete} />

        <Text style={styles.sectionTitle}>Derniers mouvements</Text>
        {movements.length === 0 ? (
          <Text style={styles.meta}>Aucun mouvement enregistré.</Text>
        ) : (
          <View style={styles.listCard}>
            {movements.map((movement) => (
              <ListRow
                key={movement.id}
                icon={movement.quantity_change >= 0 ? 'arrow-down-circle' : 'arrow-up-circle'}
                iconTone={movement.quantity_change >= 0 ? 'success' : 'danger'}
                title={MOVEMENT_LABEL[movement.type] ?? movement.type}
                subtitle={movement.reason ?? undefined}
                trailingTop={`${movement.quantity_change > 0 ? '+' : ''}${movement.quantity_change}`}
                trailingBottom={new Date(movement.created_at).toLocaleDateString('fr-FR')}
                trailingTone={movement.quantity_change >= 0 ? 'success' : 'danger'}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={isAdjustOpen} animationType="slide" transparent onRequestClose={() => setIsAdjustOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsAdjustOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Ajuster le stock</Text>
            <TextField
              label="Quantité (+ ou -)"
              placeholder="Ex. -3 ou 5"
              keyboardType="numbers-and-punctuation"
              value={adjustAmount}
              onChangeText={setAdjustAmount}
            />
            <TextField
              label="Raison"
              placeholder="Ex. Casse, comptage..."
              value={adjustReason}
              onChangeText={setAdjustReason}
            />
            <Button label="Valider" onPress={submitAdjust} loading={adjustStock.isPending} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: radii.card,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
  },
  sku: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  statLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: 18,
  },
  marginBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  marginText: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  meta: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.block,
    borderTopRightRadius: radii.block,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.md,
  },
});
