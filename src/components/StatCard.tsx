import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'danger';
}

export function StatCard({ icon, label, value, tone = 'default' }: StatCardProps) {
  const valueColor =
    tone === 'warning' ? colors.warning : tone === 'danger' ? colors.danger : colors.textPrimary;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={16} color={colors.green} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radii.button,
    backgroundColor: colors.greenDeepest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  value: {
    fontFamily: typography.fontHeading,
    fontSize: 20,
  },
});
