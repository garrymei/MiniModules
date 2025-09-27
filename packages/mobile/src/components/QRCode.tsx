import React from 'react';
import { View } from '@tarojs/components';
import QRCodeImpl from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
}

export const QRCode: React.FC<QRCodeProps> = ({ value, size = 128 }) => {
  // For Taro.js, we need to render the QR code as a canvas or image
  // Since qrcode.react renders to canvas by default, we'll convert it to a data URL
  return (
    <View style={{ width: size, height: size, padding: '10px', backgroundColor: '#fff' }}>
      <QRCodeImpl 
        value={value} 
        size={size - 20} // Account for padding
        level="M" // Error correction level
        bgColor="#ffffff"
        fgColor="#000000"
        includeMargin={false}
        renderAs="svg" // Use SVG for better compatibility
      />
    </View>
  );
};