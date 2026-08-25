import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';
import type { DailyRevenueRow } from '@/types/database';

interface RevenueBarChartProps {
  data: DailyRevenueRow[];
}

const CHART_HEIGHT = 120;

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  if (data.length === 0) {
    return null;
  }

  const maxRevenue = Math.max(...data.map((row) => row.revenue), 1);

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {data.map((row) => {
          const height = Math.max((row.revenue / maxRevenue) * CHART_HEIGHT, 4);
          const day = new Date(row.sale_date).toLocaleDateString('fr-FR', { weekday: 'short' });
          return (
            <View key={row.sale_date} style={styles.barColumn}>
              <View style={[styles.bar, { height }]} />
              <Text style={styles.barLabel} numberOfLines={1}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: CHART_HEIGHT + 20,
    gap: spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_HEIGHT + 20,
  },
  bar: {
    width: '60%',
    backgroundColor: colors.green,
    borderRadius: radii.button / 2,
    minHeight: 4,
  },
  barLabel: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 10,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
});
