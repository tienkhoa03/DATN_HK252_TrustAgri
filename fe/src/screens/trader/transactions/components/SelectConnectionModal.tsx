/**
 * SelectConnectionModal — Chọn nông dân từ danh sách kết nối đã chấp nhận để tạo hợp đồng.
 * Hiển thị các kết nối có status: accepted.
 */
import React, { useState, useEffect } from 'react';
import { Text } from 'zmp-ui';
import {
  listConnections,
  toConnectionViMessage,
  type ConnectionDto,
} from '@/services/connectionService';
import { listContracts } from '@/services/contractService';
import { getUserById } from '@/services/authService';
import { getFarm } from '@/services/farmService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { farmDisplayLabel, userDisplayLabel } from '@/utils/displayLabels';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export interface SelectedConnectionInfo {
  farmerUserId: string;
  farmId: string | null;
  farmerDisplayName: string;
  farmerPhone?: string | null;
  farmName: string | null;
}

/** Một dòng kết nối đã resolve tên hiển thị (denorm DB hoặc gọi auth/farm). */
interface ConnectionListItem {
  conn: ConnectionDto;
  farmerUserId: string;
  farmerDisplayName: string;
  farmLabel: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelected: (info: SelectedConnectionInfo) => void;
}

const ELIGIBLE_STATUSES = new Set(['accepted']);

function getFarmerUserId(conn: ConnectionDto): string {
  return conn.fromRole === 'farmer' ? conn.fromUserId : conn.toUserId;
}

function farmerNameFromConn(conn: ConnectionDto): string | null | undefined {
  return conn.fromRole === 'farmer' ? conn.fromUserName : conn.toUserName;
}

function farmerPhoneFromConn(conn: ConnectionDto): string | null | undefined {
  return conn.fromRole === 'farmer' ? conn.fromUserPhone : conn.toUserPhone;
}

async function resolveFarmerDisplayName(
  conn: ConnectionDto,
  farmerUserId: string,
): Promise<string> {
  const cachedName = farmerNameFromConn(conn);
  const cachedPhone = farmerPhoneFromConn(conn);
  if (cachedName?.trim()) {
    return userDisplayLabel(cachedName, farmerUserId, 'Nông dân', cachedPhone);
  }

  const user = await getUserById(farmerUserId);
  return userDisplayLabel(user?.displayName, farmerUserId, 'Nông dân', user?.phone ?? cachedPhone);
}

async function resolveFarmLabel(
  conn: ConnectionDto,
): Promise<string | null> {
  if (!conn.farmId) return null;
  if (conn.farmName?.trim()) return conn.farmName.trim();

  try {
    const farm = await getFarm(conn.farmId);
    return farmDisplayLabel(farm.name, conn.farmId);
  } catch {
    // graceful — fallback id
  }

  return farmDisplayLabel(conn.farmName, conn.farmId);
}

async function enrichConnections(
  items: ConnectionDto[],
): Promise<ConnectionListItem[]> {
  return Promise.all(
    items.map(async (conn) => {
      const farmerUserId = getFarmerUserId(conn);
      const [farmerDisplayName, farmLabel] = await Promise.all([
        resolveFarmerDisplayName(conn, farmerUserId),
        resolveFarmLabel(conn),
      ]);
      return { conn, farmerUserId, farmerDisplayName, farmLabel };
    }),
  );
}

export const SelectConnectionModal: React.FC<Props> = ({ visible, onClose, onSelected }) => {
  const openSnackbar = useStableOpenSnackbar();
  const [items, setItems] = useState<ConnectionListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setItems([]);

    void (async () => {
      try {
        const [connectionsRes, activeRes, pendingRes] = await Promise.all([
          listConnections({ status: 'all', limit: 100 }),
          listContracts({ role: 'trader', status: 'active', limit: 100 }),
          listContracts({ role: 'trader', status: 'pending_signature', limit: 100 }),
        ]);

        // Các farmId đang có hợp đồng chưa kết thúc (active hoặc chờ ký)
        const busyFarmIds = new Set(
          [
            ...activeRes.items.map((c) => c.farmId),
            ...pendingRes.items.map((c) => c.farmId),
          ].filter((id): id is string => Boolean(id)),
        );

        const eligible = connectionsRes.items.filter(
          (c) =>
            ELIGIBLE_STATUSES.has(c.status) &&
            (c.fromRole === 'farmer' || c.toRole === 'farmer') &&
            // Ẩn kết nối nếu vườn liên kết đã có hợp đồng đang thực hiện
            (!c.farmId || !busyFarmIds.has(c.farmId)),
        );
        const enriched = await enrichConnections(eligible);
        if (!cancelled) setItems(enriched);
      } catch (err) {
        if (!cancelled) {
          openSnackbar({
            type: 'error',
            text: toConnectionViMessage(err, 'list'),
            duration: 3000,
            icon: true,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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

        {!loading && items.length === 0 && (
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
          items.map(({ conn, farmerUserId, farmerDisplayName, farmLabel }) => (
            <ConnectionCard
              key={conn.id}
              farmerDisplayName={farmerDisplayName}
              farmLabel={farmLabel}
              onSelect={() =>
                onSelected({
                  farmerUserId,
                  farmId: conn.farmId ?? null,
                  farmerDisplayName,
                  farmerPhone: farmerPhoneFromConn(conn) ?? null,
                  farmName: farmLabel,
                })
              }
            />
          ))}
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
