"use client";

import { QRCodeCanvas } from 'qrcode.react';

// RainbowKit's QR Code props interface
interface CustomQRCodeProps {
  value: string;
  size?: number;
}

export const CustomQRCode = ({ value, size = 256 }: CustomQRCodeProps) => {
  return (
    <QRCodeCanvas
      value={value}
      size={size}
      bgColor={"#ffffff"}
      fgColor={"#000000"}
      level={"L"}
      includeMargin={false}
    />
  );
};