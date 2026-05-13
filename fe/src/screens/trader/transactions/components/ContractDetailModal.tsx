/**
 * ContractDetailModal — full-screen contract detail + vertical timeline
 * (FR-T04, FR-T05, US-T03)
 */
import React, { useState } from 'react';
import { Text } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import type { ContractDto } from '@/services/contractService';
import {
  contractStatusLabelVi,
  contractTypeLabelVi,
  partyFarmerLabel,
  partyBuyerLabel,
  signContract,
  canUserSign,
  hasUserSigned,
  toContractViMessage,
} from '@/services/contractService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export interface ContractDetailModalProps {
  contract: ContractDto;
  visible: boolean;
  onClose: () => void;
  onSigned?: (updated: ContractDto) => void;
}

interface TimelineEvent {
  timestamp: string;
  description: string;
}

function buildTimeline(contract: ContractDto): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { timestamp: contract.createdAt, description: 'Hợp đồng được tạo' },
  ];

  if (contract.farmerSignedAt) {
    events.push({ timestamp: contract.farmerSignedAt, description: 'Nông dân đã ký' });
  }
  if (contract.traderSignedAt) {
    events.push({ timestamp: contract.traderSignedAt, description: 'Thương lái đã ký' });
  }
  if (contract.buyerSignedAt) {
    events.push({ timestamp: contract.buyerSignedAt, description: 'Người mua đã ký' });
  }
  if (contract.status === 'active') {
    events.push({ timestamp: contract.updatedAt ?? contract.startDate, description: 'Hợp đồng có hiệu lực' });
  }

  // If DTO carries changeRequests (may be added by backend extensions)
  const cr = (contract as unknown as Record<string, unknown>).changeRequests;
  if (Array.isArray(cr)) {
    for (const item of cr as Array<Record<string, unknown>>) {
      events.push({
        timestamp: String(item.requestedAt ?? ''),
        description: `Yêu cầu thay đổi: ${String(item.reason ?? '')}`,
      });
    }
  }

  return events;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract: initialContract,
  visible,
  onClose,
  onSigned,
}) => {
  const session = useAtomValue(authSessionAtom);
  const openSnackbar = useStableOpenSnackbar();
  const [contract, setContract] = useState<ContractDto>(initialContract);
  const [signing, setSigning] = useState(false);

  if (!visible) return null;

  const userId = session?.userId ?? '';
  const sessionRole = session?.role;
  const userRole: 'farmer' | 'trader' | 'buyer' | undefined =
    sessionRole === 'farmer' || sessionRole === 'trader' || sessionRole === 'buyer'
      ? sessionRole
      : undefined;

  const showSignButton =
    userRole != null && canUserSign(contract, userId, userRole);

  const alreadySigned =
    userRole != null &&
    contract.status === 'pending_signature' &&
    !showSignButton &&
    hasUserSigned(contract, userId, userRole);

  const handleSign = async () => {
    setSigning(true);
    try {
      const updated = await signContract(contract.id);
      setContract(updated);
      onSigned?.(updated);
      const msg =
        updated.status === 'active'
          ? 'Cả hai bên đã ký — hợp đồng có hiệu lực!'
          : 'Đã ký thành công. Đang chờ bên còn lại ký.';
      openSnackbar({ type: 'success', text: msg, duration: 4000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toContractViMessage(err, 'get'), duration: 3500, icon: true });
    } finally {
      setSigning(false);
    }
  };

  const timeline = buildTimeline(contract);
  const farmerLine = contract.partyFarmerId ? partyFarmerLabel(contract.partyFarmerId) : null;
  const buyerLine = contract.partyBuyerId ? partyBuyerLabel(contract.partyBuyerId) : null;
  const statusColor =
    contract.status === 'active'
      ? colors.primary.agriGreen
      : contract.status === 'pending_signature'
      ? colors.functional.warningYellow
      : contract.status === 'pending_change'
      ? colors.functional.warningYellow
      : contract.status === 'completed'
      ? colors.primary.zaloBlue
      : colors.text.secondary;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: colors.background.primary,
        zIndex: 200,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.md,
          borderBottom: `1px solid ${colors.background.tertiary}`,
          position: 'sticky',
          top: 0,
          backgroundColor: colors.background.primary,
          zIndex: 1,
        }}
      >
        <Text.Title size="small" style={{ margin: 0 }}>
          Hợp đồng #{contract.id.slice(-8)}
        </Text.Title>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          style={{
            minWidth: '44px',
            minHeight: '44px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: colors.text.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: spacing.md, flex: 1 }}>
        {/* Status badge */}
        <div style={{ marginBottom: spacing.md }}>
          <span
            style={{
              display: 'inline-block',
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: `${statusColor}18`,
              color: statusColor,
              borderRadius: '6px',
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
            }}
          >
            {contractStatusLabelVi(contract.status)}
          </span>
        </div>

        {/* Signature status (pending_signature only) */}
        {contract.status === 'pending_signature' && (
          <div
            style={{
              backgroundColor: `${colors.functional.warningYellow}12`,
              border: `1px solid ${colors.functional.warningYellow}40`,
              borderRadius: '8px',
              padding: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <Text size="xSmall" style={{ fontWeight: fontWeight.semibold, color: colors.functional.warningYellow, display: 'block', marginBottom: spacing.xs }}>
              Trạng thái chữ ký
            </Text>
            {contract.contractType === 'farmer_trader' ? (
              <>
                <SignatureRow label="Nông dân" signed={!!contract.farmerSignedAt} signedAt={contract.farmerSignedAt} />
                <SignatureRow label="Thương lái" signed={!!contract.traderSignedAt} signedAt={contract.traderSignedAt} />
              </>
            ) : (
              <>
                <SignatureRow label="Thương lái" signed={!!contract.traderSignedAt} signedAt={contract.traderSignedAt} />
                <SignatureRow label="Người mua" signed={!!contract.buyerSignedAt} signedAt={contract.buyerSignedAt} />
              </>
            )}
          </div>
        )}

        {/* Info grid */}
        <div
          style={{
            backgroundColor: colors.background.secondary,
            borderRadius: '8px',
            padding: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <Row label="Loại hợp đồng" value={contractTypeLabelVi(contract.contractType)} />
          {farmerLine && <Row label="Nông dân" value={farmerLine} />}
          {buyerLine && <Row label="Người mua" value={buyerLine} />}
          <Row label="Hiệu lực từ" value={formatDate(contract.startDate)} />
          <Row label="Đến ngày" value={formatDate(contract.endDate)} />
          <Row label="Khối lượng" value={`${contract.quantity} ${contract.unit}`} />
          <Row
            label="Tổng giá trị"
            value={new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(contract.totalPrice)}
          />
        </div>

        {/* Sign button */}
        {showSignButton && (
          <button
            type="button"
            disabled={signing}
            onClick={() => void handleSign()}
            style={{
              width: '100%',
              padding: spacing.md,
              backgroundColor: signing ? colors.background.secondary : colors.primary.agriGreen,
              color: signing ? colors.text.secondary : colors.text.inverse,
              border: 'none',
              borderRadius: '10px',
              fontSize: fontSize.body,
              fontWeight: fontWeight.semibold,
              cursor: signing ? 'not-allowed' : 'pointer',
              minHeight: 48,
              marginBottom: spacing.md,
            }}
          >
            {signing ? 'Đang xử lý…' : '✍️ Ký hợp đồng'}
          </button>
        )}

        {alreadySigned && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: `${colors.primary.agriGreen}12`,
              borderRadius: '6px',
              marginBottom: spacing.md,
            }}
          >
            <span style={{ color: colors.primary.agriGreen, fontSize: fontSize.small }}>✓</span>
            <Text size="xSmall" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.medium }}>
              Bạn đã ký — đang chờ bên còn lại ký
            </Text>
          </div>
        )}

        {/* Timeline */}
        <Text.Title size="small" style={{ marginBottom: spacing.md }}>
          Lịch sử
        </Text.Title>
        <div>
          {timeline.map((ev, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              {/* Left: dot + line */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  width: '16px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor:
                      idx === 0 ? colors.primary.agriGreen : colors.primary.zaloBlue,
                    flexShrink: 0,
                    marginTop: '3px',
                  }}
                />
                {idx < timeline.length - 1 && (
                  <div
                    style={{
                      width: '2px',
                      flex: 1,
                      backgroundColor: colors.background.tertiary,
                      marginTop: '4px',
                      minHeight: '20px',
                    }}
                  />
                )}
              </div>

              {/* Right: text */}
              <div style={{ flex: 1, paddingBottom: spacing.xs }}>
                <Text
                  size="small"
                  style={{ fontWeight: fontWeight.medium, display: 'block', fontSize: fontSize.caption }}
                >
                  {ev.description}
                </Text>
                <Text
                  size="xSmall"
                  style={{ color: colors.text.secondary, marginTop: '2px', display: 'block', fontSize: fontSize.caption }}
                >
                  {formatDate(ev.timestamp)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
    <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
      {label}
    </Text>
    <Text size="small" style={{ fontWeight: fontWeight.medium, fontSize: fontSize.caption }}>
      {value}
    </Text>
  </div>
);

const SignatureRow: React.FC<{ label: string; signed: boolean; signedAt?: string }> = ({ label, signed, signedAt }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
    <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
      {label}
    </Text>
    {signed ? (
      <Text size="xSmall" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.semibold, fontSize: fontSize.caption }}>
        ✓ Đã ký {signedAt ? new Date(signedAt).toLocaleDateString('vi-VN') : ''}
      </Text>
    ) : (
      <Text size="xSmall" style={{ color: colors.functional.warningYellow, fontSize: fontSize.caption }}>
        ⏳ Chưa ký
      </Text>
    )}
  </div>
);
