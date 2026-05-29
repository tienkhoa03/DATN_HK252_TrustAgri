/**
 * ContractDetailModal — full-screen contract detail + vertical timeline
 * (FR-T04, FR-T05, US-T03)
 * Cũng hỗ trợ flow Hủy/Hoàn thành/Điều chỉnh hợp đồng với approval pattern.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Text } from 'zmp-ui';
import { StandardInfoModal } from '@/screens/shared/standards/StandardInfoModal';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import type { ContractDto } from '@/services/contractService';
import {
  contractStatusLabelVi,
  contractTypeLabelVi,
  signContract,
  rejectContract,
  canUserSign,
  hasUserSigned,
  toContractViMessage,
  getContract,
  listContractAuditLogs,
  type ContractAuditLogDto,
} from '@/services/contractService';
import {
  listContractChangeRequests,
  requestCancelContract,
  requestCompleteContract,
  requestModifyContract,
  acceptContractChangeRequest,
  rejectContractChangeRequest,
  toContractChangeRequestViMessage,
  type ContractChangeRequestDto,
} from '@/services/contractChangeRequestService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { contractFarmDisplay, partyBuyerDisplay, partyFarmerDisplay } from '@/utils/displayLabels';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { ContractQrCodeModal } from '@/screens/shared/contracts/ContractQrCodeModal';

export interface ContractDetailModalProps {
  contract: ContractDto;
  visible: boolean;
  onClose: () => void;
  onSigned?: (updated: ContractDto) => void;
  onRejected?: (updated: ContractDto) => void;
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

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// Map actorUserId → nhãn vai trò dựa trên các bên của hợp đồng (audit log chỉ có id).
function auditActorLabel(actorUserId: string, contract: ContractDto): string {
  if (actorUserId === contract.partyFarmerId) {
    return partyFarmerDisplay(contract) || 'Nông dân';
  }
  if (actorUserId === contract.partyTraderId) return 'Thương lái';
  if (actorUserId === contract.partyBuyerId) {
    return partyBuyerDisplay(contract) || 'Người mua';
  }
  return actorUserId ? `${actorUserId.slice(0, 8)}…` : 'Hệ thống';
}

type ActionDialog = 'cancel' | 'complete' | 'modify' | null;

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract: initialContract,
  visible,
  onClose,
  onSigned,
  onRejected,
}) => {
  const session = useAtomValue(authSessionAtom);
  const openSnackbar = useStableOpenSnackbar();
  const queryClient = useQueryClient();
  const [contract, setContract] = useState<ContractDto>(initialContract);
  const [signing, setSigning] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Audit log (lịch sử thay đổi trạng thái từ hệ thống — FR-T06)
  const [auditLogs, setAuditLogs] = useState<ContractAuditLogDto[]>([]);

  // Change request flow (cancel / complete / modify)
  const [changeRequests, setChangeRequests] = useState<ContractChangeRequestDto[]>([]);
  const [actionDialog, setActionDialog] = useState<ActionDialog>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Modify form
  const [modifyQuantity, setModifyQuantity] = useState<string>(String(initialContract.quantity));
  const [modifyTotalPrice, setModifyTotalPrice] = useState<string>(String(initialContract.totalPrice));
  const [modifyEndDate, setModifyEndDate] = useState<string>(initialContract.endDate?.slice(0, 10) ?? '');
  const [modifyTerms, setModifyTerms] = useState<string>(initialContract.terms ?? '');

  // Re-sync state when contract prop changes
  useEffect(() => {
    setContract(initialContract);
    setModifyQuantity(String(initialContract.quantity));
    setModifyTotalPrice(String(initialContract.totalPrice));
    setModifyEndDate(initialContract.endDate?.slice(0, 10) ?? '');
    setModifyTerms(initialContract.terms ?? '');
  }, [initialContract]);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [showStandardInfo, setShowStandardInfo] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const userId = session?.userId ?? '';
  const sessionRole = session?.role;
  const userRole: 'farmer' | 'trader' | 'buyer' | undefined =
    sessionRole === 'farmer' || sessionRole === 'trader' || sessionRole === 'buyer'
      ? sessionRole
      : undefined;

  // Reload change requests + contract khi modal mở
  const refreshChangeRequests = useCallback(async () => {
    if (!visible) return;
    try {
      const list = await listContractChangeRequests(initialContract.id);
      setChangeRequests(list);
    } catch {
      setChangeRequests([]);
    }
  }, [initialContract.id, visible]);

  // Lịch sử thay đổi trạng thái (audit log) — mọi role xem được (FR-T06)
  const refreshAuditLogs = useCallback(async () => {
    if (!visible) return;
    try {
      const logs = await listContractAuditLogs(initialContract.id);
      setAuditLogs(logs);
    } catch {
      setAuditLogs([]);
    }
  }, [initialContract.id, visible]);

  useEffect(() => {
    void refreshChangeRequests();
    void refreshAuditLogs();
  }, [refreshChangeRequests, refreshAuditLogs]);

  if (!visible) return null;

  const showSignButton =
    userRole != null && canUserSign(contract, userId, userRole);

  const alreadySigned =
    userRole != null &&
    contract.status === 'pending_signature' &&
    !showSignButton &&
    hasUserSigned(contract, userId, userRole);

  const pendingChange = changeRequests.find((c) => c.status === 'pending');
  const myIsRequester = pendingChange?.requestedBy === userId;
  const canShowActionButtons =
    contract.status === 'active' && userRole != null && !pendingChange;

  const handleCreateAction = async (action: 'cancel' | 'complete' | 'modify') => {
    setActionSubmitting(true);
    try {
      let resultMsg = '';
      if (action === 'cancel') {
        await requestCancelContract(contract.id, actionReason.trim() || undefined);
        resultMsg = 'Đã gửi yêu cầu hủy hợp đồng. Đợi đối tác chấp nhận.';
      } else if (action === 'complete') {
        await requestCompleteContract(contract.id, actionReason.trim() || undefined);
        resultMsg = 'Đã gửi yêu cầu hoàn thành. Đợi đối tác chấp nhận.';
      } else {
        const changes: Record<string, { oldValue: unknown; newValue: unknown }> = {};
        if (Number(modifyQuantity) !== Number(contract.quantity)) {
          changes.quantity = { oldValue: Number(contract.quantity), newValue: Number(modifyQuantity) };
        }
        if (Number(modifyTotalPrice) !== Number(contract.totalPrice)) {
          changes.totalPrice = { oldValue: Number(contract.totalPrice), newValue: Number(modifyTotalPrice) };
        }
        const newEnd = modifyEndDate;
        const oldEnd = contract.endDate?.slice(0, 10) ?? '';
        if (newEnd && newEnd !== oldEnd) {
          changes.endDate = { oldValue: contract.endDate, newValue: new Date(newEnd).toISOString() };
        }
        if (modifyTerms !== contract.terms) {
          changes.terms = { oldValue: contract.terms, newValue: modifyTerms };
        }
        if (Object.keys(changes).length === 0) {
          openSnackbar({ type: 'warning', text: 'Bạn chưa thay đổi trường nào.', duration: 3000, icon: true });
          setActionSubmitting(false);
          return;
        }
        await requestModifyContract(contract.id, changes, actionReason.trim() || undefined);
        resultMsg = 'Đã gửi yêu cầu điều chỉnh. Đợi đối tác chấp nhận.';
      }

      const fresh = await getContract(contract.id);
      setContract(fresh);
      await refreshChangeRequests();
      void refreshAuditLogs();
      void queryClient.invalidateQueries({ queryKey: ['trader-contracts'] });
      setActionDialog(null);
      setActionReason('');
      openSnackbar({ type: 'success', text: resultMsg, duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({
        type: 'error',
        text: toContractChangeRequestViMessage(err, 'create'),
        duration: 3500,
        icon: true,
      });
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleAcceptChangeRequest = async (changeId: string) => {
    setActionSubmitting(true);
    try {
      await acceptContractChangeRequest(contract.id, changeId);
      const fresh = await getContract(contract.id);
      setContract(fresh);
      await refreshChangeRequests();
      void refreshAuditLogs();
      void queryClient.invalidateQueries({ queryKey: ['trader-contracts'] });
      openSnackbar({ type: 'success', text: 'Đã chấp nhận yêu cầu.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toContractChangeRequestViMessage(err, 'accept'), duration: 3500, icon: true });
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRejectChangeRequest = async (changeId: string) => {
    setActionSubmitting(true);
    try {
      await rejectContractChangeRequest(contract.id, changeId);
      const fresh = await getContract(contract.id);
      setContract(fresh);
      await refreshChangeRequests();
      void refreshAuditLogs();
      void queryClient.invalidateQueries({ queryKey: ['trader-contracts'] });
      openSnackbar({ type: 'success', text: 'Đã từ chối yêu cầu.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toContractChangeRequestViMessage(err, 'reject'), duration: 3500, icon: true });
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      const updated = await signContract(contract.id);
      setContract(updated);
      void refreshAuditLogs();
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

  const handleRejectConfirm = async () => {
    setRejecting(true);
    try {
      const updated = await rejectContract(contract.id, rejectReason);
      setRejectDialogOpen(false);
      setRejectReason('');
      void queryClient.invalidateQueries({ queryKey: ['trader-contracts'] });
      onRejected?.(updated);
      onClose();
      openSnackbar({
        type: 'success',
        text: 'Đã từ chối hợp đồng.',
        duration: 3000,
        icon: true,
      });
    } catch (err) {
      openSnackbar({
        type: 'error',
        text: toContractViMessage(err, 'reject'),
        duration: 3500,
        icon: true,
      });
    } finally {
      setRejecting(false);
    }
  };

  const timeline = buildTimeline(contract);
  const farmerLine = contract.partyFarmerId ? partyFarmerDisplay(contract) : null;
  const buyerLine = contract.partyBuyerId ? partyBuyerDisplay(contract) : null;
  const farmLine = contractFarmDisplay(contract);
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
        top: 0, left: 0, right: 0,
        bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
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
          {farmLine && <Row label="Vườn" value={farmLine} />}
          {farmerLine && <Row label="Nông dân" value={farmerLine} />}
          {buyerLine && <Row label="Người mua" value={buyerLine} />}
          {contract.standardId && (
            <ClickableRow
              label="Tiêu chuẩn"
              value={contract.standardName ?? contract.standardId.slice(0, 8) + '…'}
              onClick={() => setShowStandardInfo(true)}
            />
          )}
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

        {/* Mã QR lô hàng truy xuất nguồn gốc — chỉ farmer_trader contract đã active mới có */}
        {contract.contractType === 'farmer_trader' && contract.traceabilityCode && (
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            style={{
              width: '100%',
              padding: spacing.md,
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              border: `1px solid ${colors.background.tertiary}`,
              borderRadius: '10px',
              fontSize: fontSize.body,
              fontWeight: fontWeight.medium,
              cursor: 'pointer',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}
          >
            <span>🏷️</span>
            <span>{`Mã QR lô hàng (${contract.traceabilityCode})`}</span>
          </button>
        )}

        {/* Sign / Reject actions */}
        {showSignButton && (
          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}
          >
            <button
              type="button"
              disabled={signing || rejecting}
              onClick={() => void handleSign()}
              style={{
                flex: 1,
                padding: spacing.md,
                backgroundColor:
                  signing || rejecting ? colors.background.secondary : colors.primary.agriGreen,
                color: signing || rejecting ? colors.text.secondary : colors.text.inverse,
                border: 'none',
                borderRadius: '10px',
                fontSize: fontSize.body,
                fontWeight: fontWeight.semibold,
                cursor: signing || rejecting ? 'not-allowed' : 'pointer',
                minHeight: 48,
              }}
            >
              {signing ? 'Đang xử lý…' : '✍️ Ký hợp đồng'}
            </button>
            <button
              type="button"
              disabled={signing || rejecting}
              onClick={() => setRejectDialogOpen(true)}
              style={{
                flex: 1,
                padding: spacing.md,
                backgroundColor: colors.background.primary,
                color: colors.functional.alertRed,
                border: `1px solid ${colors.functional.alertRed}`,
                borderRadius: '10px',
                fontSize: fontSize.body,
                fontWeight: fontWeight.semibold,
                cursor: signing || rejecting ? 'not-allowed' : 'pointer',
                minHeight: 48,
              }}
            >
              Từ chối
            </button>
          </div>
        )}

        {/* Pending change request banner — show diff + accept/reject for counterparty */}
        {pendingChange && (
          <div
            style={{
              backgroundColor: `${colors.functional.warningYellow}10`,
              border: `1px solid ${colors.functional.warningYellow}66`,
              borderRadius: 10,
              padding: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0, marginBottom: spacing.xs }}>
              {pendingChange.action === 'cancel'
                ? '⛔️ Yêu cầu hủy hợp đồng'
                : pendingChange.action === 'complete'
                  ? '✅ Yêu cầu hoàn thành hợp đồng'
                  : '✏️ Yêu cầu điều chỉnh hợp đồng'}
            </Text>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0, marginBottom: spacing.sm }}>
              Người gửi: {pendingChange.requestedByName ?? pendingChange.requestedBy.slice(0, 8) + '…'}
            </Text>
            {pendingChange.reason && (
              <Text size="xSmall" style={{ margin: 0, marginBottom: spacing.sm, fontStyle: 'italic' }}>
                Lý do: {pendingChange.reason}
              </Text>
            )}
            {pendingChange.action === 'modify' && Object.keys(pendingChange.changes ?? {}).length > 0 && (
              <div style={{ backgroundColor: colors.background.primary, padding: spacing.sm, borderRadius: 6, marginBottom: spacing.sm }}>
                {Object.entries(pendingChange.changes ?? {}).map(([key, val]) => (
                  <div key={key} style={{ fontSize: fontSize.caption, marginBottom: spacing.xs }}>
                    <strong>{key}:</strong>{' '}
                    <span style={{ color: colors.functional.alertRed, textDecoration: 'line-through' }}>
                      {String(val.oldValue)}
                    </span>{' '}
                    →{' '}
                    <span style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.semibold }}>
                      {String(val.newValue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {myIsRequester ? (
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                ⏳ Đang chờ đối tác phản hồi…
              </Text>
            ) : (
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={() => void handleAcceptChangeRequest(pendingChange.id)}
                  style={{
                    flex: 1,
                    padding: spacing.sm,
                    backgroundColor: colors.primary.agriGreen,
                    color: colors.text.inverse,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: fontSize.caption,
                    fontWeight: fontWeight.semibold,
                    cursor: actionSubmitting ? 'not-allowed' : 'pointer',
                    minHeight: 44,
                  }}
                >
                  Chấp nhận
                </button>
                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={() => void handleRejectChangeRequest(pendingChange.id)}
                  style={{
                    flex: 1,
                    padding: spacing.sm,
                    backgroundColor: colors.background.primary,
                    color: colors.functional.alertRed,
                    border: `1px solid ${colors.functional.alertRed}`,
                    borderRadius: 8,
                    fontSize: fontSize.caption,
                    fontWeight: fontWeight.semibold,
                    cursor: actionSubmitting ? 'not-allowed' : 'pointer',
                    minHeight: 44,
                  }}
                >
                  Từ chối
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons: Cancel / Complete / Modify — only for active contract without pending change */}
        {canShowActionButtons && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.md }}>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
              Thao tác trên hợp đồng (cần đối tác chấp nhận):
            </Text>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <button
                type="button"
                onClick={() => { setActionReason(''); setActionDialog('modify'); }}
                style={{
                  flex: 1,
                  padding: spacing.sm,
                  backgroundColor: colors.background.primary,
                  color: colors.primary.zaloBlue,
                  border: `1px solid ${colors.primary.zaloBlue}`,
                  borderRadius: 8,
                  fontSize: fontSize.caption,
                  fontWeight: fontWeight.semibold,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                ✏️ Điều chỉnh
              </button>
              <button
                type="button"
                onClick={() => { setActionReason(''); setActionDialog('complete'); }}
                style={{
                  flex: 1,
                  padding: spacing.sm,
                  backgroundColor: colors.background.primary,
                  color: colors.primary.agriGreen,
                  border: `1px solid ${colors.primary.agriGreen}`,
                  borderRadius: 8,
                  fontSize: fontSize.caption,
                  fontWeight: fontWeight.semibold,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                ✅ Hoàn thành
              </button>
              <button
                type="button"
                onClick={() => { setActionReason(''); setActionDialog('cancel'); }}
                style={{
                  flex: 1,
                  padding: spacing.sm,
                  backgroundColor: colors.background.primary,
                  color: colors.functional.alertRed,
                  border: `1px solid ${colors.functional.alertRed}`,
                  borderRadius: 8,
                  fontSize: fontSize.caption,
                  fontWeight: fontWeight.semibold,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                ⛔️ Hủy
              </button>
            </div>
          </div>
        )}

        {/* Action confirmation modal */}
        <Modal
          visible={actionDialog !== null}
          title={
            actionDialog === 'cancel'
              ? 'Yêu cầu hủy hợp đồng?'
              : actionDialog === 'complete'
                ? 'Yêu cầu hoàn thành hợp đồng?'
                : 'Yêu cầu điều chỉnh hợp đồng?'
          }
          description={
            actionDialog === 'modify'
              ? 'Chỉnh giá trị bên dưới, kèm lý do (tùy chọn). Hợp đồng sẽ chuyển sang chờ phản hồi cho đến khi đối tác phản hồi.'
              : 'Yêu cầu sẽ chờ đối tác chấp nhận trước khi áp dụng. Bạn có thể nhập lý do (tùy chọn).'
          }
          zIndex={2100}
          onClose={() => {
            if (actionSubmitting) return;
            setActionDialog(null);
            setActionReason('');
          }}
          verticalActions
          actions={[
            {
              text: actionSubmitting ? 'Đang gửi…' : 'Gửi yêu cầu',
              onClick: () => {
                if (actionDialog) void handleCreateAction(actionDialog);
              },
            },
            { text: 'Huỷ', close: true },
          ]}
        >
          {actionDialog === 'modify' && (
            <div style={{ marginTop: spacing.sm }}>
              <label style={{ display: 'block', fontSize: fontSize.caption, color: colors.text.secondary, marginBottom: 4 }}>
                Khối lượng ({contract.unit})
              </label>
              <input
                type="number"
                value={modifyQuantity}
                onChange={(e) => setModifyQuantity(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: spacing.sm, marginBottom: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 6 }}
              />
              <label style={{ display: 'block', fontSize: fontSize.caption, color: colors.text.secondary, marginBottom: 4 }}>
                Tổng giá trị (VNĐ)
              </label>
              <input
                type="number"
                value={modifyTotalPrice}
                onChange={(e) => setModifyTotalPrice(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: spacing.sm, marginBottom: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 6 }}
              />
              <label style={{ display: 'block', fontSize: fontSize.caption, color: colors.text.secondary, marginBottom: 4 }}>
                Đến ngày
              </label>
              <input
                type="date"
                value={modifyEndDate}
                onChange={(e) => setModifyEndDate(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: spacing.sm, marginBottom: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 6 }}
              />
              <label style={{ display: 'block', fontSize: fontSize.caption, color: colors.text.secondary, marginBottom: 4 }}>
                Điều khoản
              </label>
              <textarea
                value={modifyTerms}
                onChange={(e) => setModifyTerms(e.target.value)}
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', padding: spacing.sm, marginBottom: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 6, resize: 'vertical' }}
              />
            </div>
          )}
          <label style={{ display: 'block', fontSize: fontSize.caption, color: colors.text.secondary, marginTop: spacing.sm, marginBottom: 4 }}>
            Lý do (tùy chọn)
          </label>
          <textarea
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder="Vd: thay đổi do thời tiết, mùa vụ hoàn tất…"
            maxLength={500}
            rows={3}
            disabled={actionSubmitting}
            style={{ width: '100%', boxSizing: 'border-box', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 6, resize: 'vertical' }}
          />
        </Modal>

        <Modal
          visible={rejectDialogOpen}
          title="Từ chối hợp đồng?"
          description="Hợp đồng sẽ chuyển sang trạng thái đã hủy. Bạn có thể nhập lý do (tuỳ chọn)."
          zIndex={2100}
          onClose={() => {
            if (rejecting) return;
            setRejectDialogOpen(false);
            setRejectReason('');
          }}
          verticalActions
          actions={[
            {
              text: rejecting ? 'Đang xử lý…' : 'Xác nhận từ chối',
              danger: true,
              onClick: () => void handleRejectConfirm(),
            },
            {
              text: 'Huỷ',
              close: true,
            },
          ]}
        >
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối (tuỳ chọn)"
            maxLength={500}
            disabled={rejecting}
            rows={3}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              marginTop: spacing.sm,
              padding: spacing.sm,
              borderRadius: 8,
              border: `1px solid ${colors.background.secondary}`,
              fontSize: fontSize.body,
              resize: 'vertical',
            }}
          />
        </Modal>

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

        {/* Lịch sử thay đổi trạng thái (audit log từ hệ thống) — FR-T06 */}
        <Text.Title size="small" style={{ margin: `${spacing.lg} 0 ${spacing.md}` }}>
          Lịch sử thay đổi
        </Text.Title>
        {auditLogs.length === 0 ? (
          <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
            Chưa có thay đổi trạng thái nào được ghi nhận.
          </Text>
        ) : (
          <div>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: spacing.sm,
                  padding: `${spacing.sm} 0`,
                  borderBottom: `1px solid ${colors.background.tertiary}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium, fontSize: fontSize.caption }}>
                    {log.previousStatus ? (
                      <>
                        <span style={{ color: colors.text.secondary }}>
                          {contractStatusLabelVi(log.previousStatus as ContractDto['status'])}
                        </span>
                        {' → '}
                      </>
                    ) : null}
                    <span style={{ color: colors.primary.zaloBlue, fontWeight: fontWeight.semibold }}>
                      {contractStatusLabelVi(log.newStatus as ContractDto['status'])}
                    </span>
                  </Text>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0, fontSize: fontSize.caption }}>
                    bởi {auditActorLabel(log.actorUserId, contract)}
                  </Text>
                </div>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0, flexShrink: 0, fontSize: fontSize.caption }}>
                  {formatDateTime(log.occurredAt)}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>

      {showQrModal && contract.traceabilityCode && (
        <ContractQrCodeModal
          visible={showQrModal}
          onClose={() => setShowQrModal(false)}
          traceabilityCode={contract.traceabilityCode}
        />
      )}

      {showStandardInfo && contract.standardId && (
        <StandardInfoModal
          standardId={contract.standardId}
          standardName={contract.standardName}
          onClose={() => setShowStandardInfo(false)}
        />
      )}
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

const ClickableRow: React.FC<{ label: string; value: string; onClick: () => void }> = ({ label, value, onClick }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
    <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
      {label}
    </Text>
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        color: colors.primary.zaloBlue,
        fontSize: fontSize.caption,
        fontWeight: fontWeight.semibold,
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        minHeight: 24,
      }}
    >
      {value}
    </button>
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
