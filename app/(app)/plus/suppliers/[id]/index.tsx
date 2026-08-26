import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { ListRow } from '@/components/ListRow';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import {
  usePaySupplierDebt,
  useSupplier,
  useSupplierDebtSummary,
  useSupplierStats,
} from '@/features/suppliers/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCompanyStore } from '@/stores/companyStore';
import { buildDebtReminderMessage, buildWhatsAppUrl } from '@/utils/whatsapp';
import { formatMoney } from '@/utils/money';

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: supplier, isLoading, isError, refetch } = useSupplier(id);
  const { data: stats } = useSupplierStats(id);
  const { data: debtSummary } = useSupplierDebtSummary(id);
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const payDebt = usePaySupplierDebt(id as string);
  const { isOnline } = useNetworkStatus();
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <ScreenContainer edges={['bottom']}>
        <LoadingIndicator fullScreen />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ErrorState onRetry={() => refetch()} />
      </ScreenContainer>
    );
  }

  if (!supplier) return null;

  const outstanding = debtSummary?.totalOutstanding ?? 0;
  const whatsappNumber = supplier.whatsapp || supplier.phone;

  const submitPayment = async () => {
    setPayError(null);
    const value = Number(payAmount);
    if (!value || value <= 0) return;
    try {
      if (!isOnline) throw new Error('Connexion requise pour cette action.');
      await payDebt.mutateAsync(value);
      setIsPayOpen(false);
      setPayAmount('');
    } catch (error) {
      setPayError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  const onRemind = () => {
    if (!whatsappNumber) return;
    const message = buildDebtReminderMessage(supplier.name, formatMoney(outstanding, currency), 'notre boutique');
    Linking.openURL(buildWhatsAppUrl(whatsappNumber, message));
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{supplier.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{supplier.name}</Text>
            {supplier.phone ? <Text style={styles.meta}>{supplier.phone}</Text> : null}
            {supplier.email ? <Text style={styles.meta}>{supplier.email}</Text> : null}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total achats</Text>
            <Text style={styles.statValue}>{formatMoney(stats?.totalPurchases ?? 0, currency)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Commandes</Text>
            <Text style={styles.statValue}>{stats?.purchaseCount ?? 0}</Text>
          </View>
        </View>

        {stats && stats.suppliedProductNames.length > 0 ? (
          <Text style={styles.suppliedProducts}>
            Produits fournis : {stats.suppliedProductNames.join(', ')}
          </Text>
        ) : null}

        <View style={styles.debtCard}>
          <Text style={styles.debtLabel}>Dette actuelle</Text>
          <Text style={[styles.debtValue, { color: outstanding > 0 ? colors.warning : colors.green }]}>
            {formatMoney(outstanding, currency)}
          </Text>
          {outstanding > 0 ? (
            <View style={styles.debtActions}>
              <Button
                label="Enregistrer un paiement"
                onPress={() => setIsPayOpen(true)}
                style={styles.debtActionButton}
              />
              {whatsappNumber ? (
                <Button
                  label="Relancer sur WhatsApp"
                  variant="secondary"
                  onPress={onRemind}
                  style={styles.debtActionButton}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <Button
            label="Nouvel achat"
            onPress={() => router.push(`/(app)/plus/suppliers/${supplier.id}/purchase`)}
            style={styles.actionButton}
          />
          <Button
            label="Modifier"
            variant="secondary"
            onPress={() => router.push(`/(app)/plus/suppliers/${supplier.id}/edit`)}
            style={styles.actionButton}
          />
        </View>

        {debtSummary && debtSummary.payments.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Historique des paiements</Text>
            <View style={styles.listCard}>
              {debtSummary.payments.map((payment) => (
                <ListRow
                  key={payment.id}
                  icon="checkmark-circle"
                  iconTone="success"
                  title={formatMoney(payment.amount, currency)}
                  subtitle={new Date(payment.paid_at).toLocaleDateString('fr-FR')}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <Modal visible={isPayOpen} animationType="slide" transparent onRequestClose={() => setIsPayOpen(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdrop} onPress={() => setIsPayOpen(false)}>
            <Pressable style={styles.sheet}>
              <Text style={styles.sheetTitle}>Enregistrer un paiement</Text>
              <Text style={styles.sheetSubtitle}>Solde dû : {formatMoney(outstanding, currency)}</Text>
              <TextField
                label="Montant payé"
                placeholder="0"
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
              />
              {payError ? <Text style={styles.formError}>{payError}</Text> : null}
              <Button label="Valider" onPress={submitPayment} loading={payDebt.isPending} />
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
  headerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.greenDeepest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
  },
  meta: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
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
    fontSize: 17,
  },
  suppliedProducts: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  debtCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  debtLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  debtValue: {
    fontFamily: typography.fontHeading,
    fontSize: 22,
    marginBottom: spacing.md,
  },
  debtActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  debtActionButton: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
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
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.xs,
  },
  sheetSubtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  formError: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.md,
  },
});
