import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts as usePoppinsFonts, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFonts as useDmSansFonts, DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

import '@/i18n';
import { colors } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { OfflineSyncProvider } from '@/providers/OfflineSyncProvider';
import { queryClient } from '@/services/queryClient';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [poppinsLoaded] = usePoppinsFonts({ Poppins_600SemiBold, Poppins_700Bold });
  const [dmSansLoaded] = useDmSansFonts({ DMSans_400Regular, DMSans_500Medium });
  const fontsLoaded = poppinsLoaded && dmSansLoaded;

  useAuthSession();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <OfflineSyncProvider>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </OfflineSyncProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
