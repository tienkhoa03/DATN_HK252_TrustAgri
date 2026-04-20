/**
 * Card Component Examples
 * Demonstrates various Card component configurations
 */

import React from 'react';
import { Card } from './Card';

export const CardExamples: React.FC = () => {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2>Card Component Examples</h2>

      {/* Basic Card */}
      <div>
        <h3>Basic Card</h3>
        <Card title="Farm Lab A" subtitle="Mekong Delta - 2 hectares">
          <p>Basic card with title and subtitle</p>
        </Card>
      </div>

      {/* Card with Image */}
      <div>
        <h3>Card with Image</h3>
        <Card
          title="Organic Vegetables"
          subtitle="Fresh from the farm"
          image="https://via.placeholder.com/400x200"
        >
          <p>High quality organic produce</p>
        </Card>
      </div>

      {/* Card with Status - Success */}
      <div>
        <h3>Card with Success Status</h3>
        <Card
          title="Temperature Normal"
          subtitle="28°C - Optimal range"
          status="success"
        >
          <p>All environmental parameters are within normal range</p>
        </Card>
      </div>

      {/* Card with Status - Warning */}
      <div>
        <h3>Card with Warning Status</h3>
        <Card
          title="Humidity Low"
          subtitle="55% - Below optimal"
          status="warning"
        >
          <p>Consider increasing irrigation</p>
        </Card>
      </div>

      {/* Card with Status - Error */}
      <div>
        <h3>Card with Error Status</h3>
        <Card
          title="Temperature Critical"
          subtitle="38°C - Dangerous level"
          status="error"
        >
          <p>Immediate action required</p>
        </Card>
      </div>

      {/* Clickable Card */}
      <div>
        <h3>Clickable Card</h3>
        <Card
          title="View Details"
          subtitle="Click to see more information"
          onClick={() => alert('Card clicked!')}
        >
          <p>This card is interactive</p>
        </Card>
      </div>

      {/* Card with Image and Status */}
      <div>
        <h3>Card with Image and Status</h3>
        <Card
          title="Farm Lab B"
          subtitle="Central Highlands - 5 hectares"
          image="https://via.placeholder.com/400x200"
          status="success"
          onClick={() => alert('Farm Lab B clicked!')}
        >
          <p>VietGAP certified farm</p>
        </Card>
      </div>

      {/* Grid Layout Example */}
      <div>
        <h3>Card Grid Layout</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          <Card title="Order #123" subtitle="Pending" status="warning">
            <p>50kg Organic Rice</p>
          </Card>
          <Card title="Order #124" subtitle="Completed" status="success">
            <p>30kg Fresh Vegetables</p>
          </Card>
          <Card title="Order #125" subtitle="Cancelled" status="error">
            <p>20kg Fruits</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CardExamples;
