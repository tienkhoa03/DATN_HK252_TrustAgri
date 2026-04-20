/**
 * Icon Component Examples
 * Demonstrates usage of Icon component with different variants
 * 
 * Requirements: 4.1-4.6, 8.4
 */

import React from 'react';
import { Icon } from './Icon';

/**
 * Example: Navigation Icons from Zaui
 * Requirement 4.2 - Navigation icons from Zaui library
 */
export const NavigationIconsExample: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
      <Icon name="home" size="md" />
      <Icon name="user" size="md" />
      <Icon name="settings" size="md" />
      <Icon name="notification" size="md" />
    </div>
  );
};

/**
 * Example: Agriculture Icons (Custom Outline Style)
 * Requirements 4.1, 4.3-4.6 - Custom agriculture icons with outline style
 */
export const AgricultureIconsExample: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
      {/* Temperature sensor icon - Requirement 4.3 */}
      <Icon name="temperature" size="md" color="#F50000" />
      
      {/* Humidity sensor icon - Requirement 4.4 */}
      <Icon name="humidity" size="md" color="#0068FF" />
      
      {/* Light sensor icon - Requirement 4.5 */}
      <Icon name="light" size="md" color="#FFCC00" />
      
      {/* Alert icon - Requirement 4.6 */}
      <Icon name="alert" size="md" color="#F50000" />
      
      <Icon name="plant" size="md" color="#3EBB6C" />
      <Icon name="farm" size="md" color="#3EBB6C" />
    </div>
  );
};

/**
 * Example: Icon Size Variants
 * Demonstrates small, medium, and large icon sizes
 */
export const IconSizesExample: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px' }}>
      <Icon name="temperature" size="sm" />
      <Icon name="temperature" size="md" />
      <Icon name="temperature" size="lg" />
    </div>
  );
};

/**
 * Example: Sensor Display with Icons
 * Demonstrates icon mapping for different sensor types
 * Requirements 4.3-4.6
 */
export const SensorIconMappingExample: React.FC = () => {
  const sensors = [
    { type: 'temperature' as const, value: '28°C', color: '#3EBB6C' },
    { type: 'humidity' as const, value: '75%', color: '#0068FF' },
    { type: 'light' as const, value: '850 lux', color: '#FFCC00' },
  ];
  
  return (
    <div style={{ display: 'flex', gap: '24px', padding: '16px' }}>
      {sensors.map((sensor) => (
        <div
          key={sensor.type}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name={sensor.type} size="lg" color={sensor.color} />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>
            {sensor.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Example: Action Icons
 * Demonstrates action icons from Zaui
 */
export const ActionIconsExample: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
      <Icon name="add" size="md" />
      <Icon name="edit" size="md" />
      <Icon name="delete" size="md" />
      <Icon name="search" size="md" />
      <Icon name="filter" size="md" />
    </div>
  );
};

/**
 * Example: Icons with Accessibility
 * Demonstrates proper aria-label usage
 */
export const AccessibleIconsExample: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
      <button aria-label="Go to home">
        <Icon name="home" size="md" aria-label="Home" />
      </button>
      <button aria-label="View notifications">
        <Icon name="notification" size="md" aria-label="Notifications" />
      </button>
      <button aria-label="Temperature sensor reading">
        <Icon name="temperature" size="md" aria-label="Temperature" />
      </button>
    </div>
  );
};

/**
 * Example: Complete Icon Showcase
 * Shows all available icons in the system
 */
export const CompleteIconShowcase: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>Navigation Icons (Zaui)</h2>
      <NavigationIconsExample />
      
      <h2 style={{ fontSize: '22px', marginTop: '32px', marginBottom: '16px' }}>
        Agriculture Icons (Custom Outline)
      </h2>
      <AgricultureIconsExample />
      
      <h2 style={{ fontSize: '22px', marginTop: '32px', marginBottom: '16px' }}>
        Action Icons (Zaui)
      </h2>
      <ActionIconsExample />
      
      <h2 style={{ fontSize: '22px', marginTop: '32px', marginBottom: '16px' }}>
        Size Variants
      </h2>
      <IconSizesExample />
    </div>
  );
};

export default CompleteIconShowcase;
