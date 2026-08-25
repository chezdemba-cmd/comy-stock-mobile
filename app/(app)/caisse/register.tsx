import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useAddCashMovement, useOpenSession } from '@/features/pos/hooks';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';

export default function RegisterScreen() {
  const { data: session } = useOpenSession();
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const addMovement = useAddCashMovement();
  const [movementType, setMovementType] = useState<'in' | 'out'>('out');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  if (!session) {
    return (
      <ScreenContainer edges={['bottom']}>
        <EmptyState title="Aucune caisse ouverte" description="Ouvrez la caisse depuis l'onglet Caisse." />
      </ScreenContainer>
    );
  }

  const submitMovement = async () => {
    const value = Number(amount);
    if (!value) return;
    await addMovement.mutateAsync({ sessionId: session.id, type: movementType, amount: value, reason });
    setAmount('');
    setReason('');
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.label}>Ouverte le</Text>
          <Text style={styles.value}>{new Date(session.opened_at).toLocaleString('fr-FR')}</Text>
          <Text style={styles.label}>Montant initial</Text>
          <Text style={styles.value}>{formatMoney(session.opening_amount, currency)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Mouvement de caisse</Text>
        <View style={styles.typeRow}>
          <Button
            label="Sortie"
            variant={movementType === 'out' ? 'primary' : 'secondary'}
            onPress={() => setMovementType('out')}
            style={styles.typeButton}
          />
          <Button
            label="Entrée"
            variant={movementType === 'in' ? 'primary' : 'secondary'}
            onPress={() => setMovementType('in')}
            style={styles.typeButton}
          />
        </View>
        <TextField label="Montant" placeholder="0" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <TextField label="Raison" placeholder="Ex. Achat de sachets" value={reason} onChangeText={setReason} />
        <Button
          label="Enregistrer le mouvement"
          variant="secondary"
          onPress={submitMovement}
          loading={addMovement.isPending}
          style={styles.movementSubmit}
        />

        <Button label="Clôturer la caisse" onPress={() => router.push('/(app)/caisse/closing')} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 12,
  },
  value: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
  },
  movementSubmit: {
    marginBottom: spacing.xxl,
  },
});
