/**
 * ScreenLayout Example
 * Demonstrates usage of layout components
 */

import React, { useState } from 'react';
import { ScreenLayout } from './ScreenLayout';
import { Header } from './Header';
import { BottomNavigation, NavigationItem } from './BottomNavigation';
import { TabNavigation, TabItem } from './TabNavigation';
import { spacing } from '../tokens/spacing';

// Example: Farmer Screen with Bottom Navigation
export const FarmerScreenExample: React.FC = () => {
  const [activeNav, setActiveNav] = useState('home');

  const navItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: <span>🏠</span>,
      onClick: () => setActiveNav('home'),
    },
    {
      id: 'monitor',
      label: 'Giám sát',
      icon: <span>📊</span>,
      onClick: () => setActiveNav('monitor'),
    },
    {
      id: 'alerts',
      label: 'Cảnh báo',
      icon: <span>⚠️</span>,
      badge: 3,
      onClick: () => setActiveNav('alerts'),
    },
    {
      id: 'profile',
      label: 'Hồ sơ',
      icon: <span>👤</span>,
      onClick: () => setActiveNav('profile'),
    },
  ];

  return (
    <ScreenLayout
      header={
        <Header
          title="Farm Lab A"
          leftAction={<button>☰</button>}
          rightActions={<button>🔔</button>}
        />
      }
      footer={
        <BottomNavigation
          items={navItems}
          activeId={activeNav}
        />
      }
    >
      <div style={{ padding: spacing.md }}>
        <h2>Farmer Dashboard Content</h2>
        <p>Main content area with scrollable content...</p>
      </div>
    </ScreenLayout>
  );
};

// Example: Trader Screen with Tab Navigation
export const TraderScreenExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabItems: TabItem[] = [
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

  return (
    <ScreenLayout
      header={
        <>
          <Header
            title="Thương lái"
            leftAction={<button>☰</button>}
            rightActions={<button>🔔</button>}
          />
          <TabNavigation
            items={tabItems}
            activeId={activeTab}
          />
        </>
      }
    >
      <div style={{ padding: spacing.md }}>
        <h2>Trader {activeTab} Content</h2>
        <p>Tab-specific content...</p>
      </div>
    </ScreenLayout>
  );
};

// Example: Simple Screen without Navigation
export const SimpleScreenExample: React.FC = () => {
  return (
    <ScreenLayout
      header={
        <Header
          title="Truy xuất Nguồn gốc"
          leftAction={<button>←</button>}
          centerTitle
        />
      }
    >
      <div style={{ padding: spacing.md }}>
        <h2>Product Origin Information</h2>
        <p>Content without bottom navigation...</p>
      </div>
    </ScreenLayout>
  );
};

// Example: Responsive Layout (360px - 414px)
export const ResponsiveLayoutExample: React.FC = () => {
  return (
    <div style={{ maxWidth: '414px', margin: '0 auto', border: '1px solid #ccc' }}>
      <ScreenLayout
        header={<Header title="Responsive Layout" />}
      >
        <div style={{ padding: spacing.md }}>
          <p>This layout adapts to screen sizes from 360px to 414px</p>
          <p>Try resizing the viewport to see the responsive behavior</p>
        </div>
      </ScreenLayout>
    </div>
  );
};
