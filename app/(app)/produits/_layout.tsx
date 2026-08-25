import { Stack } from 'expo-router';

import { colors, typography } from '@/constants/theme';

export default function ProduitsLayout() {
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
      <Stack.Screen name="create" options={{ title: 'Nouveau produit' }} />
      <Stack.Screen name="scanner" options={{ title: 'Scanner' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Produit' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Modifier' }} />
    </Stack>
  );
}
