/**
 * Buyer Profile & Notification Screen — Phase 2.2 + 15.2
 *
 * Tab "Hồ sơ": useProfile() → GET /api/v1/auth/me.
 * Tab "Thông báo": notificationService → GET/POST /api/v1/notifications*.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Page, Text, Spinner, useNavigate } from 'zmp-ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { Icon, IconName } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { useProfile } from '@/hooks/useProfile';
import type { UserProfileDto } from '@/hooks/useProfile';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  toNotificationViMessage,
  type NotificationDto,
} from '@/services/notificationService';
import { notificationLinkToAppPath } from '@/services/notificationNavigation';
import { notificationUnreadCountAtom } from '@/state/notificationBadgeAtom';
import { BUYER_ME_TAB_STORAGE_KEY } from '@/screens/buyer/components/BuyerNotificationBell';

export interface BuyerProfileNotificationScreenProps {
  buyerName?: string;
  buyerAvatar?: string;
  buyerId?: string;
}

type TabType = 'profile' | 'notifications' | 'qr';

function formatRelativeTimeVi(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Vừa xong';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const notificationTypeConfig: Record<
  NotificationDto['type'],
  { icon: IconName; color: string }
> = {
  alert: { icon: 'alert', color: colors.functional.alertRed },
  contract: { icon: 'book', color: colors.primary.zaloBlue },
  connection: { icon: 'users', color: colors.primary.agriGreen },
  system: { icon: 'info', color: colors.text.secondary },
};

function severityAccent(severity: NotificationDto['severity']): string | undefined {
  if (severity === 'danger') return colors.functional.alertRed;
  if (severity === 'warning') return colors.functional.warningYellow;
  if (severity === 'info') return colors.primary.zaloBlue;
  return undefined;
}

/**
 * Buyer Profile & Notification Screen Component
 * Requirements: FR-S03, FR-F06, FR-T06
 */
