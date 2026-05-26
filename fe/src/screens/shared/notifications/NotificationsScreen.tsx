/**
 * NotificationsScreen — Trung tâm thông báo dùng chung cho mọi role (FR-F08, Phase 15).
 *
 * Hiển thị list `/api/v1/notifications` + nút "Đọc tất cả".
 * Click item → markAsRead + navigate `notification.linkTo` (nếu có).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Page, Text, Spinner, useNavigate } from 'zmp-ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { Icon } from '@/design-system/components/Icon';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  toNotificationViMessage,
  type NotificationDto,
} from '@/services/notificationService';
import { notificationUnreadCountAtom } from '@/state/notificationBadgeAtom';
import { currentRoleAtom } from '@/state/authAtoms';
import { RoleBottomNav } from '@/navigation/RoleBottomNav';

const SEVERITY_COLOR: Record<NonNullable<NotificationDto['severity']>, string> = {
  info: colors.primary.zaloBlue,
  warning: colors.functional.warningYellow,
  danger: colors.functional.alertRed,
};

const TYPE_LABEL: Record<NotificationDto['type'], string> = {
  alert: 'Cảnh báo',
  contract: 'Hợp đồng',
  connection: 'Kết nối',
  system: 'Hệ thống',
};

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return iso;
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export const NotificationsScreen: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();
  const navigate = useNavigate();
  const setUnread = useSetAtom(notificationUnreadCountAtom);
  const role = useAtomValue(currentRoleAtom);

  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingAll, setReadingAll] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications({ page: 1, limit: 50 });
      setItems(res.items);
      const unread = res.items.filter((n) => !n.read).length;
      setUnread(unread);
    } catch (err) {
      openSnackbar({ type: 'error', text: toNotificationViMessage(err, 'list'), duration: 4000, icon: true });
    } finally {
      setLoading(false);
    }
  }, [openSnackbar, setUnread]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleItemClick = useCallback(
    async (n: NotificationDto) => {
      if (!n.read) {
        try {
          await markNotificationRead(n.id);
          setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
          setUnread((c) => Math.max(0, c - 1));
        } catch (err) {
          openSnackbar({
            type: 'error',
            text: toNotificationViMessage(err, 'read'),
            duration: 3500,
            icon: true,
          });
        }
      }
      if (n.linkTo) {
        navigate(n.linkTo);
      }
    },
    [navigate, openSnackbar, setUnread],
  );

  const handleReadAll = useCallback(async () => {
    if (readingAll) return;
    setReadingAll(true);
    try {
      const res = await markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
      openSnackbar({
        type: 'success',
        text: `Đã đánh dấu ${res.updated} thông báo là đã đọc.`,
        duration: 2500,
      });
    } catch (err) {
      openSnackbar({
        type: 'error',
        text: toNotificationViMessage(err, 'readAll'),
        duration: 4000,
        icon: true,
      });
    } finally {
      setReadingAll(false);
    }
  }, [openSnackbar, readingAll, setUnread]);

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <Page>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.md,
          borderBottom: `1px solid ${colors.background.secondary}`,
          backgroundColor: colors.background.primary,
        }}
      >
        <div>
          <Text.Title size="small" style={{ margin: 0 }}>
            Thông báo
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Đã đọc hết'}
          </Text>
        </div>
        <button
          type="button"
          onClick={() => void handleReadAll()}
          disabled={readingAll || unreadCount === 0}
          style={{
            padding: `${spacing.xs} ${spacing.md}`,
            backgroundColor: unreadCount === 0 ? colors.background.secondary : colors.primary.zaloBlue,
            color: unreadCount === 0 ? colors.text.secondary : colors.text.inverse,
            border: 'none',
            borderRadius: 8,
            fontSize: fontSize.small,
            fontWeight: fontWeight.medium,
            cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {readingAll ? 'Đang lưu…' : 'Đọc tất cả'}
        </button>
      </div>

      <div style={{ padding: spacing.md, paddingBottom: '80px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xl }}>
            <Spinner />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
            <div style={{ fontSize: 48, marginBottom: spacing.md }}>🔔</div>
            <Text>Chưa có thông báo nào.</Text>
          </div>
        )}

        {items.map((n) => {
          const sevColor = n.severity ? SEVERITY_COLOR[n.severity] : colors.text.secondary;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => void handleItemClick(n)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: spacing.md,
                marginBottom: spacing.sm,
                backgroundColor: n.read ? colors.background.primary : `${colors.primary.zaloBlue}08`,
                border: `1px solid ${colors.background.secondary}`,
                borderLeft: `3px solid ${sevColor}`,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                gap: spacing.sm,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: `${sevColor}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="notification" size="sm" color={sevColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm }}>
                  <Text size="small" style={{ fontWeight: n.read ? fontWeight.regular : fontWeight.semibold, margin: 0 }}>
                    {n.title}
                  </Text>
                  <Text size="xSmall" style={{ color: colors.text.secondary, flexShrink: 0 }}>
                    {formatRelative(n.createdAt)}
                  </Text>
                </div>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: `${spacing.xs} 0 0` }}>
                  [{TYPE_LABEL[n.type] ?? n.type}] {n.body}
                </Text>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom nav — screen nằm ngoài RoleAppShell nên tự render nav theo role hiện tại */}
      {role && role !== 'guest' && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            backgroundColor: colors.background.primary,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            borderTop: `1px solid ${colors.background.secondary}`,
          }}
        >
          <RoleBottomNav role={role} />
        </div>
      )}
    </Page>
  );
};

export default NotificationsScreen;
