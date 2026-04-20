/**
 * Alert Component Examples
 * Demonstrates different severity levels and configurations
 */

import React from 'react';
import { Alert } from './Alert';

export const AlertExamples: React.FC = () => {
  const handleAction = () => {
    console.log('Action button clicked');
  };

  const handleDismiss = () => {
    console.log('Alert dismissed');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
      <h2>Alert Component Examples</h2>

      {/* Info Alert */}
      <div>
        <h3>Info Alert</h3>
        <Alert
          severity="info"
          title="Thông tin cập nhật"
          message="Hệ thống đã cập nhật dữ liệu cảm biến mới nhất."
        />
      </div>

      {/* Warning Alert with Action */}
      <div>
        <h3>Warning Alert with Action</h3>
        <Alert
          severity="warning"
          title="Độ ẩm thấp"
          message="Độ ẩm đất đang ở mức 45%, thấp hơn ngưỡng khuyến nghị 60%."
          action={{
            label: 'Tưới nước',
            onClick: handleAction,
          }}
        />
      </div>

      {/* Error Alert with Dismiss */}
      <div>
        <h3>Error Alert with Dismiss</h3>
        <Alert
          severity="error"
          title="Nhiệt độ quá cao"
          message="Nhiệt độ đã vượt ngưỡng 35°C. Cần hành động ngay lập tức để bảo vệ cây trồng."
          dismissible
          onDismiss={handleDismiss}
        />
      </div>

      {/* Success Alert */}
      <div>
        <h3>Success Alert</h3>
        <Alert
          severity="success"
          title="Tưới nước thành công"
          message="Hệ thống tưới tự động đã hoàn thành. Độ ẩm đất hiện tại: 65%."
        />
      </div>

      {/* Error Alert with Action and Dismiss */}
      <div>
        <h3>Error Alert with Action and Dismiss</h3>
        <Alert
          severity="error"
          title="Cảnh báo nghiêm trọng"
          message="Phát hiện sâu bệnh trên lá cây. Cần xử lý ngay để tránh lây lan."
          action={{
            label: 'Xem chi tiết',
            onClick: handleAction,
          }}
          dismissible
          onDismiss={handleDismiss}
        />
      </div>

      {/* Warning Alert - Requirement 13.3 (3-click rule) */}
      <div>
        <h3>Warning Alert - Critical Access</h3>
        <Alert
          severity="warning"
          title="Cần chăm sóc cây trồng"
          message="Có 3 tác vụ chăm sóc cần thực hiện trong hôm nay."
          action={{
            label: 'Xem tác vụ',
            onClick: handleAction,
          }}
        />
      </div>
    </div>
  );
};

export default AlertExamples;
