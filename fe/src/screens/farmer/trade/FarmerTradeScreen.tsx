/**
 * FarmerTradeScreen — Giao thương tab (FR-F02, FR-F03, FR-F04, NFR-U01)
 *
 * Top tabs: search (tìm thương lái) | contracts (hợp đồng)
 * URL param ?tab=search|contracts controls active tab.
 */

import React, { useEffect, useState } from 'react';
import { Page, useNavigate } from 'zmp-ui';
import { ConnectionStatusBanner } from '@/components/ConnectionStatusBanner';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { TraderSearchTab } from './TraderSearchTab';
import { ContractsTab } from './ContractsTab';

type TabKey = 'search' | 'contracts';

const TAB_LABELS: Record<TabKey, string> = {
  search: 'Tìm thương lái',
  contracts: 'Hợp đồng',
};

function readTabFromUrl(): TabKey {
  if (typeof window === 'undefined') return 'search';
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab === 'contracts') return 'contracts';
  return 'search';
}

export const FarmerTradeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>(readTabFromUrl);

  // Sync URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [activeTab]);

  return (
    <Page className="farmer-trade-screen">
      <ConnectionStatusBanner />
      <div style={{ paddingBottom: '80px' }}>
        {/* Top tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.background.secondary}`,
          backgroundColor: colors.background.primary,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${colors.primary.zaloBlue}` : '2px solid transparent',
                  color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
                  fontSize: fontSize.caption,
                  fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'search' && <TraderSearchTab />}
        {activeTab === 'contracts' && <ContractsTab />}
      </div>
    </Page>
  );
};

export default FarmerTradeScreen;
