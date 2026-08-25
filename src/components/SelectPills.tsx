import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

export interface SelectPillOption {
  value: string;
  label: string;
}

interface SelectPillsProps {
  label: string;
  options: SelectPillOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
}

export function SelectPills({ label, options, value, onChange, error }: SelectPillsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pillSelected: {
    borderColor: colors.green,
    backgroundColor: colors.greenDeepest,
  },
  pillLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  pillLabelSelected: {
    color: colors.textPrimary,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});
