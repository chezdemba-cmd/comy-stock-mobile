import { Image, StyleSheet, View } from 'react-native';

const mark = require('../../assets/images/mark.png');
const logo = require('../../assets/images/logo.png');

interface LogoProps {
  variant?: 'mark' | 'full';
  size?: number;
}

export function Logo({ variant = 'mark', size = 72 }: LogoProps) {
  if (variant === 'full') {
    return (
      <View style={styles.wrapper}>
        <Image source={logo} style={{ width: size * 3.4, height: size }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Image source={mark} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
