import { Stack } from 'expo-router';

import { colors, typography } from '@/constants/theme';

export default function PlusLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: typography.fontHeading },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="clients/index" options={{ title: 'Clients' }} />
      <Stack.Screen name="clients/create" options={{ title: 'Nouveau client' }} />
      <Stack.Screen name="clients/[id]/index" options={{ title: 'Client' }} />
      <Stack.Screen name="clients/[id]/edit" options={{ title: 'Modifier' }} />
      <Stack.Screen name="suppliers/index" options={{ title: 'Fournisseurs' }} />
      <Stack.Screen name="suppliers/create" options={{ title: 'Nouveau fournisseur' }} />
      <Stack.Screen name="suppliers/[id]/index" options={{ title: 'Fournisseur' }} />
      <Stack.Screen name="suppliers/[id]/edit" options={{ title: 'Modifier' }} />
      <Stack.Screen name="suppliers/[id]/purchase" options={{ title: 'Nouvel achat' }} />
      <Stack.Screen name="expenses/index" options={{ title: 'Dépenses' }} />
      <Stack.Screen name="expenses/create" options={{ title: 'Nouvelle dépense' }} />
      <Stack.Screen name="reports/index" options={{ title: 'Rapports' }} />
      <Stack.Screen name="reports/products" options={{ title: 'Rapport produits' }} />
      <Stack.Screen name="reports/employees" options={{ title: 'Rapport employés' }} />
      <Stack.Screen name="sync-queue" options={{ title: 'Synchronisation' }} />
    </Stack>
  );
}
