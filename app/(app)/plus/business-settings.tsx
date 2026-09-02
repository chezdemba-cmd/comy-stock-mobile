import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SelectPills } from '@/components/SelectPills';
import { TextField } from '@/components/TextField';
import { colors, spacing, typography } from '@/constants/theme';
import { businessTypeOptions, currencyOptions } from '@/features/company/schemas';
import { useActiveCompanyRole, useMyMemberships, useUpdateCompanySettings, useUpdateShopSettings } from '@/features/company/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCompanyStore } from '@/stores/companyStore';
import type { AppRole, Company, Shop } from '@/types/database';

function BusinessSettingsForm({ company, shop, role }: { company: Company; shop: Shop; role: AppRole | null }) {
  const updateCompany = useUpdateCompanySettings();
  const updateShop = useUpdateShopSettings();
  const { isOnline } = useNetworkStatus();
  const [companyForm, setCompanyForm] = useState({
    name: company.name, country: company.country, city: company.city,
    currency: company.currency, businessType: company.business_type,
  });
  const [shopForm, setShopForm] = useState({
    name: shop.name, location: shop.location, phone: shop.phone, address: shop.address ?? '',
  });

  const requireOnline = () => {
    if (isOnline) return true;
    Alert.alert('Connexion requise', 'Reconnectez-vous pour modifier ces informations.');
    return false;
  };
  const saveCompany = async () => {
    if (!requireOnline()) return;
    try {
      await updateCompany.mutateAsync(companyForm);
      Alert.alert('Entreprise mise à jour');
    } catch (error) {
      Alert.alert('Modification impossible', error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };
  const saveShop = async () => {
    if (!requireOnline()) return;
    try {
      await updateShop.mutateAsync(shopForm);
      Alert.alert('Boutique mise à jour');
    } catch (error) {
      Alert.alert('Modification impossible', error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {role === 'owner' ? (
          <>
            <Text style={styles.title}>Entreprise</Text>
            <TextField label="Nom du commerce" value={companyForm.name} onChangeText={(name) => setCompanyForm({ ...companyForm, name })} />
            <TextField label="Pays" value={companyForm.country} onChangeText={(country) => setCompanyForm({ ...companyForm, country })} />
            <TextField label="Ville" value={companyForm.city} onChangeText={(city) => setCompanyForm({ ...companyForm, city })} />
            <SelectPills label="Devise" options={currencyOptions} value={companyForm.currency || null} onChange={(currency) => setCompanyForm({ ...companyForm, currency })} />
            <SelectPills label="Type d'activité" options={businessTypeOptions} value={companyForm.businessType || null} onChange={(businessType) => setCompanyForm({ ...companyForm, businessType })} />
            <Button label="Enregistrer l'entreprise" onPress={saveCompany} loading={updateCompany.isPending} />
          </>
        ) : null}
        <Text style={[styles.title, role === 'owner' && styles.shopTitle]}>Boutique active</Text>
        <TextField label="Nom" value={shopForm.name} onChangeText={(name) => setShopForm({ ...shopForm, name })} />
        <TextField label="Localisation" value={shopForm.location} onChangeText={(location) => setShopForm({ ...shopForm, location })} />
        <TextField label="Téléphone" keyboardType="phone-pad" value={shopForm.phone} onChangeText={(phone) => setShopForm({ ...shopForm, phone })} />
        <TextField label="Adresse" value={shopForm.address} onChangeText={(address) => setShopForm({ ...shopForm, address })} />
        <Button label="Enregistrer la boutique" onPress={saveShop} loading={updateShop.isPending} />
      </ScrollView>
    </ScreenContainer>
  );
}

export default function BusinessSettingsScreen() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  const shopId = useCompanyStore((state) => state.activeShopId);
  const role = useActiveCompanyRole();
  const { data: memberships, isLoading } = useMyMemberships();
  const company = memberships?.companies.find((item) => item.id === companyId);
  const shop = memberships?.shops.find((item) => item.id === shopId);
  if (isLoading || !company || !shop) return <ScreenContainer><LoadingIndicator fullScreen /></ScreenContainer>;
  return <BusinessSettingsForm key={`${company.updated_at}-${shop.updated_at}`} company={company} shop={shop} role={role} />;
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.xl, paddingBottom: spacing.xxxl },
  title: { color: colors.textPrimary, fontFamily: typography.fontHeading, fontSize: typography.h3.fontSize, marginBottom: spacing.lg },
  shopTitle: { marginTop: spacing.xxxl },
});
