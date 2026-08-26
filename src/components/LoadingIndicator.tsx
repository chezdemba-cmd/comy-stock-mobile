import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

interface LoadingIndicatorProps {
  fullScreen?: boolean;
}

export function LoadingIndicator({ fullScreen = false }: LoadingIndicatorProps) {
  return (
    <View style={fullScreen ? styles.fullScreen : styles.inline}>
      <ActivityIndicator size="large" color={colors.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
