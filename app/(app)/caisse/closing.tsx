import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useCloseCashSession, useOpenSession } from '@/features/pos/hooks';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney } from '@/utils/money';
import type { CashRegisterSession } from '@/types/database';

export default function ClosingScreen() {
  const { data: session } = useOpenSession();
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const currency =
    memberships?.companies.find((company) => company.id === activeCompanyId)?.currency ?? 'XOF';

  const closeSession = useCloseCashSession();
  const [closingReal, setClosingReal] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<CashRegisterSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!session && !result) {
    return null;
  }

  const onSubmit = async () => {
    if (!session) return;
    setError(null);
    try {
      const closed = await closeSession.mutateAsync({
        sessionId: session.id,
        closingReal: Number(closingReal) || 0,
        notes,
      });
      setResult(closed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  if (result) {
    return (
      <ScreenContainer edges={['bottom']} centered>
        <Text style={styles.resultTitle}>Caisse clôturée</Text>
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Théorique</Text>
            <Text style={styles.resultValue}>{formatMoney(result.closing_theoretical ?? 0, currency)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Réel</Text>
            <Text style={styles.resultValue}>{formatMoney(result.closing_real ?? 0, currency)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Écart</Text>
            <Text
              style={[
                styles.resultValue,
                { color: (result.difference ?? 0) === 0 ? colors.green : colors.danger },
              ]}
            >
              {formatMoney(result.difference ?? 0, currency)}
            </Text>
          </View>
        </View>
        <Button label="Retour à la caisse" onPress={() => router.replace('/(app)/caisse')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Comptez l&apos;argent présent dans la caisse.</Text>
        <TextField
          label="Montant réel compté"
          placeholder="0"
          keyboardType="numeric"
          value={closingReal}
          onChangeText={setClosingReal}
        />
        <TextField label="Notes (facultatif)" placeholder="Ex. Écart dû à..." value={notes} onChangeText={setNotes} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Confirmer la clôture" onPress={onSubmit} loading={closeSession.isPending} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.xl,
  },
  title: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h2.fontSize,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    width: '100%',
    gap: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
  },
  resultValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: 16,
  },
});
