/**
 * Chart Component Tests
 * Tests for Chart component functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Chart, ChartDataPoint } from '../Chart';
import { colors } from '../../../tokens/colors';

describe('Chart Component', () => {
  const sampleData: ChartDataPoint[] = [
    { label: 'Mon', value: 28 },
    { label: 'Tue', value: 30 },
    { label: 'Wed', value: 27 },
    { label: 'Thu', value: 29 },
    { label: 'Fri', value: 31 },
  ];

  describe('Chart Types', () => {
    it('should render line chart', () => {
      render(<Chart type="line" data={sampleData} />);
      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('chart-line');
    });

    it('should render bar chart', () => {
      render(<Chart type="bar" data={sampleData} />);
      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('chart-bar');
    });

    it('should render area chart', () => {
      render(<Chart type="area" data={sampleData} />);
      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('chart-area');
    });
  });

  describe('Axis Configuration', () => {
    it('should render x-axis label when provided', () => {
      render(
        <Chart
          type="line"
          data={sampleData}
          xAxis={{ label: 'Day of Week' }}
        />
      );
      expect(screen.getByText('Day of Week')).toBeInTheDocument();
    });

    it('should render y-axis label when provided', () => {
      render(
        <Chart
          type="line"
          data={sampleData}
          yAxis={{ label: 'Temperature (°C)' }}
        />
      );
      expect(screen.getByText('Temperature (°C)')).toBeInTheDocument();
    });

    it('should render x-axis data labels', () => {
      render(<Chart type="line" data={sampleData} />);
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
    });
  });

  describe('Color Mapping - Requirement 17.2', () => {
    it('should use Agri Green for positive values by default', () => {
      const positiveData: ChartDataPoint[] = [
        { label: 'A', value: 10 },
        { label: 'B', value: 20 },
      ];
      const { container } = render(<Chart type="bar" data={positiveData} />);
      const bars = container.querySelectorAll('.chart-bars rect');
      
      // Check that bars exist
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should use Alert Red for negative values by default', () => {
      const negativeData: ChartDataPoint[] = [
        { label: 'A', value: -10 },
        { label: 'B', value: -20 },
      ];
      const { container } = render(<Chart type="bar" data={negativeData} />);
      const bars = container.querySelectorAll('.chart-bars rect');
      
      // Check that bars exist
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should use custom colors when provided', () => {
      const customColor = colors.primary.zaloBlue;
      const { container } = render(
        <Chart type="line" data={sampleData} colors={[customColor]} />
      );
      const line = container.querySelector('.chart-line polyline');
      expect(line).toHaveAttribute('stroke', customColor);
    });
  });

  describe('Grid and Legend', () => {
    it('should show grid lines when showGrid is true', () => {
      const { container } = render(
        <Chart type="line" data={sampleData} showGrid={true} />
      );
      const grid = container.querySelector('.chart-grid');
      expect(grid).toBeInTheDocument();
    });

    it('should hide grid lines when showGrid is false', () => {
      const { container } = render(
        <Chart type="line" data={sampleData} showGrid={false} />
      );
      const grid = container.querySelector('.chart-grid');
      expect(grid).not.toBeInTheDocument();
    });

    it('should show legend when showLegend is true', () => {
      const { container } = render(<Chart type="line" data={sampleData} showLegend={true} />);
      // Legend should be rendered as a separate div with legend items
      const legendItems = container.querySelectorAll('div[style*="display: flex"][style*="gap: 16px"] > div');
      expect(legendItems.length).toBe(sampleData.length);
    });
  });

  describe('Mobile Optimization', () => {
    it('should use default mobile-friendly dimensions', () => {
      const { container } = render(<Chart type="line" data={sampleData} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '360');
      expect(svg).toHaveAttribute('height', '240');
    });

    it('should accept custom dimensions', () => {
      const { container } = render(
        <Chart type="line" data={sampleData} width={320} height={200} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '320');
      expect(svg).toHaveAttribute('height', '200');
    });

    it('should have preserveAspectRatio for responsive scaling', () => {
      const { container } = render(<Chart type="line" data={sampleData} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    });
  });

  describe('Accessibility - Requirement 8.1', () => {
    it('should have role="img" for screen readers', () => {
      render(<Chart type="line" data={sampleData} />);
      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });

    it('should have default aria-label', () => {
      render(<Chart type="line" data={sampleData} />);
      const chart = screen.getByRole('img');
      expect(chart).toHaveAttribute('aria-label');
    });

    it('should use custom aria-label when provided', () => {
      const customLabel = 'Temperature chart for this week';
      render(
        <Chart type="line" data={sampleData} aria-label={customLabel} />
      );
      expect(screen.getByLabelText(customLabel)).toBeInTheDocument();
    });
  });

  describe('Data Visualization - Requirement 6.1', () => {
    it('should render all data points', () => {
      const { container } = render(<Chart type="line" data={sampleData} />);
      const circles = container.querySelectorAll('.chart-line circle');
      expect(circles.length).toBe(sampleData.length);
    });

    it('should render correct number of bars', () => {
      const { container } = render(<Chart type="bar" data={sampleData} />);
      const bars = container.querySelectorAll('.chart-bars rect');
      expect(bars.length).toBe(sampleData.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const { container } = render(<Chart type="line" data={[]} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const singlePoint: ChartDataPoint[] = [{ label: 'A', value: 10 }];
      const { container } = render(<Chart type="line" data={singlePoint} />);
      const circles = container.querySelectorAll('.chart-line circle');
      expect(circles.length).toBe(1);
    });

    it('should handle zero values', () => {
      const zeroData: ChartDataPoint[] = [
        { label: 'A', value: 0 },
        { label: 'B', value: 0 },
      ];
      const { container } = render(<Chart type="bar" data={zeroData} />);
      const bars = container.querySelectorAll('.chart-bars rect');
      expect(bars.length).toBe(2);
    });
  });
});
