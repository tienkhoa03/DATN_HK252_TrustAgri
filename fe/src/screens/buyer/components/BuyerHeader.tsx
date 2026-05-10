import React from 'react';
import { Box, Text } from 'zmp-ui';
import { useNavigate } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { NotificationBell } from '@/components/NotificationBell';

interface BuyerHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearchPress?: () => void;
}

// Header chung 4 tab buyer: title + notification bell + optional search icon (FR-U01..U05)
export const BuyerHeader: React.FC<BuyerHeaderProps> = ({
  title,
  showSearch = false,
  onSearchPress,
}) => {
  const navigate = useNavigate();

  return (
    <Box
      className="flex flex-row items-center justify-between px-4"
      style={{
        height: 56,
        backgroundColor: colors.background.primary,
        borderBottom: `1px solid ${colors.background.tertiary}`,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: colors.text.primary,
          flex: 1,
        }}
      >
        {title ?? 'TrustAgri'}
      </Text>

      <Box className="flex flex-row items-center gap-3">
        {showSearch && (
          <button
            aria-label="Tìm kiếm"
            onClick={onSearchPress}
            style={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.text.primary,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        )}
        <NotificationBell targetPath="/notifications" />
        <button
          aria-label="Hồ sơ"
          onClick={() => navigate('/buyer/me')}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.background.secondary,
            border: 'none',
            cursor: 'pointer',
            color: colors.text.secondary,
            minWidth: 36,
            minHeight: 36,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </Box>
    </Box>
  );
};
