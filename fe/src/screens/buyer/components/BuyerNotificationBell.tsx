/**
 * Buyer-specific wrapper quanh shared NotificationBell.
 * Giữ behavior cũ: click → mở tab "Thông báo" trong /buyer/me (BuyerProfileNotificationScreen).
 *
 * @deprecated Khuyến khích dùng `NotificationBell` (components/NotificationBell.tsx) với targetPath='/notifications'.
 */

import React from 'react';
import { NotificationBell } from '@/components/NotificationBell';

/** Đồng bộ với BuyerProfileNotificationScreen (mở đúng tab sau khi bấm chuông). */
export const BUYER_ME_TAB_STORAGE_KEY = 'trustagri.buyerMe.tab';

export const BuyerNotificationBell: React.FC = () => (
  <NotificationBell
    targetPath="/buyer/me"
    onClickBefore={() => {
      try {
        sessionStorage.setItem(BUYER_ME_TAB_STORAGE_KEY, 'notifications');
      } catch {
        /* ignore */
      }
    }}
  />
);
