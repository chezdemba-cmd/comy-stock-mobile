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
    </Stack>
  );
}
