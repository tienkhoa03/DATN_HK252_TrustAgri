import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'zmp-ui';
import {
  subscribeConnectionStatus,
  type ConnectionStatus,
} from '@/api/monitoringSocket';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';

const HIDE_DELAY_MS = 3000;

interface BannerState {
  visible: boolean;
  status: ConnectionStatus;
  downtimeMs?: number;
}

export const ConnectionStatusBanner: React.FC = () => {
  const [banner, setBanner] = useState<BannerState>({ visible: false, status: 'connected' });
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cleanup = subscribeConnectionStatus((status, info) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      if (status === 'connected') {
        if (info && info.downtimeMs > 30_000) {
          setBanner({ visible: true, status: 'connected', downtimeMs: info.downtimeMs });
          hideTimerRef.current = setTimeout(() => {
            setBanner((prev) => ({ ...prev, visible: false }));
          }, HIDE_DELAY_MS);
        } else {
          setBanner((prev) => ({ ...prev, visible: false }));
        }
      } else {
        setBanner({ visible: true, status });
      }
    });

    return () => {
      cleanup();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!banner.visible) return null;

  const bgColor =
    banner.status === 'connected'
      ? colors.primary.agriGreen
      : banner.status === 'reconnecting'
      ? colors.functional.warningYellow
      : colors.functional.alertRed;

  const textColor =
    banner.status === 'reconnecting'
      ? colors.text.primary
      : colors.text.inverse;

  const message =
    banner.status === 'connected'
      ? 'Đã kết nối lại'
      : banner.status === 'reconnecting'
      ? 'Mất kết nối — đang thử lại…'
      : 'Mất kết nối — đang thử lại…';

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: bgColor,
        padding: `${spacing.sm} ${spacing.md}`,
        textAlign: 'center',
        transition: 'background-color 0.3s',
      }}
    >
      <Text size="small" style={{ color: textColor, margin: 0, fontWeight: 600 }}>
        {message}
      </Text>
    </div>
  );
};

export default ConnectionStatusBanner;
