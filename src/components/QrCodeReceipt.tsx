import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { colors } from '@/constants/theme';

export function QrCodeReceipt({ value, size = 120 }: { value: string; size?: number }) {
  return (
    <View style={{ alignSelf: 'center', backgroundColor: colors.textOnWhite, padding: 8, borderRadius: 12 }}>
      <QRCode value={value} size={size} backgroundColor={colors.textOnWhite} color="#000000" />
    </View>
  );
}
