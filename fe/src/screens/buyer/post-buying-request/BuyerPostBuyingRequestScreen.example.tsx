/**
 * Buyer Post Buying Request Screen Examples
 * Usage examples for the Buyer Post Buying Request Screen
 */

import React from 'react';
import { BuyerPostBuyingRequestScreen, BuyingRequest } from './BuyerPostBuyingRequestScreen';

/**
 * Example 1: Basic Usage
 * Sử dụng cơ bản với các props mặc định
 */
export const BasicUsageExample: React.FC = () => {
  return <BuyerPostBuyingRequestScreen />;
};

/**
 * Example 2: With Custom Buyer Name
 * Sử dụng với tên người mua tùy chỉnh
 */
export const WithCustomBuyerNameExample: React.FC = () => {
  return <BuyerPostBuyingRequestScreen buyerName="Nguyễn Văn A" />;
};

/**
 * Example 3: With Submit Handler
 * Sử dụng với xử lý khi đăng tin
 */
export const WithSubmitHandlerExample: React.FC = () => {
  const handleSubmit = (request: BuyingRequest) => {
    console.log('Buying request submitted:', request);
    // Send to API
    // fetch('/api/buying-requests', {
    //   method: 'POST',
    //   body: JSON.stringify(request),
    // });
  };

  return <BuyerPostBuyingRequestScreen onSubmit={handleSubmit} />;
};

/**
 * Example 4: With Cancel Handler
 * Sử dụng với xử lý khi hủy
 */
export const WithCancelHandlerExample: React.FC = () => {
  const handleCancel = () => {
    console.log('Cancelled');
    // Navigate back or show confirmation
  };

  return <BuyerPostBuyingRequestScreen onCancel={handleCancel} />;
};

/**
 * Example 5: Complete Example
 * Ví dụ đầy đủ với tất cả các props
 */
export const CompleteExample: React.FC = () => {
  const handleSubmit = (request: BuyingRequest) => {
    console.log('Buying request submitted:', request);
    alert(`Đã đăng nhu cầu mua:\n\n` +
      `Nông sản: ${request.productType}\n` +
      `Số lượng: ${request.quantity} ${request.unit}\n` +
      `Giá: ${request.priceMin.toLocaleString()} - ${request.priceMax.toLocaleString()} VNĐ/${request.unit}\n` +
      `Tiêu chuẩn: ${request.standards.join(', ')}\n` +
      `Mô tả: ${request.description}`
    );
  };

  const handleCancel = () => {
    console.log('Cancelled');
  };

  return (
    <BuyerPostBuyingRequestScreen
      buyerName="Tiến Khoa"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

/**
 * Usage Notes:
 * 
 * 1. Form Validation:
 *    - Bước 1: Phải chọn loại nông sản
 *    - Bước 2: Số lượng và giá phải > 0
 *    - Bước 3: Phải chọn ít nhất 1 tiêu chuẩn
 *    - Bước 4: Mô tả không được để trống
 * 
 * 2. Step Navigation:
 *    - Người dùng chỉ có thể tiếp tục khi bước hiện tại hợp lệ
 *    - Có thể quay lại bước trước bất cứ lúc nào
 * 
 * 3. Success Feedback:
 *    - Hiển thị overlay thành công trong 2 giây
 *    - Tự động reset form sau khi thành công
 * 
 * 4. Data Structure:
 *    interface BuyingRequest {
 *      productType: string;
 *      quantity: number;
 *      unit: 'kg' | 'tấn';
 *      priceMin: number;
 *      priceMax: number;
 *      standards: string[];
 *      description: string;
 *    }
 */
