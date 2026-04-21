/**
 * Chuông thông báo trên thanh điều hướng buyer — Phase 15.2 (API thật).
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

/** Đồng bộ với BuyerProfileNotificationScreen (mở đúng tab sau khi bấm chuông). */
export const BUYER_ME_TAB_STORAGE_KEY = 'trustagri.buyerMe.tab';

export const BuyerNotificationBell: React.FC = () => {
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
      aria-label="Thông báo"
      onClick={() => {
        try {
          sessionStorage.setItem(BUYER_ME_TAB_STORAGE_KEY, 'notifications');
        } catch {
          /* ignore */
        }
        navigate('/buyer/me');
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
      <Icon name="notification" size="md" color={colors.text.primary} />
      {badge}
    </button>
  );
};
