import { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useMyMemberships } from '@/features/company/hooks';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCompanyStore } from '@/stores/companyStore';

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.green} />
    </View>
  );
}

export default function RootIndex() {
  const session = useAuthStore((state) => state.session);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const activeShopId = useCompanyStore((state) => state.activeShopId);
  const setActiveCompany = useCompanyStore((state) => state.setActiveCompany);
  const setActiveShop = useCompanyStore((state) => state.setActiveShop);
  const { data: memberships, isLoading: membershipsLoading } = useMyMemberships();

  const shops = useMemo(() => memberships?.shops ?? [], [memberships]);
  const activeShopStillValid = shops.some((shop) => shop.id === activeShopId);

  useEffect(() => {
    if (activeShopStillValid || shops.length === 0) return;
    const firstShop = shops[0];
    setActiveCompany(firstShop.company_id);
    setActiveShop(firstShop.id);
  }, [activeShopStillValid, shops, setActiveCompany, setActiveShop]);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (membershipsLoading || !memberships) {
    return <LoadingScreen />;
  }

  if (memberships.companies.length === 0) {
    return <Redirect href="/(onboarding)/create-company" />;
  }

  if (shops.length === 0) {
    return (
      <Redirect
        href={{
          pathname: '/(onboarding)/create-shop',
          params: { companyId: memberships.companies[0].id },
        }}
      />
    );
  }

  if (!activeShopStillValid) {
    return <LoadingScreen />;
  }

  return <Redirect href="/(app)" />;
}
