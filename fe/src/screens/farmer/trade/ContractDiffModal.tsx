/**
 * ContractDiffModal — full-screen modal showing contract change diff (FR-T10)
 */

import React, { useState } from 'react';
import { Text } from 'zmp-ui';
import { DiffRow } from '@/design-system/components/DiffRow';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import type { ContractDto } from '@/services/contractService';

export interface ContractChangeRequest {
  quantity?: number;
  totalPrice?: number;
  deliveryDate?: string;
  qualityRequirements?: string;
}

export interface ContractDiffModalProps {
  open: boolean;
  onClose: () => void;
  contract: ContractDto;
  changeRequest?: ContractChangeRequest;
  onAccept?: (contractId: string) => Promise<void>;
  onReject?: (contractId: string) => Promise<void>;
}

function formatCurrency(v: string | number): string {
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

export const ContractDiffModal: React.FC<ContractDiffModalProps> = ({
  open,
  onClose,
  contract,
  changeRequest,
  onAccept,
  onReject,
}) => {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);
  const openSnackbar = useStableOpenSnackbar();

  if (!open) return null;

  const cr = changeRequest ?? {};
  const oldQty = contract.quantity;
  const newQty = cr.quantity ?? contract.quantity;
  const oldPrice = contract.totalPrice;
  const newPrice = cr.totalPrice ?? contract.totalPrice;
  const oldDelivery = contract.endDate;
  const newDelivery = cr.deliveryDate ?? contract.endDate;
  const oldTerms = contract.terms;
  const newTerms = cr.qualityRequirements ?? contract.terms;

  const handleAccept = async () => {
    if (confirmAction !== 'accept') { setConfirmAction('accept'); return; }
    setAccepting(true);
    try {
      if (onAccept) {
        await onAccept(contract.id);
        openSnackbar({ type: 'success', text: 'Đã chấp nhận thay đổi hợp đồng!', duration: 2500, icon: true });
      } else {
        openSnackbar({ type: 'warning', text: 'Chức năng đang phát triển.', duration: 2500, icon: true });
      }
      onClose();
    } catch {
      openSnackbar({ type: 'error', text: 'Không thể xử lý yêu cầu. Vui lòng thử lại.', duration: 3500, icon: true });
    } finally {
      setAccepting(false);
      setConfirmAction(null);
    }
  };

  const handleReject = async () => {
    if (confirmAction !== 'reject') { setConfirmAction('reject'); return; }
    setRejecting(true);
    try {
      if (onReject) {
        await onReject(contract.id);
        openSnackbar({ type: 'success', text: 'Đã từ chối thay đổi hợp đồng.', duration: 2500, icon: true });
      } else {
        openSnackbar({ type: 'warning', text: 'Chức năng đang phát triển.', duration: 2500, icon: true });
      }
      onClose();
    } catch {
      openSnackbar({ type: 'error', text: 'Không thể xử lý yêu cầu. Vui lòng thử lại.', duration: 3500, icon: true });
    } finally {
      setRejecting(false);
      setConfirmAction(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1300,
      backgroundColor: colors.background.primary,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: spacing.md,
        borderBottom: `1px solid ${colors.background.secondary}`,
      }}>
        <Text.Title size="small" style={{ margin: 0 }}>Yêu cầu thay đổi hợp đồng</Text.Title>
        <button
          type="button" onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: colors.text.secondary, minHeight: 44, minWidth: 44 }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${spacing.md}` }}>
        <div style={{ marginTop: spacing.sm, marginBottom: spacing.sm, fontSize: fontSize.small, color: colors.text.secondary }}>
          Hợp đồng #{contract.id.slice(0, 8)}
        </div>

        <DiffRow
          label="Số lượng"
          oldValue={`${oldQty} ${contract.unit}`}
          newValue={`${newQty} ${contract.unit}`}
          changed={oldQty !== newQty}
        />
        <DiffRow
          label="Tổng giá trị"
          oldValue={oldPrice}
          newValue={newPrice}
          changed={oldPrice !== newPrice}
          formatValue={formatCurrency}
        />
        <DiffRow
          label="Ngày giao hàng"
          oldValue={new Date(oldDelivery).toLocaleDateString('vi-VN')}
          newValue={new Date(newDelivery).toLocaleDateString('vi-VN')}
          changed={oldDelivery !== newDelivery}
        />
        <DiffRow
          label="Yêu cầu chất lượng"
          oldValue={oldTerms}
          newValue={newTerms}
          changed={oldTerms !== newTerms}
        />
      </div>

      {/* Confirmation warning */}
      {confirmAction && (
        <div style={{
          margin: `0 ${spacing.md}`,
          padding: spacing.sm,
          backgroundColor: `${colors.functional.warningYellow}22`,
          border: `1px solid ${colors.functional.warningYellow}`,
          borderRadius: 8,
          fontSize: fontSize.small,
          color: colors.text.primary,
        }}>
          {confirmAction === 'accept'
            ? 'Nhấn "Chấp nhận" lần nữa để xác nhận.'
            : 'Nhấn "Từ chối" lần nữa để xác nhận.'}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.xl }}>
        <button
          type="button"
          onClick={handleReject}
          disabled={rejecting || accepting}
          style={{
            flex: 1, padding: spacing.md,
            backgroundColor: colors.background.primary,
            color: confirmAction === 'reject' ? colors.functional.alertRed : colors.functional.alertRed,
            border: `1px solid ${colors.functional.alertRed}`,
            borderRadius: 8, fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            cursor: rejecting || accepting ? 'not-allowed' : 'pointer',
            minHeight: 44,
          }}
        >
          {rejecting ? 'Đang từ chối…' : confirmAction === 'reject' ? 'Xác nhận từ chối' : 'Từ chối'}
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={accepting || rejecting}
          style={{
            flex: 1, padding: spacing.md,
            backgroundColor: accepting ? colors.text.disabled : colors.primary.agriGreen,
            color: colors.text.inverse,
            border: 'none',
            borderRadius: 8, fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            cursor: accepting || rejecting ? 'not-allowed' : 'pointer',
            minHeight: 44,
          }}
        >
          {accepting ? 'Đang xử lý…' : confirmAction === 'accept' ? 'Xác nhận chấp nhận' : 'Chấp nhận'}
        </button>
      </div>
    </div>
  );
};

export default ContractDiffModal;
