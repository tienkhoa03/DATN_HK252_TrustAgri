/**
 * BuyerSourcingScreen — Tab "Nguồn hàng"
 * URL params: ?action=create → open create stepper; ?id=xxx → open inbox panel
 *
 * Requirements: FR-U02, FR-U03, NFR-U01, NFR-U03
 */

import React, { useState, useEffect } from 'react';
import { Page } from 'zmp-ui';
import { BuyerHeader } from '../components/BuyerHeader';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { SourcingListPanel } from './panels/SourcingListPanel';
import { SourcingInboxPanel } from './panels/SourcingInboxPanel';
import { CreateBuyingRequestStepper } from './components/CreateBuyingRequestStepper';

// FR-U02, FR-U03 — Tab Nguồn hàng: buying-requests + bid inbox + comparison
export const BuyerSourcingScreen: React.FC = () => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [showCreateStepper, setShowCreateStepper] = useState(false);

  // Read URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const id = params.get('id');
    if (action === 'create') setShowCreateStepper(true);
    if (id) setSelectedRequestId(id);
  }, []);

  const handleCreateSuccess = (_id: string) => {
    setShowCreateStepper(false);
    // List will reload when panel re-mounts
  };

  return (
    <Page className="buyer-sourcing-screen">
      <BuyerHeader title="Nguồn hàng" />

      {/* Main content */}
      {selectedRequestId ? (
        <SourcingInboxPanel
          buyingRequestId={selectedRequestId}
          onBack={() => setSelectedRequestId(null)}
        />
      ) : (
        <SourcingListPanel
          onSelectRequest={(id) => setSelectedRequestId(id)}
          onCreateRequest={() => setShowCreateStepper(true)}
        />
      )}

      {/* Create stepper modal/sheet overlay */}
      {showCreateStepper && (
        <>
          {/* Semi-transparent backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0,
              bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 900,
            }}
            onClick={() => setShowCreateStepper(false)}
          />

          {/* Slide-up sheet */}
          <div
            style={{
              position: 'fixed',
              bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
              left: 0,
              right: 0,
              top: '10vh',
              backgroundColor: colors.background.primary,
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 910,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
            }}
          >
            {/* Drag handle */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: `${spacing.sm} 0`,
            }}>
              <div style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: colors.background.tertiary,
              }} />
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <CreateBuyingRequestStepper
                onSuccess={handleCreateSuccess}
                onCancel={() => setShowCreateStepper(false)}
              />
            </div>
          </div>
        </>
      )}
    </Page>
  );
};
