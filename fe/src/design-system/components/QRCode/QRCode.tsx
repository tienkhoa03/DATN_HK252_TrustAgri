/**
 * QRCode — wrapper quanh `qrcode.react` áp dụng design tokens TrustAgri.
 * Render QR cho traceability code (FR-G01) hoặc bất kỳ payload string nào.
 */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { colors } from '@/design-system/tokens/colors';

export interface QRCodeProps {
  /** Payload encode vào QR (URL hoặc plain text). */
  value: string;
  /** Kích thước cạnh (px). Mặc định 180. */
  size?: number;
  /** Mức error correction. Mặc định 'M' (~15% recovery). */
  level?: 'L' | 'M' | 'Q' | 'H';
  /** Màu module (foreground). Mặc định text.primary. */
  fgColor?: string;
  /** Màu nền. Mặc định background.primary. */
  bgColor?: string;
  /** Class CSS bổ sung. */
  className?: string;
}

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 180,
  level = 'M',
  fgColor = colors.text.primary,
  bgColor = colors.background.primary,
  className,
}) => {
  if (!value) return null;
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level={level}
      fgColor={fgColor}
      bgColor={bgColor}
      className={className}
      includeMargin
    />
  );
};

export default QRCode;
