/**
 * Panel yêu cầu chỉnh sửa hợp đồng — Phase 13.2 (REST qua contractChangeRequestService + JWT).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Text, useSnackbar } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import { Icon } from '@/design-system/components/Icon';
import { Button } from '@/design-system/components/Button';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import type { ContractDto } from '@/services/contractService';
import {
  acceptContractChangeRequest,
  listContractChangeRequests,
  rejectContractChangeRequest,
  toContractChangeRequestViMessage,
  type ContractChangeRequestDto,
} from '@/services/contractChangeRequestService';

const FIELD_LABEL_VI: Record<string, string> = {
  quantity: 'Khối lượng',
  unit: 'Đơn vị',
  totalPrice: 'Tổng giá trị',
  deposit: 'Đặt cọc',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
  terms: 'Điều khoản',
  productId: 'Sản phẩm',
  farmId: 'Mã vườn',
  standardId: 'Tiêu chuẩn',
};

function fieldLabel(key: string): string {
  return FIELD_LABEL_VI[key] ?? key;
}

function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    return value >= 1_000_000
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
      : new Intl.NumberFormat('vi-VN').format(value);
  }
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  return String(value);
}

function isPartyOfContract(
  userId: string,
  contract?: Pick<ContractDto, 'partyFarmerId' | 'partyTraderId' | 'partyBuyerId'>,
): boolean {
  if (!contract?.partyTraderId) return false;
  if (contract.partyTraderId === userId) return true;
  if (contract.partyFarmerId != null && contract.partyFarmerId === userId) return true;
  if (contract.partyBuyerId != null && contract.partyBuyerId === userId) return true;
  return false;
}

export interface ContractChangeRequestsPanelProps {
  contractId: string;
  contract?: Pick<ContractDto, 'partyFarmerId' | 'partyTraderId' | 'partyBuyerId' | 'contractType'>;
  viewerRole: 'farmer' | 'trader' | 'buyer';
  onMutationSuccess?: () => void;
}

export const ContractChangeRequestsPanel: React.FC<ContractChangeRequestsPanelProps> = ({
  contractId,
  contract,
  onMutationSuccess,
}) => {
  const { openSnackbar } = useSnackbar();
  const session = useAtomValue(authSessionAtom);
  const actingUserId = session?.userId ?? '';

  const [items, setItems] = useState<ContractChangeRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    listContractChangeRequests(contractId)
      .then((rows) => {
        setItems(rows);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        const msg = toContractChangeRequestViMessage(err, 'list');
        setLoadError(msg);
        setItems([]);
        openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
      })
      .finally(() => setLoading(false));
  }, [contractId, openSnackbar]);

  useEffect(() => {
    load();
  }, [load]);

  const canRespond = (req: ContractChangeRequestDto): boolean => {
    if (!actingUserId) return false;
    if (req.status !== 'pending') return false;
    if (req.requestedBy === actingUserId) return false;
    return isPartyOfContract(actingUserId, contract);
  };

  const handleAccept = async (changeId: string) => {
    setActionId(changeId);
    try {
      await acceptContractChangeRequest(contractId, changeId);
      openSnackbar({ type: 'success', text: 'Đã chấp nhận thay đổi.', duration: 3000, icon: true });
      load();
      onMutationSuccess?.();
    } catch (err: unknown) {
      const msg = toContractChangeRequestViMessage(err, 'accept');
      openSnackbar({ type: 'error', text: msg, duration: 4500, icon: true });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (changeId: string) => {
    setActionId(changeId);
    try {
      await rejectContractChangeRequest(contractId, changeId);
      openSnackbar({ type: 'success', text: 'Đã từ chối yêu cầu.', duration: 3000, icon: true });
      load();
      onMutationSuccess?.();
    } catch (err: unknown) {
      const msg = toContractChangeRequestViMessage(err, 'reject');
      openSnackbar({ type: 'error', text: msg, duration: 4500, icon: true });
    } finally {
      setActionId(null);
    }
  };

  const statusLabel = (s: ContractChangeRequestDto['status']) => {
    switch (s) {
      case 'pending':
        return 'Chờ phản hồi';
      case 'accepted':
        return 'Đã chấp nhận';
      case 'rejected':
        return 'Đã từ chối';
      default:
        return s;
    }
  };

  const statusColor = (s: ContractChangeRequestDto['status']) => {
    switch (s) {
      case 'pending':
        return colors.functional.warningYellow;
      case 'accepted':
        return colors.primary.agriGreen;
      case 'rejected':
        return colors.functional.alertRed;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <div style={{ marginTop: spacing.md }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
        <Icon name="edit" size="md" color={colors.primary.zaloBlue} />
        <Text.Title size="small" style={{ margin: 0 }}>
          Yêu cầu thay đổi hợp đồng
        </Text.Title>
      </div>
      <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.md, display: 'block' }}>
        Đồng bộ với máy chủ — token Zalo gửi tự động qua Axios.
      </Text>

      {loading ? (
        <Text size="small" style={{ color: colors.text.secondary }}>
          Đang tải danh sách…
        </Text>
      ) : loadError ? (
        <Text size="small" style={{ color: colors.functional.alertRed }}>
          {loadError}
        </Text>
      ) : items.length === 0 ? (
        <Text size="small" style={{ color: colors.text.secondary }}>
          Chưa có yêu cầu chỉnh sửa nào.
        </Text>
      ) : (
        items.map((req) => {
          const showActions = canRespond(req);
          const busy = actionId === req.id;

          return (
            <div
              key={req.id}
              style={{
                padding: spacing.md,
                marginBottom: spacing.md,
                backgroundColor: colors.background.secondary,
                borderRadius: '8px',
                border: `1px solid ${colors.background.tertiary}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  {req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN') : '—'}
                </Text>
                <span
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: '6px',
                    fontSize: fontSize.small,
                    fontWeight: fontWeight.semibold,
                    color: statusColor(req.status),
                    backgroundColor: `${statusColor(req.status)}18`,
                  }}
                >
                  {statusLabel(req.status)}
                </span>
              </div>
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                Người gửi:{' '}
                <strong style={{ color: colors.text.primary }}>
                  {req.requestedBy ? `#${req.requestedBy.slice(-8)}` : '—'}
                </strong>
              </Text>
              {req.reason && (
                <Text size="small" style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
                  {req.reason}
                </Text>
              )}

              <div style={{ marginTop: spacing.sm }}>
                {Object.entries(req.changes).map(([key, diff]) => (
                  <div
                    key={key}
                    style={{
                      padding: spacing.sm,
                      marginBottom: spacing.xs,
                      backgroundColor: colors.background.primary,
                      borderRadius: '6px',
                    }}
                  >
                    <Text size="xSmall" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                      {fieldLabel(key)}
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs, alignItems: 'center' }}>
                      <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                        Cũ:
                      </Text>
                      <Text
                        size="small"
                        style={{ textDecoration: 'line-through', color: colors.functional.alertRed, margin: 0 }}
                      >
                        {formatDiffValue(diff?.oldValue)}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2, alignItems: 'center' }}>
                      <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                        Mới:
                      </Text>
                      <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen, margin: 0 }}>
                        {formatDiffValue(diff?.newValue)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>

              {req.status !== 'pending' && req.respondedAt && (
                <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
                  Phản hồi: {new Date(req.respondedAt).toLocaleString('vi-VN')}
                  {req.respondedBy ? ` · bởi #${req.respondedBy.slice(-8)}` : ''}
                </Text>
              )}

              {req.status === 'pending' && !showActions && (
                <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
                  {!actingUserId
                    ? 'Đăng nhập để xem quyền phản hồi.'
                    : req.requestedBy === actingUserId
                      ? 'Yêu cầu của bạn đang chờ đối tác xử lý.'
                      : 'Bạn không phải bên được quyền phản hồi trên hợp đồng này.'}
                </Text>
              )}

              {showActions && (
                <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
                  <div style={{ flex: 1 }}>
                    <Button variant="primary" size="small" disabled={busy} onClick={() => handleAccept(req.id)}>
                      {busy ? '…' : 'Chấp nhận'}
                    </Button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Button variant="outline" size="small" disabled={busy} onClick={() => handleReject(req.id)}>
                      Từ chối
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ContractChangeRequestsPanel;
