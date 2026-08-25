import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { OfflineBanner } from '@/components/OfflineBanner';
import { colors, typography } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.green,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontFamily: typography.fontBodyMedium,
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.home'),
            tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="caisse"
          options={{
            title: t('nav.pos'),
            tabBarIcon: ({ color, size }) => <TabIcon name="cart" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="produits"
          options={{
            title: t('nav.products'),
            tabBarIcon: ({ color, size }) => <TabIcon name="cube" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="comy-ia"
          options={{
            title: t('nav.comyAI'),
            tabBarIcon: ({ color, size }) => <TabIcon name="sparkles" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="plus"
          options={{
            title: t('nav.more'),
            tabBarIcon: ({ color, size }) => <TabIcon name="menu" color={color} size={size} />,
          }}
        />
      </Tabs>
    </View>
  );
}

function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number }) {
  return <Ionicons name={name} color={color} size={size} />;
}
