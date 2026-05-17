/**
 * Connection Requests Screen — Phase 8.2 Integration (FR-F03, FR-T08)
 *
 * Dùng chung cho nông dân (/farmer/connections) và thương lái (/trader/connections).
 * Tabs: "Nhận được" (incoming all) | "Đã gửi" (outgoing all)
 *
 * Data: connectionService → Axios thật (GET /api/v1/connections, POST accept/reject)
 * Token: gắn tự động bởi interceptor — không cần truyền userId.
 * Lỗi: ApiError → Snackbar tiếng Việt qua toConnectionViMessage.
 *
 * Ghi chú push notification: Push alert khi có yêu cầu mới được liên kết Phase 15.
 * Hiện tại màn reload data khi mount (pull-to-refresh có thể thêm sau).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Text } from 'zmp-ui';
import { useNavigate } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { Button } from '../../../design-system/components/Button';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listConnections,
  acceptConnection,
  rejectConnection,
  toConnectionViMessage,
} from '@/services/connectionService';
import type { ConnectionDto } from '@/services/connectionService';
import { connectionCounterpartDisplay } from '@/utils/displayLabels';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes || 1} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return '1 ngày trước';
  return `${days} ngày trước`;
}

function counterpartLabel(conn: ConnectionDto, _myRole: 'farmer' | 'trader', direction: 'incoming' | 'outgoing'): string {
  return connectionCounterpartDisplay(conn, direction);
}

const STATUS_LABEL: Record<ConnectionDto['status'], string> = {
  pending: 'Chờ phản hồi',
  accepted: 'Đã kết nối',
  rejected: 'Đã từ chối',
  negotiating: 'Đang đàm phán',
  signed: 'Đã ký kết',
};

const STATUS_COLOR: Record<ConnectionDto['status'], string> = {
  pending: colors.functional.warningYellow,
  accepted: colors.primary.agriGreen,
  rejected: colors.functional.alertRed,
  negotiating: colors.primary.zaloBlue,
  signed: '#9B59B6',
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ width?: string; height?: string; br?: string }> = ({
  width = '100%', height = '14px', br = '4px',
}) => (
  <div
    className="skeleton-pulse"
    style={{ width, height, borderRadius: br, backgroundColor: colors.background.secondary }}
  />
);

const ConnectionCardSkeleton: React.FC = () => (
  <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: spacing.md }}>
    <div style={{ display: 'flex', gap: spacing.md }}>
      <SkeletonBlock width="48px" height="48px" br="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        <SkeletonBlock width="50%" height="16px" />
        <SkeletonBlock width="35%" height="12px" />
        <SkeletonBlock width="80%" height="12px" />
        <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.xs }}>
          <SkeletonBlock width="45%" height="34px" br="8px" />
          <SkeletonBlock width="45%" height="34px" br="8px" />
        </div>
      </div>
    </div>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: spacing.xl, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md }}>
    <Icon name="users" size="lg" color={colors.text.secondary} />
    <Text size="small" style={{ color: colors.text.secondary }}>{message}</Text>
  </div>
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ConnectionRequestsScreenProps {
  role?: 'farmer' | 'trader';
}

// ── Screen component ──────────────────────────────────────────────────────────

export const ConnectionRequestsScreen: React.FC<ConnectionRequestsScreenProps> = ({
  role = 'farmer',
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  // ── Incoming connections (GET /api/v1/connections?role=incoming) ───────────
  const [incoming, setIncoming] = useState<ConnectionDto[]>([]);
  const [isIncomingLoading, setIsIncomingLoading] = useState(true);
  const incomingLoadedRef = useRef(false);

  const loadIncoming = useCallback(async () => {
    if (incomingLoadedRef.current) return;
    setIsIncomingLoading(true);
    try {
      const res = await listConnections({ role: 'incoming' });
      setIncoming(res.items);
      incomingLoadedRef.current = true;
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'list'), duration: 3500, icon: true });
    } finally {
      setIsIncomingLoading(false);
    }
  }, [openSnackbar]);

  // ── Outgoing connections (GET /api/v1/connections?role=outgoing) ───────────
  const [outgoing, setOutgoing] = useState<ConnectionDto[]>([]);
  const [isOutgoingLoading, setIsOutgoingLoading] = useState(true);
  const outgoingLoadedRef = useRef(false);

  const loadOutgoing = useCallback(async () => {
    if (outgoingLoadedRef.current) return;
    setIsOutgoingLoading(true);
    try {
      const res = await listConnections({ role: 'outgoing' });
      setOutgoing(res.items);
      outgoingLoadedRef.current = true;
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'list'), duration: 3500, icon: true });
    } finally {
      setIsOutgoingLoading(false);
    }
  }, [openSnackbar]);

  useEffect(() => {
    loadIncoming();
    loadOutgoing();
  }, [loadIncoming, loadOutgoing]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});

  const handleAccept = async (conn: ConnectionDto) => {
    setPendingActions((p) => ({ ...p, [conn.id]: true }));
    try {
      await acceptConnection(conn.id);
      setIncoming((prev) =>
        prev.map((c) =>
          c.id === conn.id
            ? { ...c, status: 'accepted', respondedAt: new Date().toISOString() }
            : c,
        ),
      );
      openSnackbar({ type: 'success', text: 'Đã chấp nhận yêu cầu kết nối thành công.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setPendingActions((p) => { const n = { ...p }; delete n[conn.id]; return n; });
    }
  };

  const handleReject = async (conn: ConnectionDto) => {
    setPendingActions((p) => ({ ...p, [conn.id]: true }));
    try {
      await rejectConnection(conn.id);
      setIncoming((prev) =>
        prev.map((c) =>
          c.id === conn.id
            ? { ...c, status: 'rejected', respondedAt: new Date().toISOString() }
            : c,
        ),
      );
      openSnackbar({ type: 'success', text: 'Đã từ chối yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setPendingActions((p) => { const n = { ...p }; delete n[conn.id]; return n; });
    }
  };

  // ── Derived counts ────────────────────────────────────────────────────────
  const incomingPendingCount = incoming.filter((c) => c.status === 'pending').length;

  // ── Styles ────────────────────────────────────────────────────────────────
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${active ? colors.primary.zaloBlue : 'transparent'}`,
    color: active ? colors.primary.zaloBlue : colors.text.secondary,
    fontSize: fontSize.body,
    fontWeight: active ? fontWeight.semibold : fontWeight.regular,
    cursor: 'pointer',
  });

  const statusBadge = (status: ConnectionDto['status']): React.CSSProperties => ({
    display: 'inline-block',
    padding: `2px ${spacing.sm}`,
    borderRadius: 99,
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    backgroundColor: `${STATUS_COLOR[status]}18`,
    color: STATUS_COLOR[status],
  });

  const roleLabel = role === 'trader' ? 'Nông dân' : 'Thương lái';
  const backPath = role === 'trader' ? '/trader/supply' : '/farmer/connect';

  return (
    <Page className="connection-requests-screen">
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        .skeleton-pulse { animation: skeleton-pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderBottom: `1px solid ${colors.background.secondary}`, display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <button
          onClick={() => navigate(backPath)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: spacing.xs, display: 'flex', alignItems: 'center' }}
          aria-label="Quay lại"
        >
          <Icon name="chevron-left" size="md" color={colors.text.primary} />
        </button>
        <div>
          <Text.Title size="small" style={{ margin: 0 }}>Quản lý Kết nối</Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            Yêu cầu kết nối với {roleLabel}
          </Text>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${colors.background.secondary}`, backgroundColor: colors.background.primary }}>
        <button style={tabBtn(activeTab === 'incoming')} onClick={() => setActiveTab('incoming')}>
          📥 Nhận được
          {incomingPendingCount > 0 && (
            <span style={{ marginLeft: 6, backgroundColor: colors.functional.alertRed, color: '#fff', borderRadius: 99, padding: '0 6px', fontSize: 11, fontWeight: fontWeight.semibold }}>
              {incomingPendingCount}
            </span>
          )}
        </button>
        <button style={tabBtn(activeTab === 'outgoing')} onClick={() => setActiveTab('outgoing')}>
          📤 Đã gửi
        </button>
      </div>

      <div style={{ padding: spacing.md, paddingBottom: 80, overflowY: 'auto' }}>

        {/* ── Incoming tab ── */}
        {activeTab === 'incoming' && (
          <>
            {isIncomingLoading ? (
              <><ConnectionCardSkeleton /><ConnectionCardSkeleton /><ConnectionCardSkeleton /></>
            ) : incoming.length === 0 ? (
              <EmptyState message={`Chưa có ${roleLabel.toLowerCase()} nào gửi yêu cầu kết nối đến bạn`} />
            ) : (
              incoming.map((conn) => {
                const isPending = !!pendingActions[conn.id];
                const isActionable = conn.status === 'pending';
                const name = counterpartLabel(conn, role, 'incoming');
                return (
                  <div
                    key={conn.id}
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.background.primary,
                      borderRadius: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                      marginBottom: spacing.md,
                      borderLeft: `3px solid ${STATUS_COLOR[conn.status]}`,
                    }}
                  >
                    <div style={{ display: 'flex', gap: spacing.md }}>
                      <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: '50%', backgroundColor: colors.primary.agriGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.h2 }}>
                        {name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
                          <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>{name}</Text>
                          <span style={statusBadge(conn.status)}>{STATUS_LABEL[conn.status]}</span>
                        </div>
                        <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                          {relativeDate(conn.createdAt)}
                          {conn.respondedAt && ` · Phản hồi ${relativeDate(conn.respondedAt)}`}
                        </Text>
                        {conn.message && (
                          <div style={{ marginTop: spacing.xs, padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: 8 }}>
                            <Text size="small" style={{ color: colors.text.secondary, fontStyle: 'italic', margin: 0 }}>
                              "{conn.message}"
                            </Text>
                          </div>
                        )}
                        {isActionable && (
                          <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
                            <div style={{ flex: 1 }}>
                              <Button
                                variant="primary"
                                size="small"
                                onClick={() => handleAccept(conn)}
                                disabled={isPending}
                              >
                                ✓ Chấp nhận
                              </Button>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => handleReject(conn)}
                                disabled={isPending}
                              >
                                ✕ Từ chối
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── Outgoing tab ── */}
        {activeTab === 'outgoing' && (
          <>
            {isOutgoingLoading ? (
              <><ConnectionCardSkeleton /><ConnectionCardSkeleton /></>
            ) : outgoing.length === 0 ? (
              <EmptyState message={`Bạn chưa gửi yêu cầu kết nối nào tới ${roleLabel.toLowerCase()}`} />
            ) : (
              outgoing.map((conn) => {
                const name = counterpartLabel(conn, role, 'outgoing');
                const isClickable = role === 'trader' && (conn.status === 'accepted' || conn.status === 'negotiating' || conn.status === 'signed');
                return (
                  <div
                    key={conn.id}
                    onClick={isClickable ? () => navigate(`/trader/connections/${conn.id}`, { state: { connection: conn } }) : undefined}
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.background.primary,
                      borderRadius: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                      marginBottom: spacing.md,
                      borderLeft: `3px solid ${STATUS_COLOR[conn.status]}`,
                      cursor: isClickable ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ display: 'flex', gap: spacing.md }}>
                      <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: '50%', backgroundColor: colors.primary.zaloBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.h2 }}>
                        {name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
                          <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>{name}</Text>
                          <span style={statusBadge(conn.status)}>{STATUS_LABEL[conn.status]}</span>
                        </div>
                        <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                          Gửi {relativeDate(conn.createdAt)}
                          {conn.respondedAt && ` · Phản hồi ${relativeDate(conn.respondedAt)}`}
                        </Text>
                        {conn.message && (
                          <div style={{ marginTop: spacing.xs, padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: 8 }}>
                            <Text size="small" style={{ color: colors.text.secondary, fontStyle: 'italic', margin: 0 }}>
                              "{conn.message}"
                            </Text>
                          </div>
                        )}
                        {conn.status === 'pending' && (
                          <Text size="xSmall" style={{ color: colors.functional.warningYellow, marginTop: spacing.xs }}>
                            ⏳ Đang chờ đối tác phản hồi...
                          </Text>
                        )}
                        {conn.status === 'accepted' && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs }}>
                            <Text size="xSmall" style={{ color: colors.primary.agriGreen }}>
                              ✓ Kết nối thành công — nhấn để đàm phán
                            </Text>
                            {role === 'trader' && <Icon name="chevron-right" size="sm" color={colors.text.secondary} />}
                          </div>
                        )}
                        {conn.status === 'negotiating' && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs }}>
                            <Text size="xSmall" style={{ color: colors.primary.zaloBlue }}>
                              📋 Đang đàm phán — nhấn để xem chi tiết
                            </Text>
                            {role === 'trader' && <Icon name="chevron-right" size="sm" color={colors.text.secondary} />}
                          </div>
                        )}
                        {conn.status === 'signed' && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs }}>
                            <Text size="xSmall" style={{ color: '#9B59B6' }}>
                              ✍️ Đã ký kết hợp đồng
                            </Text>
                            {role === 'trader' && <Icon name="chevron-right" size="sm" color={colors.text.secondary} />}
                          </div>
                        )}
                        {conn.status === 'rejected' && (
                          <Text size="xSmall" style={{ color: colors.functional.alertRed, marginTop: spacing.xs }}>
                            Yêu cầu không được chấp nhận
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </Page>
  );
};

export default ConnectionRequestsScreen;
