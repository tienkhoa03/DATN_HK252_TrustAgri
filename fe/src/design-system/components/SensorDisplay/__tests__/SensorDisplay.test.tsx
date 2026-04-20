/**
 * SensorDisplay Component Tests
 * Unit tests for SensorDisplay component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SensorDisplay } from '../SensorDisplay';

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

describe('SensorDisplay Component', () => {
  const mockTimestamp = new Date('2024-01-01T12:00:00');

  describe('Rendering', () => {
    it('should render temperature sensor correctly', () => {
      render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('Nhiệt độ')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.getByText('°C')).toBeInTheDocument();
    });

    it('should render humidity sensor correctly', () => {
      render(
        <SensorDisplay
          type="humidity"
          value={75}
          unit="%"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('Độ ẩm')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('%')).toBeInTheDocument();
    });

    it('should render light sensor correctly', () => {
      render(
        <SensorDisplay
          type="light"
          value={850}
          unit="lux"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('Ánh sáng')).toBeInTheDocument();
      expect(screen.getByText('850')).toBeInTheDocument();
      expect(screen.getByText('lux')).toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('should apply normal status color (Agri Green)', () => {
      const { container } = render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      const sensorDisplay = container.querySelector('.sensor-display-normal');
      expect(sensorDisplay).toBeInTheDocument();
      expect(sensorDisplay).toHaveAttribute('data-status', 'normal');
    });

    it('should apply warning status color (Warning Yellow)', () => {
      const { container } = render(
        <SensorDisplay
          type="temperature"
          value={32}
          unit="°C"
          status="warning"
          timestamp={mockTimestamp}
        />
      );

      const sensorDisplay = container.querySelector('.sensor-display-warning');
      expect(sensorDisplay).toBeInTheDocument();
      expect(sensorDisplay).toHaveAttribute('data-status', 'warning');
    });

    it('should apply danger status color (Alert Red)', () => {
      const { container } = render(
        <SensorDisplay
          type="temperature"
          value={38}
          unit="°C"
          status="danger"
          timestamp={mockTimestamp}
        />
      );

      const sensorDisplay = container.querySelector('.sensor-display-danger');
      expect(sensorDisplay).toBeInTheDocument();
      expect(sensorDisplay).toHaveAttribute('data-status', 'danger');
    });
  });

  describe('Imputed Data Labeling', () => {
    it('should display imputed badge when isImputed is true', () => {
      render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          isImputed={true}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('Bổ khuyết')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Dữ liệu bổ khuyết' })).toBeInTheDocument();
    });

    it('should not display imputed badge when isImputed is false', () => {
      render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          isImputed={false}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.queryByText('Bổ khuyết')).not.toBeInTheDocument();
    });

    it('should not display imputed badge by default', () => {
      render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      expect(screen.queryByText('Bổ khuyết')).not.toBeInTheDocument();
    });
  });

  describe('Sensor Type Mapping', () => {
    it('should have correct data attribute for temperature', () => {
      const { container } = render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      const sensorDisplay = container.querySelector('.sensor-display-temperature');
      expect(sensorDisplay).toHaveAttribute('data-sensor-type', 'temperature');
    });

    it('should have correct data attribute for humidity', () => {
      const { container } = render(
        <SensorDisplay
          type="humidity"
          value={75}
          unit="%"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      const sensorDisplay = container.querySelector('.sensor-display-humidity');
      expect(sensorDisplay).toHaveAttribute('data-sensor-type', 'humidity');
    });

    it('should have correct data attribute for light', () => {
      const { container } = render(
        <SensorDisplay
          type="light"
          value={850}
          unit="lux"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      const sensorDisplay = container.querySelector('.sensor-display-light');
      expect(sensorDisplay).toHaveAttribute('data-sensor-type', 'light');
    });
  });

  describe('Accessibility', () => {
    it('should have region role', () => {
      const { container } = render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toBeInTheDocument();
    });

    it('should have aria-label with sensor information', () => {
      const { container } = render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Nhiệt độ: 28 °C');
    });

    it('should accept custom aria-label', () => {
      const { container } = render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          timestamp={mockTimestamp}
          aria-label="Custom temperature label"
        />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Custom temperature label');
    });
  });

  describe('Timestamp Display', () => {
    it('should display timestamp', () => {
      const { container } = render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          timestamp={mockTimestamp}
        />
      );

      // Timestamp should be rendered (exact text depends on current time)
      const timestamps = container.querySelectorAll('p');
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SensorDisplay
          type="temperature"
          value={28}
          unit="°C"
          status="normal"
          timestamp={mockTimestamp}
          className="custom-class"
        />
      );

      const sensorDisplay = container.querySelector('.custom-class');
      expect(sensorDisplay).toBeInTheDocument();
    });
  });
});
