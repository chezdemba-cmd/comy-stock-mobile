import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { PillBadge } from '@/components/PillBadge';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PLAN_ORDER, PLANS } from '@/constants/plans';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useActiveCompanyRole, useMyMemberships } from '@/features/company/hooks';
import { useCreateSubscriptionCheckout, useLatestSubscriptionPayment, useSubscriptionUsage } from '@/features/subscription/hooks';
import { useCompanyStore } from '@/stores/companyStore';
import type { PlanTier, SubscriptionBillingCycle, SubscriptionPaymentProvider } from '@/types/database';
import { formatMoney, formatNumber } from '@/utils/money';

const PROVIDERS: { id: SubscriptionPaymentProvider; label: string; color: string }[] = [
  { id: 'wave', label: 'Wave', color: '#1dc4f4' },
  { id: 'orange_money', label: 'Orange Money', color: '#ff7900' },
  { id: 'moov_money', label: 'Moov Money', color: '#72bf44' },
];

function UsageBar({ label, used, max }: { label: string; used: number; max: number | null }) {
  const ratio = max ? Math.min(used / max, 1) : 0;
  return <View style={styles.usageRow}>
    <View style={styles.usageHeader}><Text style={styles.usageLabel}>{label}</Text><Text style={styles.usageValue}>{max === null ? `${formatNumber(used)} · illimité` : `${formatNumber(used)} / ${formatNumber(max)}`}</Text></View>
    {max !== null ? <View style={styles.usageTrack}><View style={[styles.usageFill, { width: `${ratio * 100}%` }]} /></View> : null}
  </View>;
}

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Exclude<PlanTier, 'free'> | null>(null);
  const [cycle, setCycle] = useState<SubscriptionBillingCycle>('monthly');
  const { data: usage } = useSubscriptionUsage();
  const { data: latestPayment } = useLatestSubscriptionPayment();
  const checkout = useCreateSubscriptionCheckout();
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const company = memberships?.companies.find((item) => item.id === activeCompanyId);
  const isOwner = useActiveCompanyRole() === 'owner';

  const startPayment = async (provider: SubscriptionPaymentProvider) => {
    if (!activeCompanyId || !selectedPlan) return;
    try {
      const result = await checkout.mutateAsync({ companyId: activeCompanyId, plan: selectedPlan, cycle, provider });
      setSelectedPlan(null);
      await Linking.openURL(result.checkoutUrl);
    } catch (error) {
      Alert.alert('Paiement indisponible', error instanceof Error ? error.message : 'Veuillez réessayer plus tard.');
    }
  };

  return <ScreenContainer edges={['bottom']}>
    <ScrollView contentContainerStyle={styles.scroll}>
      {usage ? <View style={styles.usageCard}>
        <PillBadge>{PLANS[usage.plan].label.toUpperCase()}</PillBadge>
        <UsageBar label="Boutiques" used={usage.shops_used} max={usage.shops_max} />
        <UsageBar label="Produits" used={usage.products_used} max={usage.products_max} />
        {usage.purchases_max !== null ? <UsageBar label="Approvisionnements" used={usage.purchases_used} max={usage.purchases_max} /> : null}
        <UsageBar label={`Messages Comy IA (${usage.ai_period === 'day' ? "aujourd'hui" : 'ce mois'})`} used={usage.ai_used} max={usage.ai_max} />
      </View> : null}

      {latestPayment?.status === 'processing' ? <View style={styles.paymentNotice}>
        <Ionicons name="time-outline" size={20} color={colors.warning} />
        <Text style={styles.paymentNoticeText}>Paiement {PROVIDERS.find((item) => item.id === latestPayment.provider)?.label} en attente de confirmation.</Text>
      </View> : null}

      <Text style={styles.sectionTitle}>Formules</Text>
      {!isOwner ? <Text style={styles.ownerNotice}>Seul le propriétaire de l&apos;entreprise peut changer de formule.</Text> : null}
      {PLAN_ORDER.map((tier) => {
        const plan = PLANS[tier];
        const isCurrent = usage?.plan === tier;
        return <View key={tier} style={[styles.planCard, tier === 'premium' && styles.planCardHighlighted]}>
          {tier === 'premium' ? <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>POPULAIRE</Text></View> : null}
          <Text style={styles.planName}>{plan.label}</Text>
          <Text style={styles.planPrice}>{plan.monthlyPrice === 0 ? 'Gratuit' : `${formatNumber(plan.monthlyPrice ?? 0)} F/mois`}</Text>
          <Text style={styles.planSubtitle}>{plan.monthlySubtitle}</Text>
          <View style={styles.featureList}>{plan.features.map((feature) => <View key={feature} style={styles.featureRow}><Ionicons name="checkmark" size={14} color={colors.gold} /><Text style={styles.featureText}>{feature}</Text></View>)}</View>
          {isCurrent ? <Button label="Formule actuelle" variant="secondary" disabled onPress={() => {}} /> : isOwner && tier !== 'free' ? <Button label={`Passer à ${plan.label}`} variant={tier === 'premium' ? 'primary' : 'secondary'} onPress={() => setSelectedPlan(tier)} /> : null}
        </View>;
      })}
    </ScrollView>

    <Modal visible={selectedPlan !== null} animationType="slide" transparent onRequestClose={() => setSelectedPlan(null)}>
      <View style={styles.modalBackdrop}><View style={styles.paymentSheet}>
        <View style={styles.sheetHeader}>
          <View><Text style={styles.sheetTitle}>Choisir le paiement</Text><Text style={styles.sheetSubtitle}>{company?.name ?? 'Votre entreprise'} · {selectedPlan ? PLANS[selectedPlan].label : ''}</Text></View>
          <Pressable onPress={() => setSelectedPlan(null)}><Ionicons name="close" size={26} color={colors.textPrimary} /></Pressable>
        </View>
        <View style={styles.cycleRow}>{(['monthly', 'yearly'] as const).map((item) => <Pressable key={item} onPress={() => setCycle(item)} style={[styles.cycleButton, cycle === item && styles.cycleButtonActive]}><Text style={[styles.cycleText, cycle === item && styles.cycleTextActive]}>{item === 'monthly' ? 'Mensuel' : 'Annuel (-10 %)'}</Text></Pressable>)}</View>
        {selectedPlan ? <Text style={styles.checkoutAmount}>{formatMoney(cycle === 'monthly' ? PLANS[selectedPlan].monthlyPrice ?? 0 : PLANS[selectedPlan].yearlyPrice ?? 0, 'XOF')}</Text> : null}
        <Text style={styles.providerHelp}>Vous serez dirigé vers la page sécurisée de l&apos;opérateur. La formule sera activée après confirmation du paiement.</Text>
        {PROVIDERS.map((provider) => <Pressable key={provider.id} disabled={checkout.isPending} onPress={() => startPayment(provider.id)} style={styles.providerButton}><View style={[styles.providerMark, { backgroundColor: provider.color }]} /><Text style={styles.providerLabel}>Payer avec {provider.label}</Text><Ionicons name="chevron-forward" size={20} color={colors.textTertiary} /></Pressable>)}
      </View></View>
    </Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.lg, paddingBottom: spacing.xxxl },
  usageCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.xl, gap: spacing.md },
  usageRow: { gap: spacing.xs }, usageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  usageLabel: { color: colors.textSecondary, fontFamily: typography.fontBody, fontSize: 13 }, usageValue: { color: colors.textPrimary, fontFamily: typography.fontBodyMedium, fontSize: 13 },
  usageTrack: { height: 6, borderRadius: radii.pill, backgroundColor: colors.backgroundElevated, overflow: 'hidden' }, usageFill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.green },
  paymentNotice: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.warning, padding: spacing.lg, marginBottom: spacing.lg },
  paymentNoticeText: { flex: 1, color: colors.textSecondary, fontFamily: typography.fontBody, fontSize: 13 },
  sectionTitle: { color: colors.textPrimary, fontFamily: typography.fontHeading, fontSize: typography.h3.fontSize, marginBottom: spacing.sm }, ownerNotice: { color: colors.textTertiary, fontFamily: typography.fontBody, fontSize: 12, marginBottom: spacing.md },
  planCard: { backgroundColor: colors.surface, borderRadius: radii.cardLarge, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, marginBottom: spacing.lg, gap: spacing.xs }, planCardHighlighted: { borderColor: colors.gold },
  popularBadge: { alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 2, marginBottom: spacing.xs }, popularBadgeText: { color: colors.textOnLight, fontFamily: typography.fontBodyMedium, fontSize: 10, letterSpacing: 1 },
  planName: { color: colors.textPrimary, fontFamily: typography.fontHeading, fontSize: typography.h3.fontSize }, planPrice: { color: colors.green, fontFamily: typography.fontHeadingBold, fontSize: 22, marginTop: spacing.xs }, planSubtitle: { color: colors.textTertiary, fontFamily: typography.fontBody, fontSize: 12, marginBottom: spacing.md },
  featureList: { gap: spacing.xs, marginBottom: spacing.lg }, featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, featureText: { color: colors.textSecondary, fontFamily: typography.fontBody, fontSize: 13 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }, paymentSheet: { backgroundColor: colors.backgroundElevated, borderTopLeftRadius: radii.block, borderTopRightRadius: radii.block, padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, sheetTitle: { color: colors.textPrimary, fontFamily: typography.fontHeading, fontSize: 20 }, sheetSubtitle: { color: colors.textTertiary, fontFamily: typography.fontBody, fontSize: 13 },
  cycleRow: { flexDirection: 'row', gap: spacing.sm }, cycleButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.button, padding: spacing.md, alignItems: 'center' }, cycleButtonActive: { backgroundColor: colors.greenDeep, borderColor: colors.green }, cycleText: { color: colors.textSecondary, fontFamily: typography.fontBodyMedium }, cycleTextActive: { color: colors.textPrimary },
  checkoutAmount: { color: colors.gold, fontFamily: typography.fontHeadingBold, fontSize: 26, textAlign: 'center', marginVertical: spacing.sm }, providerHelp: { color: colors.textTertiary, fontFamily: typography.fontBody, fontSize: 12, lineHeight: 18 },
  providerButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.button, padding: spacing.lg, backgroundColor: colors.surface }, providerMark: { width: 14, height: 14, borderRadius: 7 }, providerLabel: { flex: 1, color: colors.textPrimary, fontFamily: typography.fontHeading, fontSize: 15 },
});
