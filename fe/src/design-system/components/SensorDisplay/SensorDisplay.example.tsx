/**
 * SensorDisplay Component Examples
 * Demonstrates usage of SensorDisplay component
 */

import React from 'react';
import { SensorDisplay } from './SensorDisplay';

export const SensorDisplayExamples: React.FC = () => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60000);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h1>SensorDisplay Component Examples</h1>

      {/* Temperature Sensors */}
      <section>
        <h2>Temperature Sensors</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <SensorDisplay
            type="temperature"
            value={28}
            unit="°C"
            status="normal"
            timestamp={fiveMinutesAgo}
          />
          <SensorDisplay
            type="temperature"
            value={32}
            unit="°C"
            status="warning"
            timestamp={fiveMinutesAgo}
          />
          <SensorDisplay
            type="temperature"
            value={38}
            unit="°C"
            status="danger"
            timestamp={fiveMinutesAgo}
          />
        </div>
      </section>

      {/* Humidity Sensors */}
      <section>
        <h2>Humidity Sensors</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <SensorDisplay
            type="humidity"
            value={75}
            unit="%"
            status="normal"
            timestamp={oneHourAgo}
          />
          <SensorDisplay
            type="humidity"
            value={55}
            unit="%"
            status="warning"
            timestamp={oneHourAgo}
          />
          <SensorDisplay
            type="humidity"
            value={40}
            unit="%"
            status="danger"
            timestamp={oneHourAgo}
          />
        </div>
      </section>

      {/* Light Sensors */}
      <section>
        <h2>Light Sensors</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <SensorDisplay
            type="light"
            value={850}
            unit="lux"
            status="normal"
            timestamp={now}
          />
          <SensorDisplay
            type="light"
            value={600}
            unit="lux"
            status="warning"
            timestamp={now}
          />
          <SensorDisplay
            type="light"
            value={300}
            unit="lux"
            status="danger"
            timestamp={now}
          />
        </div>
      </section>

      {/* Imputed Data */}
      <section>
        <h2>Imputed Data (Dữ liệu bổ khuyết)</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <SensorDisplay
            type="temperature"
            value={27}
            unit="°C"
            status="normal"
            isImputed={true}
            timestamp={fiveMinutesAgo}
          />
          <SensorDisplay
            type="humidity"
            value={70}
            unit="%"
            status="normal"
            isImputed={true}
            timestamp={oneHourAgo}
          />
          <SensorDisplay
            type="light"
            value={800}
            unit="lux"
            status="normal"
            isImputed={true}
            timestamp={now}
          />
        </div>
      </section>

      {/* Grid Layout Example */}
      <section>
        <h2>Grid Layout (3 columns)</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            maxWidth: '600px',
          }}
        >
          <SensorDisplay
            type="temperature"
            value={28}
            unit="°C"
            status="normal"
            timestamp={fiveMinutesAgo}
          />
          <SensorDisplay
            type="humidity"
            value={75}
            unit="%"
            status="normal"
            timestamp={fiveMinutesAgo}
          />
          <SensorDisplay
            type="light"
            value={850}
            unit="lux"
            status="normal"
            timestamp={fiveMinutesAgo}
          />
        </div>
      </section>
    </div>
  );
};

export default SensorDisplayExamples;
