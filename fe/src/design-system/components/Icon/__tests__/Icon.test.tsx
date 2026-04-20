/**
 * Icon Component Unit Tests
 * Requirements: 4.1-4.6, 8.4
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Icon } from '../Icon';
import { iconSizes, sensorIconMapping, getSensorIcon } from '../../../tokens/icons';

// Mock zmp-ui Icon component
jest.mock('zmp-ui', () => ({
  Icon: ({ icon, size, style, className, 'aria-label': ariaLabel }: any) => (
    <div
      data-testid="zaui-icon"
      data-icon={icon}
      data-size={size}
      style={style}
      className={className}
      aria-label={ariaLabel}
    />
  ),
}));

describe('Icon Component', () => {
  describe('Navigation Icons - Requirement 4.2', () => {
    test('should render home icon', () => {
      const { container } = render(<Icon name="home" size="md" />);
      const icon = container.querySelector('[data-icon="home"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-style', 'outline');
    });

    test('should render user icon', () => {
      const { container } = render(<Icon name="user" size="md" />);
      const icon = container.querySelector('[data-icon="user"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-style', 'outline');
    });

    test('should render settings icon', () => {
      const { container } = render(<Icon name="settings" size="md" />);
      const icon = container.querySelector('[data-icon="settings"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-style', 'outline');
    });

    test('should render notification icon', () => {
      const { container } = render(<Icon name="notification" size="md" />);
      const icon = container.querySelector('[data-icon="notification"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-style', 'outline');
    });
  });

  describe('Custom Agriculture Icons - Requirements 4.1, 4.3-4.6', () => {
    test('should render temperature icon with outline style - Requirement 4.3', () => {
      const { container } = render(<Icon name="temperature" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-style', 'outline');
      expect(svg).toHaveAttribute('data-icon', 'thermometer');
      expect(svg).toHaveAttribute('fill', 'none');
    });

    test('should render humidity icon with outline style - Requirement 4.4', () => {
      const { container } = render(<Icon name="humidity" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-style', 'outline');
      expect(svg).toHaveAttribute('data-icon', 'droplet');
      expect(svg).toHaveAttribute('fill', 'none');
    });

    test('should render light icon with outline style - Requirement 4.5', () => {
      const { container } = render(<Icon name="light" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-style', 'outline');
      expect(svg).toHaveAttribute('data-icon', 'sun');
      expect(svg).toHaveAttribute('fill', 'none');
    });

    test('should render alert icon with outline style - Requirement 4.6', () => {
      const { container } = render(<Icon name="alert" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-style', 'outline');
      expect(svg).toHaveAttribute('data-icon', 'alert-triangle');
      expect(svg).toHaveAttribute('fill', 'none');
    });

    test('should render plant icon with outline style', () => {
      const { container } = render(<Icon name="plant" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-style', 'outline');
      expect(svg).toHaveAttribute('data-icon', 'plant');
    });

    test('should render farm icon with outline style', () => {
      const { container } = render(<Icon name="farm" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('data-style', 'outline');
      expect(svg).toHaveAttribute('data-icon', 'farm');
    });
  });

  describe('Icon Style Consistency - Requirements 4.1, 8.4', () => {
    test('all custom icons should have outline style', () => {
      const customIcons: Array<'temperature' | 'humidity' | 'light' | 'alert' | 'plant' | 'farm'> = [
        'temperature',
        'humidity',
        'light',
        'alert',
        'plant',
        'farm',
      ];

      customIcons.forEach((iconName) => {
        const { container } = render(<Icon name={iconName} size="md" />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('data-style', 'outline');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('stroke-width', '2');
      });
    });

    test('all custom icons should have consistent stroke properties', () => {
      const { container } = render(<Icon name="temperature" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke-linecap', 'round');
      expect(svg).toHaveAttribute('stroke-linejoin', 'round');
    });
  });

  describe('Icon Size Variants', () => {
    test('should render small icon (16px)', () => {
      const { container } = render(<Icon name="temperature" size="sm" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('height', '16');
    });

    test('should render medium icon (24px) - default', () => {
      const { container } = render(<Icon name="temperature" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    test('should render large icon (32px)', () => {
      const { container } = render(<Icon name="temperature" size="lg" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });

    test('should use medium size by default', () => {
      const { container } = render(<Icon name="temperature" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '24');
    });

    test('Zaui icons should receive correct size', () => {
      const { container } = render(<Icon name="home" size="lg" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');
    });
  });

  describe('Icon Color Customization', () => {
    test('should apply custom color to custom icon', () => {
      const { container } = render(<Icon name="temperature" size="md" color="#F50000" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', '#F50000');
    });

    test('should apply custom color to Zaui icon', () => {
      const { container } = render(<Icon name="home" size="md" color="#0068FF" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('stroke', '#0068FF');
    });

    test('should use currentColor by default for custom icons', () => {
      const { container } = render(<Icon name="temperature" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });
  });

  describe('Icon Accessibility', () => {
    test('should support aria-label', () => {
      const { container } = render(
        <Icon name="temperature" size="md" aria-label="Temperature sensor" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Temperature sensor');
    });

    test('should use icon name as default aria-label', () => {
      const { container } = render(<Icon name="temperature" size="md" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'temperature');
    });

    test('Zaui icons should support aria-label', () => {
      const { container } = render(<Icon name="home" size="md" aria-label="Home page" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-label', 'Home page');
    });
  });

  describe('Icon CSS Classes', () => {
    test('should apply custom className to custom icon', () => {
      const { container } = render(
        <Icon name="temperature" size="md" className="custom-class" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-class');
    });

    test('should apply custom className to Zaui icon', () => {
      const { container } = render(<Icon name="home" size="md" className="custom-class" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('custom-class');
    });
  });

  describe('Action Icons', () => {
    test('should render action icons from Zaui', () => {
      const actionIcons: Array<'add' | 'edit' | 'delete' | 'search' | 'filter'> = [
        'add',
        'edit',
        'delete',
        'search',
        'filter',
      ];

      actionIcons.forEach((iconName) => {
        const { container, unmount } = render(<Icon name={iconName} size="md" />);
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Sensor Icon Mapping - Requirements 4.3-4.6', () => {
    test('getSensorIcon should return correct icon for temperature', () => {
      const icon = getSensorIcon('temperature');
      expect(icon).toBe('custom-icon-thermometer');
    });

    test('getSensorIcon should return correct icon for humidity', () => {
      const icon = getSensorIcon('humidity');
      expect(icon).toBe('custom-icon-droplet');
    });

    test('getSensorIcon should return correct icon for light', () => {
      const icon = getSensorIcon('light');
      expect(icon).toBe('custom-icon-sun');
    });

    test('sensorIconMapping should have all sensor types', () => {
      expect(sensorIconMapping).toHaveProperty('temperature');
      expect(sensorIconMapping).toHaveProperty('humidity');
      expect(sensorIconMapping).toHaveProperty('light');
    });
  });

  describe('Icon Sizes Token', () => {
    test('iconSizes should have all size variants', () => {
      expect(iconSizes).toHaveProperty('sm');
      expect(iconSizes).toHaveProperty('md');
      expect(iconSizes).toHaveProperty('lg');
    });

    test('iconSizes should have correct values', () => {
      expect(iconSizes.sm).toBe('16px');
      expect(iconSizes.md).toBe('24px');
      expect(iconSizes.lg).toBe('32px');
    });
  });
});
