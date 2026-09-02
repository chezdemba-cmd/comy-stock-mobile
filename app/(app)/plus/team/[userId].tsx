import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SelectPills } from '@/components/SelectPills';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useActiveCompanyRole, useCompanyShops } from '@/features/company/hooks';
import { roleLabel, roleOptions } from '@/features/team/schemas';
import { useAssignMemberToShop, useRemoveMemberFromShop, useTeamMembers, useUpdateMemberRole } from '@/features/team/hooks';
import type { AppRole } from '@/types/database';

export default function ManageTeamMemberScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const callerRole = useActiveCompanyRole();
  const { data: shops = [] } = useCompanyShops();
  const { data: members, isLoading } = useTeamMembers();
  const updateRole = useUpdateMemberRole();
  const assignShop = useAssignMemberToShop();
  const removeShop = useRemoveMemberFromShop();
  const member = members?.find((item) => item.userId === userId);
  const [selectedRoleOverride, setSelectedRole] = useState<AppRole | null>(null);
  const [selectedShopIdsOverride, setSelectedShopIds] = useState<string[] | null>(null);
  const selectedRole = selectedRoleOverride ?? member?.role ?? null;
  const selectedShopIds = selectedShopIdsOverride ?? member?.shopIds ?? [];

  if (callerRole !== 'owner') return <ScreenContainer><ErrorState title="Accès réservé au propriétaire" /></ScreenContainer>;
  if (isLoading) return <ScreenContainer><LoadingIndicator fullScreen /></ScreenContainer>;
  if (!member || !selectedRole) return <ScreenContainer><ErrorState title="Membre introuvable" /></ScreenContainer>;

  const toggleShop = (shopId: string) => {
    setSelectedShopIds(
      selectedShopIds.includes(shopId)
        ? selectedShopIds.filter((id) => id !== shopId)
        : [...selectedShopIds, shopId],
    );
  };

  const save = async () => {
    if (selectedShopIds.length === 0) {
      Alert.alert('Affectation requise', 'Le membre doit conserver au moins une boutique.');
      return;
    }
    try {
      if (selectedRole !== member.role) await updateRole.mutateAsync({ userId: member.userId, role: selectedRole });
      for (const shopId of selectedShopIds.filter((id) => !member.shopIds.includes(id))) {
        await assignShop.mutateAsync({ userId: member.userId, shopId });
      }
      for (const shopId of member.shopIds.filter((id) => !selectedShopIds.includes(id))) {
        await removeShop.mutateAsync({ userId: member.userId, shopId });
      }
      router.back();
    } catch (error) {
      Alert.alert('Modification impossible', error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  const saving = updateRole.isPending || assignShop.isPending || removeShop.isPending;

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{member.fullName || member.email || 'Utilisateur'}</Text>
        <Text style={styles.current}>Rôle actuel : {roleLabel[member.role]}</Text>

        <SelectPills
          label="Nouveau rôle"
          options={roleOptions}
          value={selectedRole}
          onChange={(value) => setSelectedRole(value as AppRole)}
        />

        <Text style={styles.label}>Boutiques accessibles</Text>
        <View style={styles.shopList}>
          {shops.map((shop) => {
            const selected = selectedShopIds.includes(shop.id);
            return (
              <Pressable key={shop.id} style={[styles.shop, selected && styles.shopSelected]} onPress={() => toggleShop(shop.id)}>
                <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={22} color={selected ? colors.green : colors.textTertiary} />
                <View>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <Text style={styles.shopLocation}>{shop.location}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Button label="Enregistrer" onPress={save} loading={saving} style={styles.save} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.xl, paddingBottom: spacing.xxxl },
  name: { color: colors.textPrimary, fontFamily: typography.fontHeading, fontSize: typography.h3.fontSize },
  current: { color: colors.textSecondary, fontFamily: typography.fontBody, marginTop: spacing.xs, marginBottom: spacing.xl },
  label: { color: colors.textSecondary, fontFamily: typography.fontBodyMedium, fontSize: 13, marginBottom: spacing.sm },
  shopList: { gap: spacing.sm },
  shop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.button, backgroundColor: colors.surface },
  shopSelected: { borderColor: colors.green, backgroundColor: colors.greenDeepest },
  shopName: { color: colors.textPrimary, fontFamily: typography.fontBodyMedium, fontSize: 14 },
  shopLocation: { color: colors.textTertiary, fontFamily: typography.fontBody, fontSize: 12 },
  save: { marginTop: spacing.xl },
});
