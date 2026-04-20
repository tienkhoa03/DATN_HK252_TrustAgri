/**
 * Chart Component Examples
 * Demonstrates usage of Chart component with different types
 */

import React from 'react';
import { Chart, ChartDataPoint } from './Chart';
import { colors } from '../../tokens/colors';

// Sample data for demonstrations
const temperatureData: ChartDataPoint[] = [
  { label: 'Mon', value: 28 },
  { label: 'Tue', value: 30 },
  { label: 'Wed', value: 27 },
  { label: 'Thu', value: 29 },
  { label: 'Fri', value: 31 },
  { label: 'Sat', value: 32 },
  { label: 'Sun', value: 30 },
];

const priceData: ChartDataPoint[] = [
  { label: 'Jan', value: 45000 },
  { label: 'Feb', value: 48000 },
  { label: 'Mar', value: 46000 },
  { label: 'Apr', value: 50000 },
  { label: 'May', value: 52000 },
  { label: 'Jun', value: 49000 },
];

const profitData: ChartDataPoint[] = [
  { label: 'Q1', value: 15 },
  { label: 'Q2', value: -5 },
  { label: 'Q3', value: 20 },
  { label: 'Q4', value: 25 },
];

export const ChartExamples: React.FC = () => {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <div>
        <h2>Line Chart - Temperature Monitoring</h2>
        <p>Requirement 6.1: Data visualization for environmental monitoring</p>
        <Chart
          type="line"
          data={temperatureData}
          xAxis={{ label: 'Day of Week' }}
          yAxis={{ label: 'Temperature (°C)', min: 25, max: 35 }}
          showGrid={true}
          colors={[colors.primary.agriGreen]}
          aria-label="Weekly temperature chart"
        />
      </div>

      <div>
        <h2>Bar Chart - Market Prices</h2>
        <p>Requirement 7.2: Market trends visualization for traders</p>
        <Chart
          type="bar"
          data={priceData}
          xAxis={{ label: 'Month' }}
          yAxis={{ label: 'Price (VND)', min: 40000, max: 55000 }}
          showGrid={true}
          colors={[colors.primary.agriGreen]}
          aria-label="Monthly price chart"
        />
      </div>

      <div>
        <h2>Bar Chart - Profit/Loss (Color Mapping)</h2>
        <p>Requirement 17.2: Green for positive, Red for negative</p>
        <Chart
          type="bar"
          data={profitData}
          xAxis={{ label: 'Quarter' }}
          yAxis={{ label: 'Profit (%)', min: -10, max: 30 }}
          showGrid={true}
          aria-label="Quarterly profit chart"
        />
      </div>

      <div>
        <h2>Area Chart - Growth Trend</h2>
        <p>Requirement 17.1: Dashboard visualization</p>
        <Chart
          type="area"
          data={temperatureData}
          xAxis={{ label: 'Day' }}
          yAxis={{ label: 'Growth Index', min: 20, max: 35 }}
          showGrid={true}
          showLegend={false}
          colors={[colors.primary.agriGreen]}
          aria-label="Growth trend chart"
        />
      </div>

      <div>
        <h2>Mobile Optimized Chart</h2>
        <p>Optimized for mobile display with smaller dimensions</p>
        <Chart
          type="line"
          data={temperatureData}
          width={320}
          height={200}
          xAxis={{ label: 'Day' }}
          yAxis={{ label: 'Temp', showTicks: true, tickCount: 4 }}
          showGrid={true}
          colors={[colors.primary.agriGreen]}
          aria-label="Mobile temperature chart"
        />
      </div>
    </div>
  );
};

export default ChartExamples;
