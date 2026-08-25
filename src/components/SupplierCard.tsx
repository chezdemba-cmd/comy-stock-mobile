import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';
import type { Supplier } from '@/types/database';
import { formatMoney } from '@/utils/money';

interface SupplierCardProps {
  supplier: Supplier;
  outstandingDebt: number;
  currency: string;
  onPress: () => void;
}

export function SupplierCard({ supplier, outstandingDebt, currency, onPress }: SupplierCardProps) {
  const initial = supplier.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{initial}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {supplier.name}
        </Text>
        {supplier.phone ? (
          <Text style={styles.phone} numberOfLines={1}>
            {supplier.phone}
          </Text>
        ) : null}
      </View>

      {outstandingDebt > 0 ? (
        <View style={styles.debtBadge}>
          <Text style={styles.debtLabel}>{formatMoney(outstandingDebt, currency)}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.greenDeepest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 15,
  },
  phone: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginTop: 2,
  },
  debtBadge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: 'rgba(232,196,106,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  debtLabel: {
    color: colors.warning,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
  },
});
