import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { PillBadge } from '@/components/PillBadge';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { PLAN_ORDER, PLANS, SUPPORT_WHATSAPP_NUMBER } from '@/constants/plans';
import { useActiveCompanyRole, useMyMemberships } from '@/features/company/hooks';
import { useSubscriptionUsage } from '@/features/subscription/hooks';
import { useCompanyStore } from '@/stores/companyStore';
import type { PlanTier } from '@/types/database';
import { buildUpgradeRequestMessage, buildWhatsAppUrl } from '@/utils/whatsapp';

function UsageBar({ label, used, max }: { label: string; used: number; max: number | null }) {
  const ratio = max ? Math.min(used / max, 1) : 0;
  return (
    <View style={styles.usageRow}>
      <View style={styles.usageHeader}>
        <Text style={styles.usageLabel}>{label}</Text>
        <Text style={styles.usageValue}>{max === null ? `${used} · illimité` : `${used} / ${max}`}</Text>
      </View>
      {max !== null ? (
        <View style={styles.usageTrack}>
          <View style={[styles.usageFill, { width: `${ratio * 100}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

export default function SubscriptionScreen() {
  const { data: usage } = useSubscriptionUsage();
  const { data: memberships } = useMyMemberships();
  const activeCompanyId = useCompanyStore((state) => state.activeCompanyId);
  const companyName = memberships?.companies.find((c) => c.id === activeCompanyId)?.name ?? 'ma boutique';
  const role = useActiveCompanyRole();
  const isOwner = role === 'owner';

  const requestUpgrade = (targetPlan: PlanTier) => {
    const message = buildUpgradeRequestMessage(companyName, PLANS[targetPlan].label);
    Linking.openURL(buildWhatsAppUrl(SUPPORT_WHATSAPP_NUMBER, message));
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {usage ? (
          <View style={styles.usageCard}>
            <PillBadge>{PLANS[usage.plan].label.toUpperCase()}</PillBadge>
            <UsageBar label="Boutiques" used={usage.shops_used} max={usage.shops_max} />
            <UsageBar label="Produits" used={usage.products_used} max={usage.products_max} />
            {usage.purchases_max !== null ? (
              <UsageBar label="Approvisionnements" used={usage.purchases_used} max={usage.purchases_max} />
            ) : null}
            <UsageBar
              label={`Messages Comy IA (${usage.ai_period === 'day' ? 'aujourd\'hui' : 'ce mois'})`}
              used={usage.ai_used}
              max={usage.ai_max}
            />
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Formules</Text>
        {!isOwner ? (
          <Text style={styles.ownerNotice}>Seul le propriétaire de l&apos;entreprise peut changer de formule.</Text>
        ) : null}

        {PLAN_ORDER.map((tier) => {
          const plan = PLANS[tier];
          const isCurrent = usage?.plan === tier;
          return (
            <View key={tier} style={[styles.planCard, tier === 'premium' && styles.planCardHighlighted]}>
              {tier === 'premium' ? (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAIRE</Text>
                </View>
              ) : null}
              <Text style={styles.planName}>{plan.label}</Text>
              <Text style={styles.planPrice}>
                {plan.monthlyPrice === 0 ? 'Gratuit' : `${plan.monthlyPrice?.toLocaleString('fr-FR')} F/mois`}
              </Text>
              <Text style={styles.planSubtitle}>{plan.monthlySubtitle}</Text>

              <View style={styles.featureList}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={14} color={colors.gold} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {isCurrent ? (
                <Button label="Formule actuelle" variant="secondary" disabled onPress={() => {}} />
              ) : isOwner ? (
                <Button
                  label={`Passer à ${plan.label}`}
                  variant={tier === 'premium' ? 'primary' : 'secondary'}
                  onPress={() => requestUpgrade(tier)}
                />
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  usageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  usageRow: {
    gap: spacing.xs,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
  },
  usageValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  usageTrack: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundElevated,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.green,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.sm,
  },
  ownerNotice: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  planCardHighlighted: {
    borderColor: colors.gold,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  popularBadgeText: {
    color: colors.textOnLight,
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    letterSpacing: 1,
  },
  planName: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
  },
  planPrice: {
    color: colors.green,
    fontFamily: typography.fontHeadingBold,
    fontSize: 22,
    marginTop: spacing.xs,
  },
  planSubtitle: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  featureList: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
  },
});
