/**
 * TraderTransactionsScreen — Giao dịch hub
 * Toggle: "Với Nông dân" | "Với Người mua"
 * Requirements: FR-T03, FR-T04, FR-T05, FR-T06, FR-T08, US-T03, NFR-U01
 */
import React, { Suspense, lazy, useState } from 'react';
import { Page, Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

const FarmerFlowPanel = lazy(() =>
  import('./flows/FarmerFlowPanel').then((m) => ({ default: m.FarmerFlowPanel }))
);
const BuyerFlowPanel = lazy(() =>
  import('./flows/BuyerFlowPanel').then((m) => ({ default: m.BuyerFlowPanel }))
);

type FlowType = 'farmers' | 'buyers';

function readSearchParam(key: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

function initialFlow(): FlowType {
  const val = readSearchParam('flow');
  if (val === 'buyers') return 'buyers';
  return 'farmers';
}

const PanelSkeleton: React.FC = () => (
  <div style={{ padding: spacing.md }}>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          height: '80px',
          backgroundColor: colors.background.secondary,
          borderRadius: '8px',
          marginBottom: spacing.md,
        }}
      />
    ))}
  </div>
);

export function TraderTransactionsScreen() {
  const [flow, setFlow] = useState<FlowType>(initialFlow);
  const initialStatus = readSearchParam('status') ?? undefined;

  const toggleButtonStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    minHeight: '44px',
    border: `1px solid ${colors.primary.zaloBlue}`,
    borderRadius: isActive ? undefined : undefined,
    backgroundColor: isActive ? colors.primary.zaloBlue : colors.background.primary,
    color: isActive ? colors.text.inverse : colors.primary.zaloBlue,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <Page>
      {/* Header */}
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
        }}
      >
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          Giao dịch
        </Text.Title>
      </div>

      {/* Flow toggle */}
      <div
        style={{
          display: 'flex',
          padding: spacing.md,
          gap: 0,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
        }}
      >
        <button
          type="button"
          style={{
            ...toggleButtonStyle(flow === 'farmers'),
            borderRadius: '8px 0 0 8px',
            borderRight: 'none',
          }}
          onClick={() => setFlow('farmers')}
        >
          Với Nông dân
        </button>
        <button
          type="button"
          style={{
            ...toggleButtonStyle(flow === 'buyers'),
            borderRadius: '0 8px 8px 0',
            borderLeft: `1px solid ${colors.primary.zaloBlue}`,
          }}
          onClick={() => setFlow('buyers')}
        >
          Với Người mua
        </button>
      </div>

      {/* Flow panels */}
      <Suspense fallback={<PanelSkeleton />}>
        {flow === 'farmers' ? (
          <FarmerFlowPanel initialStatus={initialStatus} />
        ) : (
          <BuyerFlowPanel initialStatus={initialStatus} />
        )}
      </Suspense>
    </Page>
  );
}
