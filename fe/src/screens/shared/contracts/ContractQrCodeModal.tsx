/**
 * ContractQrCodeModal — display QR code for a contract-level traceability code
 * (FR-G01 / US-T03 — contract scope QR)
 */
import React, { useState } from 'react';
import { Modal, Text } from 'zmp-ui';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

const BASE_TRACE_URL = 'https://trustagri.vn/trace';

interface Props {
  visible: boolean;
  onClose: () => void;
  traceabilityCode: string;
}

export const ContractQrCodeModal: React.FC<Props> = ({ visible, onClose, traceabilityCode }) => {
  const [copied, setCopied] = useState(false);
  const traceUrl = `${BASE_TRACE_URL}/${encodeURIComponent(traceabilityCode)}`;

  const handleCopy = () => {
    void navigator.clipboard.writeText(traceabilityCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Modal
      visible={visible}
      title="Mã QR lô hàng"
      onClose={onClose}
      zIndex={2000}
      actions={[{ text: 'Đóng', close: true }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: spacing.md }}>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            marginBottom: spacing.md,
          }}
        >
          <QRCode value={traceUrl} size={180} level="M" />
        </div>

        <Text
          size="small"
          style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs, fontSize: fontSize.caption }}
        >
          {traceabilityCode}
        </Text>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: `${spacing.xs} ${spacing.md}`,
            backgroundColor: copied ? colors.primary.agriGreen : colors.background.secondary,
            color: copied ? colors.text.inverse : colors.text.primary,
            border: 'none',
            borderRadius: '6px',
            fontSize: fontSize.caption,
            fontWeight: fontWeight.medium,
            cursor: 'pointer',
            marginBottom: spacing.md,
            minHeight: '44px',
            minWidth: '120px',
          }}
        >
          {copied ? '✓ Đã sao chép' : 'Sao chép mã'}
        </button>

        <div
          style={{
            backgroundColor: colors.background.secondary,
            borderRadius: '8px',
            padding: spacing.md,
            width: '100%',
          }}
        >
          <Text
            size="xSmall"
            style={{ color: colors.text.secondary, display: 'block', marginBottom: spacing.xs, fontSize: fontSize.caption }}
          >
            In mã QR này và dán lên bao bì lô hàng. Người tiêu dùng quét mã để xem thông tin truy xuất nguồn gốc mùa vụ này.
          </Text>
          <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
            {`Link: ${traceUrl}`}
          </Text>
        </div>
      </div>
    </Modal>
  );
};
