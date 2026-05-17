/**
 * SelectConnectionModal — Chọn nông dân từ danh sách kết nối đã chấp nhận để tạo hợp đồng.
 * Hiển thị các kết nối có status: accepted | negotiating | signed.
 */
import React, { useState, useEffect } from 'react';
import { Text } from 'zmp-ui';
import {
  listConnections,
  toConnectionViMessage,
  type ConnectionDto,
} from '@/services/connectionService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export interface SelectedConnectionInfo {
  farmerUserId: string;
  farmId: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelected: (info: SelectedConnectionInfo) => void;
}

const ELIGIBLE_STATUSES = new Set(['accepted', 'negotiating', 'signed']);

function getFarmerUserId(conn: ConnectionDto): string {
  return conn.fromRole === 'farmer' ? conn.fromUserId : conn.toUserId;
}

function getFarmerDisplayName(conn: ConnectionDto): string {
  const name =
    conn.fromRole === 'farmer' ? conn.fromUserName : conn.toUserName;
  const id = getFarmerUserId(conn);
  return name ?? `Nông dân #${id.slice(0, 8)}`;
}

function getFarmDisplayLabel(conn: ConnectionDto): string | null {
  if (!conn.farmId) return null;
  return conn.farmName ?? `Vườn #${conn.farmId.slice(0, 8)}`;
}

export const SelectConnectionModal: React.FC<Props> = ({ visible, onClose, onSelected }) => {
  const openSnackbar = useStableOpenSnackbar();
  const [connections, setConnections] = useState<ConnectionDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    listConnections({ status: 'all', limit: 100 })
      .then((res) => {
        setConnections(
          res.items.filter(
            (c) =>
              ELIGIBLE_STATUSES.has(c.status) &&
              (c.fromRole === 'farmer' || c.toRole === 'farmer'),
          ),
        );
      })
      .catch((err) => {
        openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'list'), duration: 3000, icon: true });
      })
      .finally(() => setLoading(false));
  }, [visible, openSnackbar]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.background.primary,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          borderBottom: `1px solid ${colors.background.secondary}`,
          position: 'sticky',
          top: 0,
          backgroundColor: colors.background.primary,
          zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: colors.text.primary,
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ✕
        </button>
        <div>
          <Text.Title size="small" style={{ margin: 0 }}>
            Chọn nông dân
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            Chọn kết nối để tạo hợp đồng bao tiêu
          </Text>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: spacing.md }}>
        {loading && <SkeletonList />}

        {!loading && connections.length === 0 && (
          <div style={{ textAlign: 'center', padding: `${spacing.xl} 0` }}>
            <div style={{ fontSize: 48, marginBottom: spacing.md }}>🤝</div>
            <Text.Title size="small" style={{ marginBottom: spacing.sm }}>
              Chưa có kết nối nào
            </Text.Title>
            <Text size="xSmall" style={{ color: colors.text.secondary, lineHeight: '1.5' }}>
              Bạn cần có kết nối được chấp nhận với nông dân để tạo hợp đồng.
            </Text>
          </div>
        )}

        {!loading &&
          connections.map((conn) => {
            const farmerUserId = getFarmerUserId(conn);
            return (
              <ConnectionCard
                key={conn.id}
                farmerDisplayName={getFarmerDisplayName(conn)}
                farmLabel={getFarmDisplayLabel(conn)}
                onSelect={() =>
                  onSelected({ farmerUserId, farmId: conn.farmId ?? null })
                }
              />
            );
          })}
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SkeletonList: React.FC = () => (
  <div>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          height: 72,
          backgroundColor: colors.background.secondary,
          borderRadius: 8,
          marginBottom: spacing.md,
        }}
      />
    ))}
  </div>
);

const ConnectionCard: React.FC<{
  farmerDisplayName: string;
  farmLabel: string | null;
  onSelect: () => void;
}> = ({ farmerDisplayName, farmLabel, onSelect }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onSelect}
    onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    style={{
      backgroundColor: colors.background.primary,
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: spacing.md,
      padding: spacing.md,
      cursor: 'pointer',
      minHeight: 44,
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        backgroundColor: `${colors.primary.agriGreen}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        flexShrink: 0,
      }}
    >
      🧑‍🌾
    </div>
    <div style={{ flex: 1 }}>
      <Text
        style={{
          fontWeight: fontWeight.semibold,
          fontSize: fontSize.body,
          display: 'block',
          color: colors.text.primary,
        }}
      >
        {farmerDisplayName}
      </Text>
      {farmLabel && (
        <Text size="xSmall" style={{ color: colors.text.secondary }}>
          {farmLabel}
        </Text>
      )}
      {!farmLabel && (
        <Text size="xSmall" style={{ color: colors.text.secondary }}>
          Chưa liên kết vườn
        </Text>
      )}
    </div>
    <span style={{ color: colors.text.secondary, fontSize: 20, lineHeight: 1 }}>›</span>
  </div>
);
