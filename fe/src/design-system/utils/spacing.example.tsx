/**
 * Spacing System Usage Examples
 * Demonstrates how to use spacing utilities and grid system
 */

import React from 'react';
import { spacingUtils } from './spacing';
import { gridUtils } from './grid';

/**
 * Example: Using spacing utilities for margins and padding
 */
export const SpacingExample: React.FC = () => {
  return (
    <div style={spacingUtils.padding('md', 'all')}>
      <h2 style={spacingUtils.margin('sm', 'bottom')}>Spacing Example</h2>
      
      <div style={{ ...spacingUtils.padding('sm', 'all'), backgroundColor: '#f0f0f0' }}>
        <p style={spacingUtils.margin('xs', 'bottom')}>
          This box has small padding on all sides
        </p>
      </div>
      
      <div style={{ ...spacingUtils.margin('md', 'top'), ...spacingUtils.padding('lg', 'vertical') }}>
        <p>This has medium margin on top and large padding vertically</p>
      </div>
    </div>
  );
};

/**
 * Example: 3-column sensor grid layout
 */
export const SensorGridExample: React.FC = () => {
  const sensors = [
    { type: 'Temperature', value: '28°C', status: 'normal' },
    { type: 'Humidity', value: '75%', status: 'normal' },
    { type: 'Light', value: '850 lux', status: 'warning' },
  ];
  
  return (
    <div style={spacingUtils.padding('md', 'all')}>
      <h2 style={spacingUtils.margin('sm', 'bottom')}>Sensor Grid (3 columns)</h2>
      
      <div style={gridUtils.commonLayouts.sensorGrid}>
        {sensors.map((sensor, index) => (
          <div
            key={index}
            style={{
              ...spacingUtils.padding('md', 'all'),
              backgroundColor: '#f7f7f8',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={spacingUtils.margin('xs', 'bottom')}>{sensor.type}</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>{sensor.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Example: 2-column product grid layout
 */
export const ProductGridExample: React.FC = () => {
  const products = [
    { name: 'Organic Tomatoes', price: '50,000đ' },
    { name: 'Fresh Lettuce', price: '30,000đ' },
    { name: 'Green Peppers', price: '40,000đ' },
    { name: 'Cucumbers', price: '25,000đ' },
  ];
  
  return (
    <div style={spacingUtils.padding('md', 'all')}>
      <h2 style={spacingUtils.margin('sm', 'bottom')}>Product Grid (2 columns)</h2>
      
      <div style={gridUtils.commonLayouts.productGrid}>
        {products.map((product, index) => (
          <div
            key={index}
            style={{
              ...spacingUtils.padding('md', 'all'),
              backgroundColor: '#ffffff',
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
            }}
          >
            <div style={spacingUtils.margin('xs', 'bottom')}>{product.name}</div>
            <div style={{ color: '#3EBB6C', fontWeight: 600 }}>{product.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Example: Flexbox layout with gap
 */
export const FlexLayoutExample: React.FC = () => {
  return (
    <div style={spacingUtils.padding('md', 'all')}>
      <h2 style={spacingUtils.margin('sm', 'bottom')}>Flex Layout Example</h2>
      
      <div style={gridUtils.flexContainer({ direction: 'row', justify: 'space-between', align: 'center', gap: 'md' })}>
        <div style={{ ...spacingUtils.padding('sm', 'all'), backgroundColor: '#0068FF', color: 'white', borderRadius: '4px' }}>
          Item 1
        </div>
        <div style={{ ...spacingUtils.padding('sm', 'all'), backgroundColor: '#3EBB6C', color: 'white', borderRadius: '4px' }}>
          Item 2
        </div>
        <div style={{ ...spacingUtils.padding('sm', 'all'), backgroundColor: '#FFCC00', borderRadius: '4px' }}>
          Item 3
        </div>
      </div>
    </div>
  );
};

/**
 * Example: Screen layout structure
 */
export const ScreenLayoutExample: React.FC = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ ...gridUtils.screenLayout.header, backgroundColor: '#0068FF', color: 'white' }}>
        <div>Farm Lab A</div>
        <div>Menu</div>
      </div>
      
      {/* Content */}
      <div style={{ ...gridUtils.screenLayout.content, flex: 1, backgroundColor: '#ffffff' }}>
        <h3 style={spacingUtils.margin('sm', 'bottom')}>Content Area</h3>
        <p>This is the scrollable content area with proper padding.</p>
      </div>
      
      {/* Footer */}
      <div style={{ ...gridUtils.screenLayout.footer, backgroundColor: '#f7f7f8', borderTop: '1px solid #e0e0e0' }}>
        <div>Home</div>
        <div>Monitor</div>
        <div>Alerts</div>
        <div>Profile</div>
      </div>
    </div>
  );
};

export default {
  SpacingExample,
  SensorGridExample,
  ProductGridExample,
  FlexLayoutExample,
  ScreenLayoutExample,
};
