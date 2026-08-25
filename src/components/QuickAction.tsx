import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={20} color={colors.gold} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 76,
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
});
