/**
 * Button Component Examples
 * Demonstrates all variants, sizes, and states
 */

import React, { useState } from 'react';
import { Button } from './Button';
import { Icon } from '../Icon';

export const ButtonExamples: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <h2 style={{ marginBottom: '16px' }}>Variants</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="text">Text Button</Button>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px' }}>Sizes</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" size="small">Small</Button>
          <Button variant="primary" size="medium">Medium</Button>
          <Button variant="primary" size="large">Large</Button>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px' }}>With Icons</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button variant="primary" icon={<Icon name="add" size="sm" />}>
            Thêm mới
          </Button>
          <Button variant="secondary" icon={<Icon name="edit" size="sm" />}>
            Chỉnh sửa
          </Button>
          <Button variant="outline" icon={<Icon name="delete" size="sm" />}>
            Xóa
          </Button>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px' }}>States</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button variant="primary">Default</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" loading={loading} onClick={handleLoadingClick}>
            {loading ? 'Đang xử lý...' : 'Click để Loading'}
          </Button>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px' }}>All Variants - Disabled</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button variant="primary" disabled>Primary Disabled</Button>
          <Button variant="secondary" disabled>Secondary Disabled</Button>
          <Button variant="outline" disabled>Outline Disabled</Button>
          <Button variant="text" disabled>Text Disabled</Button>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px' }}>All Variants - Loading</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button variant="primary" loading>Primary Loading</Button>
          <Button variant="secondary" loading>Secondary Loading</Button>
          <Button variant="outline" loading>Outline Loading</Button>
          <Button variant="text" loading>Text Loading</Button>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px' }}>Accessibility</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button 
            variant="primary" 
            aria-label="Xác nhận đơn hàng"
            onClick={() => alert('Button clicked!')}
          >
            Xác nhận
          </Button>
          <Button 
            variant="outline" 
            aria-label="Hủy đơn hàng"
            onClick={() => alert('Cancel clicked!')}
          >
            Hủy
          </Button>
        </div>
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
          Try keyboard navigation: Tab to focus, Enter or Space to activate
        </p>
      </section>

      <section>
        <h2 style={{ marginBottom: '16px' }}>Real-world Examples</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary">
              Đặt hàng ngay
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline">
              Hủy
            </Button>
            <Button variant="primary">
              Xác nhận
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" icon={<Icon name="plant" size="sm" />}>
              Thêm cây trồng
            </Button>
          </div>
          <div>
            <Button variant="text">
              Xem chi tiết →
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ButtonExamples;
