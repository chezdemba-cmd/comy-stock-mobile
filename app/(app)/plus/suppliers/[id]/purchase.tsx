import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useProducts } from '@/features/products/hooks';
import { useCreatePurchase } from '@/features/suppliers/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';

interface PurchaseLine {
  productId: string;
  productName: string;
  quantity: string;
  unitCost: string;
}

export default function CreatePurchaseScreen() {
  const { id: supplierId } = useLocalSearchParams<{ id: string }>();
  const { data: products = [] } = useProducts();
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const activeShopId = useCompanyStore((state) => state.activeShopId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createPurchase = useCreatePurchase();
  const { isOnline } = useNetworkStatus();

  const total = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0), 0);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const addProduct = (productId: string, productName: string, defaultCost: number) => {
    if (lines.some((line) => line.productId === productId)) {
      setIsPickerOpen(false);
      return;
    }
    setLines((prev) => [...prev, { productId, productName, quantity: '1', unitCost: String(defaultCost) }]);
    setIsPickerOpen(false);
    setSearch('');
  };

  const updateLine = (productId: string, field: 'quantity' | 'unitCost', value: string) => {
    setLines((prev) => prev.map((line) => (line.productId === productId ? { ...line, [field]: value } : line)));
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  };

  const onSubmit = async () => {
    setError(null);
    if (!activeCompanyId || !activeShopId || lines.length === 0) return;

    const paid = amountPaid === '' ? total : Number(amountPaid);
    if (paid > total) {
      setError('Le montant payé ne peut pas dépasser le total.');
      return;
    }

    try {
      if (!isOnline) throw new Error('Connexion requise pour cette action.');
      await createPurchase.mutateAsync({
        companyId: activeCompanyId,
        shopId: activeShopId,
        supplierId: supplierId ?? null,
        items: lines.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          quantity: Number(line.quantity) || 0,
          unitCost: Number(line.unitCost) || 0,
        })),
        amountPaid: paid,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.addProductButton} onPress={() => setIsPickerOpen(true)}>
          <Ionicons name="add-circle-outline" size={18} color={colors.green} />
          <Text style={styles.addProductLabel}>Ajouter un produit</Text>
        </Pressable>

        {lines.length === 0 ? (
          <EmptyState title="Aucun article" description="Ajoutez les produits achetés à ce fournisseur." />
        ) : (
          <View style={styles.linesCard}>
            {lines.map((line) => (
              <View key={line.productId} style={styles.lineRow}>
                <View style={styles.lineHeader}>
                  <Text style={styles.lineName} numberOfLines={1}>
                    {line.productName}
                  </Text>
                  <Pressable onPress={() => removeLine(line.productId)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                </View>
                <View style={styles.lineFields}>
                  <View style={styles.lineField}>
                    <TextField
                      label="Quantité"
                      keyboardType="numeric"
                      value={line.quantity}
                      onChangeText={(value) => updateLine(line.productId, 'quantity', value)}
                    />
                  </View>
                  <View style={styles.lineField}>
                    <TextField
                      label="Coût unitaire"
                      keyboardType="numeric"
                      value={line.unitCost}
                      onChangeText={(value) => updateLine(line.productId, 'unitCost', value)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatMoney(total, currency)}</Text>
        </View>

        <TextField
          label="Montant payé maintenant"
          placeholder={String(total)}
          keyboardType="numeric"
          value={amountPaid}
          onChangeText={setAmountPaid}
        />
        <Text style={styles.hint}>
          Laissez vide pour un paiement intégral. La différence devient une dette fournisseur.
        </Text>

        {error ? <Text style={styles.formError}>{error}</Text> : null}

        <Button
          label="Enregistrer l'achat"
          onPress={onSubmit}
          loading={createPurchase.isPending}
          disabled={lines.length === 0}
        />
      </ScrollView>

      <Modal visible={isPickerOpen} animationType="slide" transparent onRequestClose={() => setIsPickerOpen(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdrop} onPress={() => setIsPickerOpen(false)}>
            <Pressable style={styles.sheet}>
              <Text style={styles.sheetTitle}>Choisir un produit</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher..."
                placeholderTextColor={colors.textTertiary}
                style={styles.searchInput}
              />
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.option}
                    onPress={() => addProduct(item.id, item.name, item.purchase_price)}
                  >
                    <Text style={styles.optionLabel}>{item.name}</Text>
                    <Text style={styles.optionMeta}>{formatMoney(item.purchase_price, currency)}</Text>
                  </Pressable>
                )}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  addProductLabel: {
    color: colors.green,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
  linesCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  lineRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  lineName: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
  lineFields: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  lineField: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
  hint: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  formError: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.md,
    textAlign: 'center',
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
    maxHeight: '80%',
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
  optionMeta: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
  },
});
