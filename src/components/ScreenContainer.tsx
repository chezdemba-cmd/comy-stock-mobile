import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

interface ScreenContainerProps extends PropsWithChildren {
  style?: ViewStyle;
  edges?: Edge[];
  centered?: boolean;
}

export function ScreenContainer({
  children,
  style,
  edges = ['top', 'bottom'],
  centered = false,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <View style={[styles.content, centered && styles.centered, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
  },
});
