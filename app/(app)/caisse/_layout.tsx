import { Stack } from 'expo-router';

import { colors, typography } from '@/constants/theme';

export default function CaisseLayout() {
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
      <Stack.Screen name="scanner" options={{ title: 'Scanner' }} />
      <Stack.Screen name="cart" options={{ title: 'Panier' }} />
      <Stack.Screen name="payment" options={{ title: 'Paiement' }} />
      <Stack.Screen name="receipt" options={{ title: 'Reçu', headerBackVisible: false }} />
      <Stack.Screen name="receipt-pending" options={{ title: 'Reçu', headerBackVisible: false }} />
      <Stack.Screen name="register" options={{ title: 'Caisse' }} />
      <Stack.Screen name="closing" options={{ title: 'Clôture de caisse' }} />
    </Stack>
  );
}
