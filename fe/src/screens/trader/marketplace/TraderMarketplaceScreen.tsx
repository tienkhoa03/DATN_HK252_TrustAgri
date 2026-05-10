/**
 * TraderMarketplaceScreen — 3-tab marketplace hub for trader role.
 * Replaces placeholder. Lazy-loads each panel.
 *
 * Requirements: FR-T03, FR-T04, FR-T07, FR-T08, FR-T12, US-T03, US-T04, US-T05
 * NFR: NFR-U01 (3-click rule), NFR-U03 (44px touch targets), NFR-C01 (bundle < 20MB via lazy)
 */

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Page, Text } from 'zmp-ui';
import { useNavigate } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

// ── Lazy panel imports ────────────────────────────────────────────────────────

const MarketplaceFeedPanel = lazy(() =>
  import('./panels/MarketplaceFeedPanel').then((m) => ({ default: m.MarketplaceFeedPanel })),
);
const MarketplaceSupplyPanel = lazy(() =>
  import('./panels/MarketplaceSupplyPanel').then((m) => ({ default: m.MarketplaceSupplyPanel })),
);
const MarketplaceNewsPanel = lazy(() =>
  import('./panels/MarketplaceNewsPanel').then((m) => ({ default: m.MarketplaceNewsPanel })),
);

// ── Types ─────────────────────────────────────────────────────────────────────

type MarketplaceTab = 'feed' | 'supply' | 'news';

const TABS: { id: MarketplaceTab; label: string }[] = [
  { id: 'feed', label: 'Mua / Bán' },
  { id: 'supply', label: 'Nguồn cung' },
  { id: 'news', label: 'Bản tin & Giá' },
];

// ── Skeleton fallback ─────────────────────────────────────────────────────────

const PanelSkeleton: React.FC = () => (
  <div
    style={{
      height: 200,
      margin: spacing.md,
      backgroundColor: colors.background.secondary,
      borderRadius: 10,
    }}
  />
);

// ── URL query helpers ─────────────────────────────────────────────────────────

function readTabFromSearch(): MarketplaceTab {
  try {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'feed' || tab === 'supply' || tab === 'news') return tab;
  } catch {
    // ignore
  }
  return 'feed';
}

// ── Screen ────────────────────────────────────────────────────────────────────

export const TraderMarketplaceScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MarketplaceTab>(readTabFromSearch);

  // Sync initial tab from URL (handles deep link / direct navigation)
  useEffect(() => {
    const fromUrl = readTabFromSearch();
    if (fromUrl !== activeTab) setActiveTab(fromUrl);
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: MarketplaceTab) => {
    setActiveTab(tab);
    // Update URL query param without re-navigation stack entry
    navigate(`/trader/market?tab=${tab}`, { replace: true });
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const tabBarStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: colors.background.primary,
    borderBottom: `2px solid ${colors.background.secondary}`,
    overflowX: 'auto' as const,
  };

  const tabBtnStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    minWidth: '80px',
    padding: `${spacing.md} ${spacing.sm}`,
    backgroundColor: 'transparent',
    color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.primary.zaloBlue}` : '2px solid transparent',
    cursor: 'pointer',
    fontSize: fontSize.small,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    whiteSpace: 'nowrap' as const,
    minHeight: '44px',
    marginBottom: '-2px',
    transition: 'color 0.15s',
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Page className="trader-marketplace-screen">
      {/* Header */}
      <div
        style={{
          padding: `${spacing.md} ${spacing.md} ${spacing.sm}`,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
        }}
      >
        <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
          Thương lái
        </Text>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          Thị trường
        </Text.Title>
      </div>

      {/* Top tab bar */}
      <div style={tabBarStyles}>
        {TABS.map((t) => (
          <button
            key={t.id}
            style={tabBtnStyle(activeTab === t.id)}
            onClick={() => handleTabChange(t.id)}
            aria-label={t.label}
            aria-selected={activeTab === t.id}
            role="tab"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <Suspense fallback={<PanelSkeleton />}>
        {activeTab === 'feed' && <MarketplaceFeedPanel />}
        {activeTab === 'supply' && <MarketplaceSupplyPanel />}
        {activeTab === 'news' && <MarketplaceNewsPanel />}
      </Suspense>
    </Page>
  );
};

export default TraderMarketplaceScreen;
