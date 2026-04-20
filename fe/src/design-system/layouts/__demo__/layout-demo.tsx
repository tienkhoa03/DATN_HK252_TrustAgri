/**
 * Layout Components Demo
 * Visual demonstration of all layout components
 */

import React, { useState } from 'react';
import { ScreenLayout } from '../ScreenLayout';
import { Header } from '../Header';
import { BottomNavigation, NavigationItem } from '../BottomNavigation';
import { TabNavigation, TabItem } from '../TabNavigation';
import { spacing } from '../../tokens/spacing';
import { colors } from '../../tokens/colors';

// Demo: All Layout Components Together
export const LayoutDemo: React.FC = () => {
  const [activeNav, setActiveNav] = useState('home');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [demoType, setDemoType] = useState<'farmer' | 'trader' | 'simple'>('farmer');

  // Farmer Navigation Items
  const farmerNavItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: <span style={{ fontSize: '20px' }}>🏠</span>,
      onClick: () => setActiveNav('home'),
      ariaLabel: 'Navigate to home',
    },
    {
      id: 'monitor',
      label: 'Giám sát',
      icon: <span style={{ fontSize: '20px' }}>📊</span>,
      onClick: () => setActiveNav('monitor'),
      ariaLabel: 'Navigate to monitoring',
    },
    {
      id: 'alerts',
      label: 'Cảnh báo',
      icon: <span style={{ fontSize: '20px' }}>⚠️</span>,
      badge: 3,
      onClick: () => setActiveNav('alerts'),
      ariaLabel: 'Navigate to alerts',
    },
    {
      id: 'profile',
      label: 'Hồ sơ',
      icon: <span style={{ fontSize: '20px' }}>👤</span>,
      onClick: () => setActiveNav('profile'),
      ariaLabel: 'Navigate to profile',
    },
  ];

  // Trader Tab Items
  const traderTabItems: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      onClick: () => setActiveTab('dashboard'),
    },
    {
      id: 'products',
      label: 'Sản phẩm',
      badge: 5,
      onClick: () => setActiveTab('products'),
    },
    {
      id: 'farms',
      label: 'Vườn trồng',
      onClick: () => setActiveTab('farms'),
    },
    {
      id: 'orders',
      label: 'Đơn hàng',
      onClick: () => setActiveTab('orders'),
    },
  ];

  // Demo Controls
  const demoControls = (
    <div style={{
      padding: spacing.md,
      backgroundColor: colors.background.secondary,
      borderBottom: `1px solid ${colors.functional.neutralGray}`,
    }}>
      <p style={{ margin: `0 0 ${spacing.sm} 0`, fontWeight: 600 }}>
        Select Demo Type:
      </p>
      <div style={{ display: 'flex', gap: spacing.sm }}>
        <button
          onClick={() => setDemoType('farmer')}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: demoType === 'farmer' ? colors.primary.zaloBlue : colors.background.primary,
            color: demoType === 'farmer' ? colors.text.inverse : colors.text.primary,
            border: `1px solid ${colors.functional.neutralGray}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Farmer Layout
        </button>
        <button
          onClick={() => setDemoType('trader')}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: demoType === 'trader' ? colors.primary.zaloBlue : colors.background.primary,
            color: demoType === 'trader' ? colors.text.inverse : colors.text.primary,
            border: `1px solid ${colors.functional.neutralGray}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Trader Layout
        </button>
        <button
          onClick={() => setDemoType('simple')}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: demoType === 'simple' ? colors.primary.zaloBlue : colors.background.primary,
            color: demoType === 'simple' ? colors.text.inverse : colors.text.primary,
            border: `1px solid ${colors.functional.neutralGray}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Simple Layout
        </button>
      </div>
    </div>
  );

  // Farmer Layout
  if (demoType === 'farmer') {
    return (
      <div style={{ maxWidth: '414px', margin: '0 auto', border: '2px solid #ccc' }}>
        {demoControls}
        <ScreenLayout
          header={
            <Header
              title="Farm Lab A"
              leftAction={
                <button style={{
                  width: '44px',
                  height: '44px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}>
                  ☰
                </button>
              }
              rightActions={
                <button style={{
                  width: '44px',
                  height: '44px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}>
                  🔔
                </button>
              }
            />
          }
          footer={
            <BottomNavigation
              items={farmerNavItems}
              activeId={activeNav}
            />
          }
        >
          <div style={{ padding: spacing.md }}>
            <h2 style={{ color: colors.primary.agriGreen }}>
              Farmer Dashboard - {activeNav}
            </h2>
            <p>This is the main content area for the farmer role.</p>
            <p>Current active navigation: <strong>{activeNav}</strong></p>
            <div style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: colors.background.secondary,
              borderRadius: '8px',
            }}>
              <h3>Features:</h3>
              <ul>
                <li>✅ Header with title and actions (56px)</li>
                <li>✅ Scrollable content area</li>
                <li>✅ Bottom navigation (64px)</li>
                <li>✅ Badge support (3 alerts)</li>
                <li>✅ Minimum 44x44px touch targets</li>
              </ul>
            </div>
          </div>
        </ScreenLayout>
      </div>
    );
  }

  // Trader Layout
  if (demoType === 'trader') {
    return (
      <div style={{ maxWidth: '414px', margin: '0 auto', border: '2px solid #ccc' }}>
        {demoControls}
        <ScreenLayout
          header={
            <>
              <Header
                title="Thương lái"
                leftAction={
                  <button style={{
                    width: '44px',
                    height: '44px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '20px',
                    cursor: 'pointer',
                  }}>
                    ☰
                  </button>
                }
                rightActions={
                  <button style={{
                    width: '44px',
                    height: '44px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '20px',
                    cursor: 'pointer',
                  }}>
                    🔔
                  </button>
                }
              />
              <TabNavigation
                items={traderTabItems}
                activeId={activeTab}
                showIndicator={true}
              />
            </>
          }
        >
          <div style={{ padding: spacing.md }}>
            <h2 style={{ color: colors.primary.zaloBlue }}>
              Trader {activeTab}
            </h2>
            <p>This is the main content area for the trader role.</p>
            <p>Current active tab: <strong>{activeTab}</strong></p>
            <div style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: colors.background.secondary,
              borderRadius: '8px',
            }}>
              <h3>Features:</h3>
              <ul>
                <li>✅ Header with title and actions (56px)</li>
                <li>✅ Tab navigation with indicator (48px)</li>
                <li>✅ Scrollable content area</li>
                <li>✅ Badge support (5 products)</li>
                <li>✅ Animated indicator line</li>
              </ul>
            </div>
          </div>
        </ScreenLayout>
      </div>
    );
  }

  // Simple Layout
  return (
    <div style={{ maxWidth: '414px', margin: '0 auto', border: '2px solid #ccc' }}>
      {demoControls}
      <ScreenLayout
        header={
          <Header
            title="Truy xuất Nguồn gốc"
            leftAction={
              <button style={{
                width: '44px',
                height: '44px',
                border: 'none',
                background: 'transparent',
                fontSize: '20px',
                cursor: 'pointer',
              }}>
                ←
              </button>
            }
            centerTitle={true}
          />
        }
      >
        <div style={{ padding: spacing.md }}>
          <h2>Product Origin Information</h2>
          <p>This is a simple layout without bottom navigation.</p>
          <p>Typically used for guest/public screens.</p>
          <div style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            backgroundColor: colors.background.secondary,
            borderRadius: '8px',
          }}>
            <h3>Features:</h3>
            <ul>
              <li>✅ Header with centered title (56px)</li>
              <li>✅ Back button on left</li>
              <li>✅ Scrollable content area</li>
              <li>✅ No bottom navigation</li>
              <li>✅ Clean, simple layout</li>
            </ul>
          </div>
        </div>
      </ScreenLayout>
    </div>
  );
};

export default LayoutDemo;
