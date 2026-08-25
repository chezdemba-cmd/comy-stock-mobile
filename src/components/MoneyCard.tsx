import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, shadows, spacing, typography } from '@/constants/theme';
import { formatMoney } from '@/utils/money';

interface MoneyCardProps {
  label: string;
  amount: number;
  currency: string;
  variationPercent: number;
  footer?: string;
}

export function MoneyCard({ label, amount, currency, variationPercent, footer }: MoneyCardProps) {
  const isPositive = variationPercent >= 0;

  return (
    <LinearGradient
      colors={[colors.surfaceHighlightStart, colors.surfaceHighlightEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.card]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount}>{formatMoney(amount, currency)}</Text>
      <View style={styles.footerRow}>
        <View style={[styles.badge, isPositive ? styles.badgePositive : styles.badgeNegative]}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={isPositive ? colors.green : colors.danger}
          />
          <Text style={[styles.badgeLabel, { color: isPositive ? colors.green : colors.danger }]}>
            {Math.abs(variationPercent)}% vs hier
          </Text>
        </View>
        {footer ? <Text style={styles.footerText}>{footer}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.block,
    borderWidth: 1,
    borderColor: colors.borderPremium,
    padding: spacing.xl,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  amount: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgePositive: {
    backgroundColor: 'rgba(47,168,92,0.15)',
  },
  badgeNegative: {
    backgroundColor: 'rgba(229,72,77,0.15)',
  },
  badgeLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
  },
  footerText: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
  },
});
