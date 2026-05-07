/**
 * NotificationBell — chuông thông báo dùng chung cho mọi role (FR-F08, Phase 15.2).
 *
 * Hiển thị badge số notification chưa đọc. Click → navigate tới `targetPath`.
 * Mặc định targetPath = '/notifications' (route shared).
 *
 * Backward-compat: `BuyerNotificationBell` có thể wrap component này với targetPath = '/buyer/me'.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'zmp-ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { Icon } from '@/design-system/components/Icon';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { getUnreadNotificationCount } from '@/services/notificationService';
import { notificationUnreadCountAtom } from '@/state/notificationBadgeAtom';

export interface NotificationBellProps {
  /** Đường dẫn navigate khi click. Mặc định '/notifications'. */
  targetPath?: string;
  /** Hook trước navigate (vd: lưu sessionStorage). */
  onClickBefore?: () => void;
  /** Màu icon. Mặc định text.primary. */
  iconColor?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  targetPath = '/notifications',
  onClickBefore,
  iconColor = colors.text.primary,
}) => {
  const navigate = useNavigate();
  const setUnread = useSetAtom(notificationUnreadCountAtom);
  const unread = useAtomValue(notificationUnreadCountAtom);

  useEffect(() => {
    let cancelled = false;
    getUnreadNotificationCount()
      .then((n) => {
        if (!cancelled) setUnread(n);
      })
      .catch(() => {
        if (!cancelled) setUnread(0);
      });
    return () => {
      cancelled = true;
    };
  }, [setUnread]);

  const badge =
    unread > 0 ? (
      <span
        style={{
          position: 'absolute',
          top: 4,
          right: 2,
          minWidth: 18,
          height: 18,
          padding: '0 5px',
          borderRadius: 9,
          backgroundColor: colors.functional.alertRed,
          color: colors.text.inverse,
          fontSize: fontSize.small,
          fontWeight: fontWeight.bold,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        {unread > 99 ? '99+' : String(unread)}
      </span>
    ) : null;

  return (
    <button
      type="button"
      aria-label={`Thông báo${unread > 0 ? ` (${unread} chưa đọc)` : ''}`}
      onClick={() => {
        try {
          onClickBefore?.();
        } catch {
          /* ignore */
        }
        navigate(targetPath);
      }}
      style={{
        position: 'relative',
        border: 'none',
        background: 'transparent',
        padding: spacing.sm,
        cursor: 'pointer',
        lineHeight: 0,
      }}
    >
      <Icon name="notification" size="md" color={iconColor} />
      {badge}
    </button>
  );
};

export default NotificationBell;
