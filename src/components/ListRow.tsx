import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';

type Tone = 'default' | 'success' | 'warning' | 'danger';

const TONE_COLOR: Record<Tone, string> = {
  default: colors.textPrimary,
  success: colors.green,
  warning: colors.warning,
  danger: colors.danger,
};

interface ListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconTone?: Tone;
  title: string;
  subtitle?: string;
  trailingTop?: string;
  trailingBottom?: string;
  trailingTone?: Tone;
}

export function ListRow({
  icon,
  iconTone = 'default',
  title,
  subtitle,
  trailingTop,
  trailingBottom,
  trailingTone = 'default',
}: ListRowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrapper, { borderColor: TONE_COLOR[iconTone] }]}>
        <Ionicons name={icon} size={16} color={TONE_COLOR[iconTone]} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailingTop || trailingBottom ? (
        <View style={styles.trailing}>
          {trailingTop ? (
            <Text style={[styles.trailingTop, { color: TONE_COLOR[trailingTone] }]}>{trailingTop}</Text>
          ) : null}
          {trailingBottom ? <Text style={styles.trailingBottom}>{trailingBottom}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: radii.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginTop: 2,
  },
  trailing: {
    alignItems: 'flex-end',
  },
  trailingTop: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
  trailingBottom: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 11,
    marginTop: 2,
  },
});
