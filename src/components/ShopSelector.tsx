import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { useMyMemberships } from '@/features/company/hooks';
import { useCompanyStore } from '@/stores/companyStore';

export function ShopSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useMyMemberships();
  const activeShopId = useCompanyStore((state) => state.activeShopId);
  const setActiveShop = useCompanyStore((state) => state.setActiveShop);
  const setActiveCompany = useCompanyStore((state) => state.setActiveCompany);

  const shops = data?.shops ?? [];
  const activeShop = shops.find((shop) => shop.id === activeShopId) ?? shops[0];

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setIsOpen(true)}>
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {activeShop?.name ?? '—'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={isOpen} animationType="fade" transparent onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Mes boutiques</Text>
            <FlatList
              data={shops}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.id === activeShop?.id && styles.optionActive]}
                  onPress={() => {
                    setActiveShop(item.id);
                    setActiveCompany(item.company_id);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.optionLabel}>{item.name}</Text>
                  {item.id === activeShop?.id ? (
                    <Ionicons name="checkmark" size={18} color={colors.green} />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    maxWidth: 220,
  },
  triggerLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
    flexShrink: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.block,
    borderTopRightRadius: radii.block,
    padding: spacing.xl,
    maxHeight: '60%',
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionActive: {
    opacity: 1,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 15,
  },
});
