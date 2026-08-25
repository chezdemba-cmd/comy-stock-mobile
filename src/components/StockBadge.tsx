import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';
import type { StockStatus } from '@/features/products/stockStatus';

const LABEL: Record<StockStatus, string> = {
  available: 'Disponible',
  low: 'Stock faible',
  outOfStock: 'Rupture',
};

const COLOR: Record<StockStatus, string> = {
  available: colors.green,
  low: colors.warning,
  outOfStock: colors.danger,
};

export function StockBadge({ status }: { status: StockStatus }) {
  const color = COLOR[status];
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}26` }]}>
      <Text style={[styles.label, { color }]}>{LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
  },
});
