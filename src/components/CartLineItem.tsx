import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';
import type { CartItem } from '@/stores/cartStore';
import { formatMoney } from '@/utils/money';

interface CartLineItemProps {
  item: CartItem;
  currency: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartLineItem({ item, currency, onIncrement, onDecrement, onRemove }: CartLineItemProps) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.unitPrice}>{formatMoney(item.unitPrice, currency)} / unité</Text>
      </View>

      <View style={styles.stepper}>
        <Pressable style={styles.stepButton} onPress={onDecrement}>
          <Ionicons name="remove" size={16} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Pressable style={styles.stepButton} onPress={onIncrement}>
          <Ionicons name="add" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Text style={styles.lineTotal}>{formatMoney(item.unitPrice * item.quantity, currency)}</Text>

      <Pressable onPress={onRemove} style={styles.removeButton}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
      </Pressable>
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
    gap: spacing.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
  unitPrice: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 11,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: radii.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
    minWidth: 18,
    textAlign: 'center',
  },
  lineTotal: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    minWidth: 70,
    textAlign: 'right',
  },
  removeButton: {
    padding: spacing.xs,
  },
});