export const BuyerProfileNotificationScreen: React.FC<BuyerProfileNotificationScreenProps> = ({
  buyerName: buyerNameProp,
  buyerAvatar: buyerAvatarProp,
  buyerId: buyerIdProp,
}) => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const setUnreadGlobal = useSetAtom(notificationUnreadCountAtom);
  const unreadBadge = useAtomValue(notificationUnreadCountAtom);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // ── Tải hồ sơ từ mockProfileService (Phase 2.1) ──────────────────────────
  const { profile, isLoading: profileLoading } = useProfile();

  // Resolve display values: prefer live profile, fallback to props / defaults
  const buyerName   = profile?.displayName   ?? buyerNameProp   ?? 'Người mua';
  const buyerAvatar = profile?.avatarUrl      ?? buyerAvatarProp ?? undefined;
  const buyerId     = profile?.userId         ?? buyerIdProp     ?? 'BU001';

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const syncUnreadBadge = useCallback(async () => {
    try {
      const n = await getUnreadNotificationCount();
      setUnreadGlobal(n);
    } catch {
      setUnreadGlobal(0);
    }
  }, [setUnreadGlobal]);

  const refreshNotifications = useCallback(async (): Promise<boolean> => {
    setNotifLoading(true);
    setNotifError(null);
    try {
      const res = await listNotifications({ page: 1, limit: 50 });
      setNotifications(res.items);
      await syncUnreadBadge();
      return true;
    } catch (err) {
      const msg = toNotificationViMessage(err, 'list');
      setNotifError(msg);
      openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
      return false;
    } finally {
      setNotifLoading(false);
    }
  }, [openSnackbar, syncUnreadBadge]);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(BUYER_ME_TAB_STORAGE_KEY) as TabType | null;
      if (pending === 'notifications' || pending === 'profile' || pending === 'qr') {
        setActiveTab(pending);
      }
      sessionStorage.removeItem(BUYER_ME_TAB_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications') {
      void refreshNotifications();
    }
  }, [activeTab, refreshNotifications]);

  useEffect(() => {
    void syncUnreadBadge();
  }, [syncUnreadBadge]);

  // Styles
  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const tabBarStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const tabStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.primary.zaloBlue}` : '2px solid transparent',
    color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
    fontSize: fontSize.body,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  };

  // Profile Tab Styles
  const profileCardStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  };

  const avatarStyles: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: fontWeight.bold,
    margin: '0 auto',
    marginBottom: spacing.md,
  };

  const nameStyles: React.CSSProperties = {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  };

  const userIdStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  };

  const menuItemStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    padding: spacing.md,
    marginBottom: spacing.sm,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const menuItemLeftStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  };

  const menuItemTextStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  };

  // Notification Tab Styles
  const notificationCardStyles = (isRead: boolean): React.CSSProperties => ({
    backgroundColor: isRead ? colors.background.primary : colors.background.secondary,
    borderRadius: '12px',
    padding: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: isRead ? 'none' : `4px solid ${colors.primary.zaloBlue}`,
  });

  const notificationHeaderStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  };

  const notificationIconWrapperStyles = (color: string): React.CSSProperties => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: `${color}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  const notificationContentStyles: React.CSSProperties = {
    flex: 1,
  };

  const notificationTitleStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  };

  const notificationMessageStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
    lineHeight: 1.5,
    marginBottom: spacing.xs,
  };

  const notificationTimestampStyles: React.CSSProperties = {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  };

  const unreadBadgeStyles: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: colors.functional.alertRed,
    flexShrink: 0,
  };

  // QR Tab Styles
  const qrCardStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  };

  const qrTitleStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  };

  const qrDescriptionStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 1.5,
  };

  const qrCodeWrapperStyles: React.CSSProperties = {
    width: '200px',
    height: '200px',
    margin: '0 auto',
    marginBottom: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${colors.background.tertiary}`,
  };

  const qrCodePlaceholderStyles: React.CSSProperties = {
    fontSize: '120px',
    color: colors.text.disabled,
  };

  const qrIdStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    letterSpacing: '2px',
  };

  const instructionCardStyles: React.CSSProperties = {
    backgroundColor: colors.background.secondary,
    borderRadius: '12px',
    padding: spacing.md,
    marginBottom: spacing.md,
  };

  const instructionTitleStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const instructionListStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
    lineHeight: 1.8,
    paddingLeft: spacing.md,
  };

  const emptyStateStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: `${spacing.xl} ${spacing.md}`,
    color: colors.text.secondary,
  };

  const handleNotificationPress = async (n: NotificationDto) => {
    const role = profile?.role ?? 'buyer';
    try {
      if (!n.read) {
        await markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, read: true, readAt: new Date().toISOString() } : x,
          ),
        );
        await syncUnreadBadge();
        openSnackbar({
          type: 'success',
          text: 'Đã đánh dấu đã đọc.',
          duration: 2200,
          icon: true,
        });
      }

      const target = notificationLinkToAppPath(n.linkTo, role);
      if (target) {
        navigate(target);
        return;
      }
      if (n.linkTo) {
        openSnackbar({
          type: 'info',
          text: 'Liên kết này chưa mở được trong app. Vui lòng kiểm tra trên phiên bản web (nếu có).',
          duration: 3200,
          icon: true,
        });
      }
    } catch (err) {
      openSnackbar({
        type: 'error',
        text: toNotificationViMessage(err, 'read'),
        duration: 4000,
        icon: true,
      });
    }
  };

  const handleReadAll = async () => {
    try {
      const { updated } = await markAllNotificationsRead();
      await syncUnreadBadge();
      const ok = await refreshNotifications();
      if (ok) {
        openSnackbar({
          type: 'success',
          text:
            updated > 0
              ? `Đã đọc ${updated} thông báo.`
              : 'Không còn thông báo chưa đọc.',
          duration: 2800,
          icon: true,
        });
      }
    } catch (err) {
      openSnackbar({
        type: 'error',
        text: toNotificationViMessage(err, 'readAll'),
        duration: 4000,
        icon: true,
      });
    }
  };

  // Render Profile Tab
  const renderProfile = () => {
    if (profileLoading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: `${spacing.xl} ${spacing.md}` }}>
          <Spinner />
          <Text size="small" style={{ color: colors.text.secondary }}>
            Đang tải hồ sơ…
          </Text>
        </div>
      );
    }

    return (
      <>
        {/* Profile Card */}
        <div style={profileCardStyles}>
          <div style={avatarStyles}>
            {buyerAvatar ? (
              <img src={buyerAvatar} alt={buyerName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              buyerName.charAt(0).toUpperCase()
            )}
          </div>
          <div style={nameStyles}>{buyerName}</div>
          {profile?.email && (
            <div style={{ ...userIdStyles, marginBottom: 4 }}>{profile.email}</div>
          )}
          {profile?.phone && (
            <div style={{ ...userIdStyles, marginBottom: 4 }}>{profile.phone}</div>
          )}
          <div style={userIdStyles}>ID: {buyerId}</div>
          {profile?.buyerProfile?.organizationName && (
            <div
              style={{
                marginTop: spacing.sm,
                padding: '4px 12px',
                background: `${colors.primary.zaloBlue}14`,
                borderRadius: 99,
                display: 'inline-block',
              }}
            >
              <Text size="xSmall" style={{ color: colors.primary.zaloBlue, fontWeight: fontWeight.semibold }}>
                🏢 {profile.buyerProfile.organizationName}
              </Text>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div
          style={menuItemStyles}
          onClick={() => console.log('Edit profile')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.primary;
          }}
        >
          <div style={menuItemLeftStyles}>
            <Icon name="user" size="md" color={colors.text.primary} />
            <span style={menuItemTextStyles}>Thông tin cá nhân</span>
          </div>
          <Icon name="chevron-right" size="sm" color={colors.text.secondary} />
        </div>

        <div
          style={menuItemStyles}
          onClick={() => navigate('/buyer/history')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.primary;
          }}
        >
          <div style={menuItemLeftStyles}>
            <Icon name="package" size="md" color={colors.text.primary} />
            <span style={menuItemTextStyles}>Lịch sử giao dịch</span>
          </div>
          <Icon name="chevron-right" size="sm" color={colors.text.secondary} />
        </div>

        <div
          style={menuItemStyles}
          onClick={() => console.log('Payment methods')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.primary;
          }}
        >
          <div style={menuItemLeftStyles}>
            <Icon name="dollar-sign" size="md" color={colors.text.primary} />
            <span style={menuItemTextStyles}>Phương thức thanh toán</span>
          </div>
          <Icon name="chevron-right" size="sm" color={colors.text.secondary} />
        </div>

        <div
          style={menuItemStyles}
          onClick={() => console.log('Settings')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.primary;
          }}
        >
          <div style={menuItemLeftStyles}>
            <Icon name="settings" size="md" color={colors.text.primary} />
            <span style={menuItemTextStyles}>Cài đặt</span>
          </div>
          <Icon name="chevron-right" size="sm" color={colors.text.secondary} />
        </div>
      </>
    );
  };

  // Render Notifications Tab
  const renderNotifications = () => {
    if (notifLoading && notifications.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: `${spacing.xl} ${spacing.md}` }}>
          <Spinner />
          <Text size="small" style={{ color: colors.text.secondary }}>
            Đang tải thông báo…
          </Text>
        </div>
      );
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    if (!notifLoading && notifError && notifications.length === 0) {
      return (
        <div style={emptyStateStyles}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>⚠️</div>
          <Text size="normal" style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
            {notifError}
          </Text>
          <button
            type="button"
            onClick={() => void refreshNotifications()}
            style={{
              border: 'none',
              backgroundColor: colors.primary.zaloBlue,
              color: colors.text.inverse,
              borderRadius: 8,
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: fontSize.body,
              fontWeight: fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (!notifLoading && notifications.length === 0) {
      return (
        <div style={emptyStateStyles}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🔔</div>
          <Text size="normal" style={{ color: colors.text.secondary }}>
            Chưa có thông báo nào
          </Text>
        </div>
      );
    }

    return (
      <>
        {notifError ? (
          <div
            style={{
              ...instructionCardStyles,
              marginBottom: spacing.md,
              borderLeft: `4px solid ${colors.functional.warningYellow}`,
            }}
          >
            <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
              {notifError}
            </Text>
            <button
              type="button"
              onClick={() => void refreshNotifications()}
              style={{
                marginTop: spacing.sm,
                border: 'none',
                background: 'transparent',
                color: colors.primary.zaloBlue,
                fontWeight: fontWeight.semibold,
                cursor: 'pointer',
                padding: 0,
                fontSize: fontSize.small,
              }}
            >
              Thử lại
            </button>
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
            gap: spacing.sm,
          }}
        >
          {unreadCount > 0 ? (
            <Text size="small" style={{ color: colors.text.secondary, margin: 0, flex: 1 }}>
              Bạn có <strong style={{ color: colors.primary.zaloBlue }}>{unreadCount}</strong> thông báo chưa đọc
            </Text>
          ) : (
            <Text size="small" style={{ color: colors.text.secondary, margin: 0, flex: 1 }}>
              Tất cả thông báo đã đọc
            </Text>
          )}
          <button
            type="button"
            onClick={() => void handleReadAll()}
            style={{
              border: `1px solid ${colors.primary.zaloBlue}`,
              background: colors.background.primary,
              color: colors.primary.zaloBlue,
              borderRadius: 8,
              padding: `${spacing.xs} ${spacing.sm}`,
              fontSize: fontSize.small,
              fontWeight: fontWeight.semibold,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Đọc tất cả
          </button>
        </div>

        {notifications.map((notification) => {
          const base = notificationTypeConfig[notification.type];
          const accent = severityAccent(notification.severity) ?? base.color;
          const config = { ...base, color: accent };
          return (
            <div
              key={notification.id}
              style={notificationCardStyles(notification.read)}
              onClick={() => void handleNotificationPress(notification)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={notificationHeaderStyles}>
                <div style={notificationIconWrapperStyles(config.color)}>
                  <Icon name={config.icon} size="md" color={config.color} />
                </div>
                <div style={notificationContentStyles}>
                  <div style={notificationTitleStyles}>{notification.title}</div>
                  <div style={notificationMessageStyles}>{notification.body}</div>
                  <div style={notificationTimestampStyles}>
                    {formatRelativeTimeVi(notification.createdAt)}
                    {notification.linkTo ? (
                      <span style={{ color: colors.primary.zaloBlue, marginLeft: 8 }}> · {notification.linkTo}</span>
                    ) : null}
                  </div>
                </div>
                {!notification.read && <div style={unreadBadgeStyles} />}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // Render QR Code Tab
  const renderQRCode = () => {
    return (
      <>
        {/* QR Code Card */}
        <div style={qrCardStyles}>
          <div style={qrTitleStyles}>Mã nhận hàng</div>
          <div style={qrDescriptionStyles}>
            Xuất trình mã QR này cho thương lái hoặc đơn vị vận chuyển khi nhận hàng
          </div>

          {/* QR Code Placeholder */}
          <div style={qrCodeWrapperStyles}>
            <div style={qrCodePlaceholderStyles}>
              <Icon name="qr-code" size="lg" color={colors.text.disabled} />
            </div>
          </div>

          <div style={qrIdStyles}>{buyerId}</div>

          <Text size="xSmall" style={{ color: colors.text.secondary }}>
            Mã này dùng để xác nhận danh tính khi nhận hàng
          </Text>
        </div>

        {/* Instructions */}
        <div style={instructionCardStyles}>
          <div style={instructionTitleStyles}>
            <Icon name="info" size="sm" color={colors.primary.zaloBlue} />
            Hướng dẫn sử dụng
          </div>
          <ol style={instructionListStyles}>
            <li>Khi đơn hàng đến nơi giao, mở tab "Mã QR" này</li>
            <li>Cho thương lái/vận chuyển quét mã QR</li>
            <li>Kiểm tra hàng hóa trước khi xác nhận</li>
            <li>Xác nhận đã nhận đủ hàng trong ứng dụng</li>
          </ol>
        </div>

        {/* Confirmation Button */}
        <button
          style={{
            width: '100%',
            padding: spacing.md,
            backgroundColor: colors.primary.agriGreen,
            color: colors.text.inverse,
            border: 'none',
            borderRadius: '8px',
            fontSize: fontSize.body,
            fontWeight: fontWeight.semibold,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => console.log('Confirm delivery')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#35A55F';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary.agriGreen;
          }}
        >
          ✓ Xác nhận đã nhận hàng
        </button>
      </>
    );
  };

  return (
    <Page className="buyer-profile-notification-screen">
      {/* Header */}
      <div style={headerStyles}>
        <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
          Tài khoản
        </Text>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          {profileLoading ? '…' : buyerName}
        </Text.Title>
      </div>

      {/* Tab Bar */}
      <div style={tabBarStyles}>
        <button style={tabStyles(activeTab === 'profile')} onClick={() => setActiveTab('profile')}>
          Hồ sơ
        </button>
        <button style={tabStyles(activeTab === 'notifications')} onClick={() => setActiveTab('notifications')}>
          Thông báo
          {unreadBadge > 0 && (
            <span
              style={{
                marginLeft: spacing.xs,
                padding: '2px 6px',
                backgroundColor: colors.functional.alertRed,
                color: colors.text.inverse,
                borderRadius: '10px',
                fontSize: fontSize.small,
              }}
            >
              {unreadBadge > 99 ? '99+' : unreadBadge}
            </span>
          )}
        </button>
        <button style={tabStyles(activeTab === 'qr')} onClick={() => setActiveTab('qr')}>
          Mã QR
        </button>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'qr' && renderQRCode()}
      </div>
    </Page>
  );
};

export default BuyerProfileNotificationScreen;
