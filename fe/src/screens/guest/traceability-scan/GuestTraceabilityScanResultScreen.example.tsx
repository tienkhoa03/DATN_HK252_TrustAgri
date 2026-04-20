/**
 * Guest Traceability Scan Result Screen Examples
 * Usage examples for the Guest Traceability Scan Result Screen
 */

import React from 'react';
import { GuestTraceabilityScanResultScreen } from './GuestTraceabilityScanResultScreen';

/**
 * Example 1: Basic Usage
 * Màn hình truy xuất nguồn gốc cơ bản với callback đăng nhập
 */
export const BasicExample: React.FC = () => {
  const handleLogin = () => {
    console.log('User wants to login');
    // Redirect to Zalo login
  };

  return (
    <GuestTraceabilityScanResultScreen
      productId="PROD-001"
      onLogin={handleLogin}
    />
  );
};

/**
 * Example 2: Different Product
 * Màn hình với sản phẩm khác
 */
export const DifferentProductExample: React.FC = () => {
  const handleLogin = () => {
    alert('Đăng nhập để xem chi tiết và đặt mua sản phẩm');
  };

  return (
    <GuestTraceabilityScanResultScreen
      productId="PROD-002"
      onLogin={handleLogin}
    />
  );
};

/**
 * Example 3: Without Login Handler
 * Màn hình không có callback đăng nhập (chỉ hiển thị thông tin)
 */
export const WithoutLoginExample: React.FC = () => {
  return (
    <GuestTraceabilityScanResultScreen
      productId="PROD-003"
    />
  );
};

/**
 * Example 4: With Custom Login Handler
 * Màn hình với xử lý đăng nhập tùy chỉnh
 */
export const CustomLoginExample: React.FC = () => {
  const handleLogin = () => {
    // Custom login logic
    console.log('Opening Zalo login dialog...');
    
    // Simulate Zalo login
    setTimeout(() => {
      console.log('Login successful!');
      // Navigate to authenticated view
    }, 1000);
  };

  return (
    <GuestTraceabilityScanResultScreen
      productId="PROD-004"
      onLogin={handleLogin}
    />
  );
};

/**
 * Example 5: Integration with QR Scanner
 * Tích hợp với QR scanner
 */
export const QRScannerIntegrationExample: React.FC = () => {
  const [scannedProductId, setScannedProductId] = React.useState<string | null>(null);

  const handleQRScan = (qrCode: string) => {
    // Extract product ID from QR code
    const productId = qrCode.split('/').pop() || 'PROD-001';
    setScannedProductId(productId);
  };

  const handleLogin = () => {
    console.log('Redirecting to Zalo login...');
  };

  if (!scannedProductId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Quét mã QR trên bao bì sản phẩm</h2>
        <button
          onClick={() => handleQRScan('https://example.com/product/PROD-005')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0068FF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Mô phỏng quét QR
        </button>
      </div>
    );
  }

  return (
    <GuestTraceabilityScanResultScreen
      productId={scannedProductId}
      onLogin={handleLogin}
    />
  );
};

export default {
  BasicExample,
  DifferentProductExample,
  WithoutLoginExample,
  CustomLoginExample,
  QRScannerIntegrationExample,
};
