/**
 * TraderConnectionDetailScreen — FR-T08
 *
 * Hiển thị chi tiết một kết nối đã được chấp nhận và cho phép thương lái
 * chuyển trạng thái: accepted → negotiating → signed.
 *
 * Data: nhận từ navigation state (khi navigate từ ConnectionRequestsScreen)
 *       hoặc fetch lại từ listConnections khi cần.
 */

import React, { useState } from 'react';
import { Page, Text, useNavigate, useParams } from 'zmp-ui';
import { useLocation } from 'react-router-dom';
import { Icon } from '../../../design-system/components/Icon';
import { Button } from '../../../design-system/components/Button';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import type { ConnectionDto } from '@/services/connectionService';
import { CreateFarmerContractModal } from '../transactions/components/CreateFarmerContractModal';
import type { ContractDto } from '@/services/contractService';

// ── Types ─────────────────────────────────────────────────────────────────────

type ConnectionStatus = ConnectionDto['status'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatViDate(iso: string): string {
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

// ── Status progression config ─────────────────────────────────────────────────

const STAGES: { key: ConnectionStatus; label: string }[] = [
  { key: 'pending', label: 'Chờ phản hồi' },
  { key: 'accepted', label: 'Đã kết nối' },
  { key: 'negotiating', label: 'Đàm phán' },
  { key: 'signed', label: 'Đã ký' },
];

function stageIndex(status: ConnectionStatus): number {
  return STAGES.findIndex((s) => s.key === status);
}

// ── StatusProgressBar ─────────────────────────────────────────────────────────

const StatusProgressBar: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const currentIdx = stageIndex(status);

  return (
    <div style={{ padding: `${spacing.md} ${spacing.md} 0` }}>
      <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.sm, color: colors.text.secondary }}>
        Tiến trình hợp tác
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STAGES.map((stage, idx) => {
          const isDone = idx <= currentIdx;
          const isActive = idx === currentIdx;
          const isLast = idx === STAGES.length - 1;
          return (
            <React.Fragment key={stage.key}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: isDone
                      ? (isActive ? colors.primary.agriGreen : `${colors.primary.agriGreen}99`)
                      : colors.background.secondary,
                    border: `2px solid ${isDone ? colors.primary.agriGreen : '#D0D0D0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {isDone && !isActive && (
                    <Icon name="check" size="sm" color="#fff" />
                  )}
                  {isActive && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fff' }} />
                  )}
                </div>
                <Text
                  size="xSmall"
                  style={{
                    marginTop: 4,
                    color: isDone ? colors.primary.agriGreen : colors.text.secondary,
                    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    fontSize: '10px',
                  }}
                >
                  {stage.label}
                </Text>
              </div>
              {!isLast && (
                <div
                  style={{
                    height: 2,
                    flex: 1,
                    backgroundColor: idx < currentIdx ? colors.primary.agriGreen : '#D0D0D0',
                    marginBottom: 20,
                    transition: 'background-color 0.2s',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TraderConnectionDetailScreenProps {
  connection?: ConnectionDto;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export const TraderConnectionDetailScreen: React.FC<TraderConnectionDetailScreenProps> = ({
  connection: connectionProp,
}) => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const location = useLocation();
  // Ưu tiên prop, rồi đến navigation state (khi navigate từ ConnectionRequestsScreen)
  const stateConnection = (location.state as { connection?: ConnectionDto } | null)?.connection;
  const [connection, setConnection] = useState<ConnectionDto | null>(connectionProp ?? stateConnection ?? null);
  const [showCreateContract, setShowCreateContract] = useState(false);

  const farmerUserId = connection
    ? (connection.fromRole === 'farmer' ? connection.fromUserId : connection.toUserId)
    : '';

  const handleContractCreated = (contract: ContractDto) => {
    setShowCreateContract(false);
    // Optionally move connection to negotiating visually
    if (connection && connection.status === 'accepted') {
      setConnection({ ...connection, status: 'negotiating' });
    }
    void contract; // used by caller via onCreated if needed
  };

  if (!connection) {
    return (
      <Page>
        <div style={{ padding: spacing.md, display: 'flex', alignItems: 'center', gap: spacing.md, borderBottom: `1px solid ${colors.background.secondary}` }}>
          <button
            onClick={() => navigate('/trader/connections')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: spacing.xs, display: 'flex' }}
          >
            <Icon name="chevron-left" size="md" color={colors.text.primary} />
          </button>
          <Text.Title size="small" style={{ margin: 0 }}>Chi tiết kết nối</Text.Title>
        </div>
        <div style={{ padding: spacing.xl, textAlign: 'center' }}>
          <Icon name="users" size="lg" color={colors.text.secondary} />
          <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>
            Không tìm thấy thông tin kết nối (ID: {params.id})
          </Text>
          <div style={{ marginTop: spacing.md }}>
            <Button variant="outline" size="small" onClick={() => navigate('/trader/connections')}>
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  const farmerLabel = `Nông dân (...${connection.fromUserId.slice(-4)})`;
  const statusColor: Record<ConnectionStatus, string> = {
    pending: colors.functional.warningYellow,
    accepted: colors.primary.agriGreen,
    rejected: colors.functional.alertRed,
    negotiating: colors.primary.zaloBlue,
    signed: '#9B59B6',
  };
  const statusLabel: Record<ConnectionStatus, string> = {
    pending: 'Chờ phản hồi',
    accepted: 'Đã kết nối',
    rejected: 'Đã từ chối',
    negotiating: 'Đang đàm phán',
    signed: 'Đã ký kết',
  };

  return (
    <Page className="trader-connection-detail-screen">
      {/* Header */}
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <button
          onClick={() => navigate('/trader/connections')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: spacing.xs, display: 'flex', alignItems: 'center' }}
          aria-label="Quay lại"
        >
          <Icon name="chevron-left" size="md" color={colors.text.primary} />
        </button>
        <div style={{ flex: 1 }}>
          <Text.Title size="small" style={{ margin: 0 }}>Chi tiết kết nối</Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {farmerLabel}
          </Text>
        </div>
        <span
          style={{
            padding: `2px ${spacing.sm}`,
            borderRadius: 99,
            fontSize: fontSize.small,
            fontWeight: fontWeight.semibold,
            backgroundColor: `${statusColor[connection.status]}18`,
            color: statusColor[connection.status],
          }}
        >
          {statusLabel[connection.status]}
        </span>
      </div>

      <div style={{ padding: spacing.md, paddingBottom: 100, overflowY: 'auto' }}>

        {/* Status progress bar */}
        {connection.status !== 'rejected' && (
          <div
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              marginBottom: spacing.md,
              paddingBottom: spacing.md,
            }}
          >
            <StatusProgressBar status={connection.status} />
          </div>
        )}

        {/* Partner info card */}
        <div
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            padding: spacing.md,
            marginBottom: spacing.md,
            borderLeft: `4px solid ${statusColor[connection.status]}`,
          }}
        >
          <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 52,
                height: 52,
                minWidth: 52,
                borderRadius: '50%',
                backgroundColor: colors.primary.agriGreen,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: fontWeight.semibold,
                fontSize: fontSize.h2,
              }}
            >
              N
            </div>
            <div style={{ flex: 1 }}>
              <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                {farmerLabel}
              </Text>
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                Nông dân
              </Text>
            </div>
          </div>
        </div>

        {/* Connection details */}
        <div
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            padding: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.sm }}>
            Thông tin kết nối
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="xSmall" style={{ color: colors.text.secondary }}>Ngày gửi yêu cầu</Text>
              <Text size="xSmall" style={{ fontWeight: fontWeight.semibold }}>
                {formatViDate(connection.createdAt)}
              </Text>
            </div>
            {connection.respondedAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text size="xSmall" style={{ color: colors.text.secondary }}>Ngày phản hồi</Text>
                <Text size="xSmall" style={{ fontWeight: fontWeight.semibold }}>
                  {formatViDate(connection.respondedAt)}
                </Text>
              </div>
            )}
            {connection.farmId && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text size="xSmall" style={{ color: colors.text.secondary }}>Vườn liên quan</Text>
                <Text size="xSmall" style={{ fontWeight: fontWeight.semibold }}>
                  {connection.farmName ?? `Vườn #${connection.farmId.slice(0, 8)}`}
                </Text>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="xSmall" style={{ color: colors.text.secondary }}>Mã kết nối</Text>
              <Text size="xSmall" style={{ color: colors.text.secondary }}>
                #{connection.id.slice(0, 8)}
              </Text>
            </div>
          </div>

          {connection.message && (
            <div
              style={{
                marginTop: spacing.md,
                padding: spacing.sm,
                backgroundColor: colors.background.secondary,
                borderRadius: 8,
              }}
            >
              <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: 2 }}>
                Lời nhắn từ nông dân:
              </Text>
              <Text size="small" style={{ fontStyle: 'italic' }}>
                "{connection.message}"
              </Text>
            </div>
          )}
        </div>

        {/* Stage-specific action guidance */}
        {connection.status === 'accepted' && (
          <div
            style={{
              backgroundColor: `${colors.primary.agriGreen}12`,
              borderRadius: 12,
              padding: spacing.md,
              marginBottom: spacing.md,
              border: `1px solid ${colors.primary.agriGreen}30`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Icon name="check" size="sm" color={colors.primary.agriGreen} />
              <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen }}>
                Kết nối đã được chấp nhận
              </Text>
            </div>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Tạo hợp đồng bao tiêu để chính thức hóa điều khoản hợp tác với nông dân này.
            </Text>
          </div>
        )}

        {connection.status === 'negotiating' && (
          <div
            style={{
              backgroundColor: `${colors.primary.zaloBlue}12`,
              borderRadius: 12,
              padding: spacing.md,
              marginBottom: spacing.md,
              border: `1px solid ${colors.primary.zaloBlue}30`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Icon name="list" size="sm" color={colors.primary.zaloBlue} />
              <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.zaloBlue }}>
                Đang trong quá trình đàm phán
              </Text>
            </div>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Đã có hợp đồng đang chờ ký. Bạn có thể tạo thêm hợp đồng bao tiêu cho mùa vụ mới.
            </Text>
          </div>
        )}

        {connection.status === 'signed' && (
          <div
            style={{
              backgroundColor: '#9B59B612',
              borderRadius: 12,
              padding: spacing.md,
              marginBottom: spacing.md,
              border: '1px solid #9B59B630',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Icon name="star" size="sm" color="#9B59B6" />
              <Text size="small" style={{ fontWeight: fontWeight.semibold, color: '#9B59B6' }}>
                Hợp đồng đã được ký kết
              </Text>
            </div>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Hợp tác đã chính thức xác nhận. Bạn có thể theo dõi quá trình thực hiện.
            </Text>
          </div>
        )}
      </div>

      {/* Sticky action bar — tạo hợp đồng khi accepted hoặc negotiating */}
      {(connection.status === 'accepted' || connection.status === 'negotiating') && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: spacing.md,
            backgroundColor: colors.background.primary,
            borderTop: `1px solid ${colors.background.secondary}`,
            boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <button
            onClick={() => setShowCreateContract(true)}
            style={{
              width: '100%',
              padding: `${spacing.md} ${spacing.lg}`,
              backgroundColor: colors.primary.agriGreen,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: fontSize.body,
              fontWeight: fontWeight.semibold,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            📄 Tạo hợp đồng bao tiêu
          </button>
        </div>
      )}

      {showCreateContract && (
        <CreateFarmerContractModal
          visible
          farmerUserId={farmerUserId}
          farmId={connection.farmId ?? null}
          onClose={() => setShowCreateContract(false)}
          onCreated={handleContractCreated}
        />
      )}
    </Page>
  );
};

export default TraderConnectionDetailScreen;
