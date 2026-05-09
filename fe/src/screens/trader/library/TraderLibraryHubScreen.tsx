// FR-T10, FR-T12 — Hub Thư viện: 2 tab ngang giống Sàn & kết nối
import React, { useState } from 'react';
import { Page, Text } from 'zmp-ui';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { TraderStandardLibraryScreen } from '../standard-library';
import { TraderProfileNewsScreen } from '../profile-news';

type LibraryTab = 'standards' | 'news';

export const TraderLibraryHubScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('standards');

  const tabBarStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.primary.zaloBlue}` : '2px solid transparent',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <Page className="trader-library-hub-screen">
      <div
        style={{
          padding: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
        }}
      >
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          Thư viện
        </Text.Title>
      </div>

      <div style={tabBarStyles}>
        <button
          type="button"
          style={tabButtonStyles(activeTab === 'standards')}
          onClick={() => setActiveTab('standards')}
        >
          Tiêu chuẩn canh tác
        </button>
        <button
          type="button"
          style={tabButtonStyles(activeTab === 'news')}
          onClick={() => setActiveTab('news')}
        >
          Tin tức & Dự báo
        </button>
      </div>

      {activeTab === 'standards' && <TraderStandardLibraryScreen inTab />}
      {activeTab === 'news' && <TraderProfileNewsScreen inTab defaultTab="news" />}
    </Page>
  );
};

export default TraderLibraryHubScreen;
