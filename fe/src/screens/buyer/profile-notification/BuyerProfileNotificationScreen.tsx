/**
 * Buyer Profile & Notification Screen — Phase 2.2 (FR-T01, FR-U*, FR-S03) — Integration
 *
 * Tab "Hồ sơ" dùng useProfile() → GET /api/v1/auth/me (Bearer tự động).
 * Tab "Thông báo" và "Mã QR" giữ nguyên logic hiện tại.
 *
 * DTO: UserProfileDto camelCase từ backend, map 1-1 vào view — không cần mapper.
 */

import React, { useState, useEffect } from 'react';
import { Page, Box, Text, Spinner } from 'zmp-ui';
import { Icon, IconName } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useProfile } from '@/hooks/useProfile';
import type { UserProfileDto } from '@/hooks/useProfile';

export interface BuyerProfileNotificationScreenProps {
  buyerName?: string;
  buyerAvatar?: string;
  buyerId?: string;
}

type TabType = 'profile' | 'notifications' | 'qr';

interface Notification {
  id: string;
  type: 'flowering' | 'order-confirmed' | 'payment-reminder' | 'delivery' | 'general';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  orderId?: string;
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
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // ── Tải hồ sơ từ mockProfileService (Phase 2.1) ──────────────────────────
  const { profile, isLoading: profileLoading } = useProfile();

  // Resolve display values: prefer live profile, fallback to props / defaults
  const buyerName   = profile?.displayName   ?? buyerNameProp   ?? 'Người mua';
  const buyerAvatar = profile?.avatarUrl      ?? buyerAvatarProp ?? undefined;
  const buyerId     = profile?.userId         ?? buyerIdProp     ?? 'BU001';
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'N001',
      type: 'flowering',
      title: 'Cây đã ra hoa 🌸',
      message: 'Bưởi Da Xanh tại Vườn chú Bảy đã bước vào giai đoạn ra hoa. Dự kiến thu hoạch sau 60 ngày.',
      timestamp: '2 giờ trước',
      isRead: false,
      orderId: 'O001',
    },
    {
      id: 'N002',
      type: 'order-confirmed',
      title: 'Đơn hàng đã xác nhận ✓',
      message: 'Thương lái Minh Tâm đã xác nhận đơn hàng #O003 của bạn. Số tiền đặt cọc: 1,125,000 VNĐ.',
      timestamp: '5 giờ trước',
      isRead: false,
      orderId: 'O003',
    },
    {
      id: 'N003',
      type: 'payment-reminder',
      title: 'Nhắc thanh toán 💰',
      message: 'Đơn hàng #O002 sắp đến hạn giao. Vui lòng chuẩn bị thanh toán số tiền còn lại: 1,120,000 VNĐ.',
      timestamp: '1 ngày trước',
      isRead: true,
      orderId: 'O002',
    },
    {
      id: 'N004',
      type: 'delivery',
      title: 'Đơn hàng đang giao 🚚',
      message: 'Đơn hàng #O004 đang trên đường giao đến bạn. Dự kiến giao trong 2 giờ tới.',
      timestamp: '1 ngày trước',
      isRead: true,
      orderId: 'O004',
    },
    {
      id: 'N005',
      type: 'general',
      title: 'Chương trình khuyến mãi 🎉',
      message: 'Giảm 10% cho đơn hàng tiếp theo khi đặt cọc trước ngày 20/01/2025.',
      timestamp: '2 ngày trước',
      isRead: true,
    },
  ]);

  // Notification type config
  const notificationTypeConfig: Record<Notification['type'], { icon: IconName; color: string }> = {
    flowering: { icon: 'plant', color: colors.primary.agriGreen },
    'order-confirmed': { icon: 'check', color: colors.primary.agriGreen },
    'payment-reminder': { icon: 'dollar-sign', color: colors.functional.warningYellow },
    delivery: { icon: 'package', color: colors.primary.zaloBlue },
    general: { icon: 'info', color: colors.text.secondary },
  };

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

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
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
          onClick={() => console.log('Order history')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background.primary;
          }}
        >
          <div style={menuItemLeftStyles}>
            <Icon name="package" size="md" color={colors.text.primary} />
            <span style={menuItemTextStyles}>Lịch sử đơn hàng</span>
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
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    if (notifications.length === 0) {
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
        {unreadCount > 0 && (
          <div style={{ ...instructionCardStyles, marginBottom: spacing.md }}>
            <Text size="small" style={{ color: colors.text.secondary }}>
              Bạn có <strong style={{ color: colors.primary.zaloBlue }}>{unreadCount}</strong> thông báo chưa đọc
            </Text>
          </div>
        )}

        {notifications.map((notification) => {
          const config = notificationTypeConfig[notification.type];
          return (
            <div
              key={notification.id}
              style={notificationCardStyles(notification.isRead)}
              onClick={() => {
                markAsRead(notification.id);
                if (notification.orderId) {
                  console.log('View order:', notification.orderId);
                }
              }}
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
                  <div style={notificationMessageStyles}>{notification.message}</div>
                  <div style={notificationTimestampStyles}>{notification.timestamp}</div>
                </div>
                {!notification.isRead && <div style={unreadBadgeStyles} />}
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
          {unreadCount > 0 && (
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
              {unreadCount}
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
