/**
 * DigitalTwinViewer Component Examples
 * Demonstrates usage of the DigitalTwinViewer component
 */

import React, { useState } from 'react';
import { DigitalTwinViewer, GrowthStage, HealthStatus } from './DigitalTwinViewer';

export const DigitalTwinViewerExamples: React.FC = () => {
  const [growthStage, setGrowthStage] = useState<GrowthStage>('vegetative');
  const [health, setHealth] = useState<HealthStatus>('healthy');

  const plantModel = {
    id: '1',
    name: 'Cà chua Cherry',
    type: 'Solanum lycopersicum',
  };

  const environmentData = {
    temperature: 28,
    humidity: 75,
    light: 850,
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1>DigitalTwinViewer Component Examples</h1>

      {/* Interactive Example */}
      <section>
        <h2>Interactive Example</h2>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Growth Stage:</label>
            <select
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="seedling">Seedling (Mầm)</option>
              <option value="vegetative">Vegetative (Sinh trưởng)</option>
              <option value="flowering">Flowering (Ra hoa)</option>
              <option value="fruiting">Fruiting (Kết trái)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Health Status:</label>
            <select
              value={health}
              onChange={(e) => setHealth(e.target.value as HealthStatus)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="healthy">Healthy (Khỏe mạnh)</option>
              <option value="stressed">Stressed (Căng thẳng)</option>
              <option value="diseased">Diseased (Bệnh)</option>
            </select>
          </div>
        </div>
        <DigitalTwinViewer
          plantModel={plantModel}
          environmentData={environmentData}
          growthStage={growthStage}
          health={health}
        />
      </section>

      {/* All Growth Stages */}
      <section>
        <h2>All Growth Stages (Healthy)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Giai đoạn Mầm' }}
            environmentData={environmentData}
            growthStage="seedling"
            health="healthy"
          />
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Giai đoạn Sinh trưởng' }}
            environmentData={environmentData}
            growthStage="vegetative"
            health="healthy"
          />
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Giai đoạn Ra hoa' }}
            environmentData={environmentData}
            growthStage="flowering"
            health="healthy"
          />
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Giai đoạn Kết trái' }}
            environmentData={environmentData}
            growthStage="fruiting"
            health="healthy"
          />
        </div>
      </section>

      {/* All Health Statuses */}
      <section>
        <h2>All Health Statuses (Vegetative Stage)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Cây Khỏe mạnh' }}
            environmentData={environmentData}
            growthStage="vegetative"
            health="healthy"
          />
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Cây Căng thẳng' }}
            environmentData={{ ...environmentData, temperature: 38, humidity: 45 }}
            growthStage="vegetative"
            health="stressed"
          />
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Cây Bệnh' }}
            environmentData={{ ...environmentData, temperature: 35, humidity: 90 }}
            growthStage="vegetative"
            health="diseased"
          />
        </div>
      </section>

      {/* Different Environment Conditions */}
      <section>
        <h2>Different Environment Conditions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Điều kiện Lý tưởng' }}
            environmentData={{ temperature: 25, humidity: 70, light: 800 }}
            growthStage="flowering"
            health="healthy"
          />
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Nhiệt độ Cao' }}
            environmentData={{ temperature: 38, humidity: 50, light: 1200 }}
            growthStage="flowering"
            health="stressed"
          />
          <DigitalTwinViewer
            plantModel={{ ...plantModel, name: 'Độ ẩm Cao' }}
            environmentData={{ temperature: 30, humidity: 95, light: 600 }}
            growthStage="flowering"
            health="diseased"
          />
        </div>
      </section>
    </div>
  );
};

export default DigitalTwinViewerExamples;
