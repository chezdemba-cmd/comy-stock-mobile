import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/theme';

export function PillBadge({ children }: PropsWithChildren) {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  text: {
    color: colors.gold,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    letterSpacing: 1,
  },
});
