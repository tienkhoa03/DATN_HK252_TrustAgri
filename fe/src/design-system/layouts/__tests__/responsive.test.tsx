/**
 * Responsive Layout Tests
 * Verify layouts work correctly on different screen sizes (360px-414px)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScreenLayout } from '../ScreenLayout';
import { Header } from '../Header';
import { BottomNavigation, NavigationItem } from '../BottomNavigation';
import { TabNavigation, TabItem } from '../TabNavigation';

describe('Responsive Layout Tests', () => {
  describe('ScreenLayout Responsive Behavior', () => {
    it('should render correctly on small screens (360px)', () => {
      // Mock viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 360,
      });

      render(
        <ScreenLayout
          header={<Header title="Test" />}
        >
          <div>Content</div>
        </ScreenLayout>
      );

      const layout = screen.getByTestId('screen-layout');
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveStyle({ width: '100%' });
    });

    it('should render correctly on medium screens (375px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <ScreenLayout
          header={<Header title="Test" />}
        >
          <div>Content</div>
        </ScreenLayout>
      );

      const layout = screen.getByTestId('screen-layout');
      expect(layout).toBeInTheDocument();
    });

    it('should render correctly on large screens (414px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 414,
      });

      render(
        <ScreenLayout
          header={<Header title="Test" />}
        >
          <div>Content</div>
        </ScreenLayout>
      );

      const layout = screen.getByTestId('screen-layout');
      expect(layout).toBeInTheDocument();
    });
  });

  describe('Header Responsive Behavior', () => {
    it('should maintain 56px height on all screen sizes', () => {
      const { container } = render(<Header title="Test Header" />);
      const header = screen.getByTestId('header');
      
      expect(header).toHaveStyle({
        height: '56px',
        minHeight: '56px',
      });
    });

    it('should truncate long titles with ellipsis', () => {
      const longTitle = 'This is a very long title that should be truncated with ellipsis';
      render(<Header title={longTitle} />);
      
      const title = screen.getByTestId('header-title');
      expect(title).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
    });

    it('should center title when centerTitle is true', () => {
      render(<Header title="Centered Title" centerTitle={true} />);
      
      const title = screen.getByTestId('header-title');
      expect(title).toHaveStyle({
        textAlign: 'center',
        position: 'absolute',
      });
    });
  });

  describe('BottomNavigation Responsive Behavior', () => {
    const navItems: NavigationItem[] = [
      { id: '1', label: 'Home', icon: <span>🏠</span>, onClick: jest.fn() },
      { id: '2', label: 'Monitor', icon: <span>📊</span>, onClick: jest.fn() },
      { id: '3', label: 'Alerts', icon: <span>⚠️</span>, onClick: jest.fn() },
      { id: '4', label: 'Profile', icon: <span>👤</span>, onClick: jest.fn() },
    ];

    it('should maintain 64px height on all screen sizes', () => {
      render(<BottomNavigation items={navItems} activeId="1" />);
      
      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toHaveStyle({
        height: '64px',
        minHeight: '64px',
      });
    });

    it('should distribute items evenly across width', () => {
      render(<BottomNavigation items={navItems} activeId="1" />);
      
      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toHaveStyle({
        display: 'flex',
        justifyContent: 'space-around',
      });
    });

    it('should maintain minimum touch target size (44x44px)', () => {
      render(<BottomNavigation items={navItems} activeId="1" />);
      
      const firstItem = screen.getByTestId('nav-item-1');
      expect(firstItem).toHaveStyle({
        minWidth: '44px',
        minHeight: '44px',
      });
    });
  });

  describe('TabNavigation Responsive Behavior', () => {
    const tabItems: TabItem[] = [
      { id: '1', label: 'Dashboard', onClick: jest.fn() },
      { id: '2', label: 'Products', onClick: jest.fn() },
      { id: '3', label: 'Farms', onClick: jest.fn() },
      { id: '4', label: 'Orders', onClick: jest.fn() },
    ];

    it('should maintain 48px height on all screen sizes', () => {
      render(<TabNavigation items={tabItems} activeId="1" />);
      
      const nav = screen.getByTestId('tab-navigation');
      expect(nav).toHaveStyle({
        height: '48px',
        minHeight: '48px',
      });
    });

    it('should enable horizontal scrolling when scrollable is true', () => {
      render(<TabNavigation items={tabItems} activeId="1" scrollable={true} />);
      
      const nav = screen.getByTestId('tab-navigation');
      expect(nav).toHaveStyle({
        overflowX: 'auto',
        overflowY: 'hidden',
      });
    });

    it('should maintain minimum touch target size (44x44px)', () => {
      render(<TabNavigation items={tabItems} activeId="1" />);
      
      const firstTab = screen.getByTestId('tab-item-1');
      expect(firstTab).toHaveStyle({
        minHeight: '44px',
      });
    });

    it('should show indicator line when showIndicator is true', () => {
      render(<TabNavigation items={tabItems} activeId="1" showIndicator={true} />);
      
      const indicator = screen.getByTestId('tab-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveStyle({
        height: '2px',
        position: 'absolute',
        bottom: 0,
      });
    });
  });

  describe('Complete Layout Integration', () => {
    it('should render farmer layout correctly', () => {
      const navItems: NavigationItem[] = [
        { id: 'home', label: 'Home', icon: <span>🏠</span>, onClick: jest.fn() },
        { id: 'monitor', label: 'Monitor', icon: <span>📊</span>, onClick: jest.fn() },
      ];

      render(
        <ScreenLayout
          header={<Header title="Farm Lab A" />}
          footer={<BottomNavigation items={navItems} activeId="home" />}
        >
          <div>Farmer Content</div>
        </ScreenLayout>
      );

      expect(screen.getByTestId('screen-layout')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
      expect(screen.getByText('Farmer Content')).toBeInTheDocument();
    });

    it('should render trader layout correctly', () => {
      const tabItems: TabItem[] = [
        { id: 'dashboard', label: 'Dashboard', onClick: jest.fn() },
        { id: 'products', label: 'Products', onClick: jest.fn() },
      ];

      render(
        <ScreenLayout
          header={
            <>
              <Header title="Trader" />
              <TabNavigation items={tabItems} activeId="dashboard" />
            </>
          }
        >
          <div>Trader Content</div>
        </ScreenLayout>
      );

      expect(screen.getByTestId('screen-layout')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      expect(screen.getByText('Trader Content')).toBeInTheDocument();
    });

    it('should render simple layout correctly', () => {
      render(
        <ScreenLayout
          header={<Header title="Origin Tracking" centerTitle />}
        >
          <div>Guest Content</div>
        </ScreenLayout>
      );

      expect(screen.getByTestId('screen-layout')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.queryByTestId('bottom-navigation')).not.toBeInTheDocument();
      expect(screen.getByText('Guest Content')).toBeInTheDocument();
    });
  });
});
