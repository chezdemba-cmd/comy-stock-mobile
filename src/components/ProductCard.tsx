import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { getStockStatus } from '@/features/products/stockStatus';
import type { ProductWithStock } from '@/features/products/api';
import { formatMoney } from '@/utils/money';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: ProductWithStock;
  currency: string;
  onPress: () => void;
}

export function ProductCard({ product, currency, onPress }: ProductCardProps) {
  const status = getStockStatus(product.quantity, product.stock_min);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {product.photo_url ? (
        <Image source={{ uri: product.photo_url }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="cube-outline" size={22} color={colors.textTertiary} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        {product.sku ? (
          <Text style={styles.sku} numberOfLines={1}>
            {product.sku}
          </Text>
        ) : null}
        <Text style={styles.price}>{formatMoney(product.sale_price, currency)}</Text>
      </View>

      <View style={styles.trailing}>
        <StockBadge status={status} />
        <Text style={styles.quantity}>
          {product.quantity} {product.unit}
        </Text>
      </View>
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
  photo: {
    width: 52,
    height: 52,
    borderRadius: radii.button,
  },
  photoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radii.button,
    backgroundColor: colors.greenDeepest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 15,
  },
  sku: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
  },
  price: {
    color: colors.green,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    marginTop: 2,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  quantity: {
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 11,
  },
});
