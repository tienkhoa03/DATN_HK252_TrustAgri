import React from 'react';
import { Box, Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { NotificationBell } from '@/components/NotificationBell';

interface BuyerHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearchPress?: () => void;
}

// Header chung các tab buyer — chỉ giữ title + notification bell + optional search.
// Nút "Hồ sơ" đã chuyển sang bottom navigation cho đồng nhất với farmer/trader.
export const BuyerHeader: React.FC<BuyerHeaderProps> = ({
  title,
  showSearch = false,
  onSearchPress,
}) => {
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
      </Box>
    </Box>
  );
};
