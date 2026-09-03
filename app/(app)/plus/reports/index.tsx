import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { RevenueBarChart } from '@/components/RevenueBarChart';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useDailyRevenue, useSalesSummary } from '@/features/reports/hooks';
import { getPeriodRange, periodPresetOptions, type DateRange, type PeriodPreset } from '@/features/reports/periods';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney, formatNumber } from '@/utils/money';

export default function ReportsScreen() {
  const [preset, setPreset] = useState<PeriodPreset | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range: DateRange = useMemo(() => {
    if (preset === 'custom') {
      return { from: customFrom || getPeriodRange('today').from, to: customTo || getPeriodRange('today').to };
    }
    return getPeriodRange(preset);
  }, [preset, customFrom, customTo]);

  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const activeCompany = memberships?.companies.find((company) => company.id === activeCompanyId);
  const currency = activeCompany?.currency ?? 'XOF';

  const { data: summary } = useSalesSummary(range);
  const { data: dailyRevenue = [] } = useDailyRevenue(range);

  if (activeCompany?.plan === 'free') {
    return (
      <ScreenContainer edges={['bottom']} centered>
        <EmptyState
          title="Rapports disponibles à partir de la formule Premium"
          description="Passez à une formule supérieure pour accéder aux rapports détaillés de votre boutique."
        />
        <Button label="Voir les formules" onPress={() => router.push('/(app)/plus/subscription')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.periodRow}>
          {periodPresetOptions.map((option) => {
            const active = preset === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.periodChip, active && styles.periodChipActive]}
                onPress={() => setPreset(option.value)}
              >
                <Text style={[styles.periodChipLabel, active && styles.periodChipLabelActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.periodChip, preset === 'custom' && styles.periodChipActive]}
            onPress={() => setPreset('custom')}
          >
            <Text style={[styles.periodChipLabel, preset === 'custom' && styles.periodChipLabelActive]}>
              Personnalisée
            </Text>
          </Pressable>
        </View>

        {preset === 'custom' ? (
          <View style={styles.customRow}>
            <View style={styles.customField}>
              <TextField label="Du (AAAA-MM-JJ)" placeholder="2026-08-01" value={customFrom} onChangeText={setCustomFrom} />
            </View>
            <View style={styles.customField}>
              <TextField label="Au (AAAA-MM-JJ)" placeholder="2026-08-25" value={customTo} onChangeText={setCustomTo} />
            </View>
          </View>
        ) : null}

        <View style={styles.summaryGrid}>
          <SummaryTile label="Chiffre d'affaires" value={formatMoney(summary?.revenue ?? 0, currency)} />
          <SummaryTile label="Bénéfice brut" value={formatMoney(summary?.gross_profit ?? 0, currency)} />
          <SummaryTile label="Dépenses" value={formatMoney(summary?.expenses_total ?? 0, currency)} tone="danger" />
          <SummaryTile
            label="Bénéfice net"
            value={formatMoney(summary?.net_profit ?? 0, currency)}
            tone={(summary?.net_profit ?? 0) >= 0 ? 'success' : 'danger'}
          />
          <SummaryTile label="Ventes" value={formatNumber(summary?.sales_count ?? 0)} />
          <SummaryTile label="Panier moyen" value={formatMoney(summary?.average_basket ?? 0, currency)} />
        </View>

        <Text style={styles.sectionTitle}>Chiffre d&apos;affaires par jour</Text>
        <RevenueBarChart data={dailyRevenue} />

        <View style={styles.linksRow}>
          <Pressable
            style={styles.linkCard}
            onPress={() =>
              router.push({ pathname: '/(app)/plus/reports/products', params: { from: range.from, to: range.to } })
            }
          >
            <Ionicons name="cube-outline" size={18} color={colors.green} />
            <Text style={styles.linkLabel}>Rapport produits</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
          <Pressable
            style={styles.linkCard}
            onPress={() =>
              router.push({ pathname: '/(app)/plus/reports/employees', params: { from: range.from, to: range.to } })
            }
          >
            <Ionicons name="people-outline" size={18} color={colors.green} />
            <Text style={styles.linkLabel}>Rapport employés</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SummaryTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'danger';
}) {
  const color = tone === 'success' ? colors.green : tone === 'danger' ? colors.danger : colors.textPrimary;
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  periodChipActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenDeepest,
  },
  periodChipLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
  },
  periodChipLabelActive: {
    color: colors.textPrimary,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  customField: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  tileLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  tileValue: {
    fontFamily: typography.fontHeading,
    fontSize: 17,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.md,
  },
  linksRow: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  linkLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
});
