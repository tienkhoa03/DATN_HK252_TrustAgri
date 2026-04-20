/**
 * Trader Trading & Orders Screen Examples
 * Các ví dụ sử dụng màn hình Sàn giao dịch và Đơn hàng
 */

import React from 'react';
import { TraderTradingOrdersScreen } from './TraderTradingOrdersScreen';

/**
 * Example 1: Basic Usage
 * Sử dụng cơ bản với props mặc định
 */
export const BasicTraderTradingOrdersExample = () => {
  return <TraderTradingOrdersScreen />;
};

/**
 * Example 2: Custom Trader Name
 * Tùy chỉnh tên thương lái
 */
export const CustomTraderNameExample = () => {
  return <TraderTradingOrdersScreen traderName="Công ty TNHH Nông sản Xanh" />;
};

/**
 * Example 3: Integration Example
 * Ví dụ tích hợp với navigation
 */
export const IntegrationExample = () => {
  const handleNavigation = (screen: string) => {
    console.log(`Navigate to: ${screen}`);
  };

  return (
    <div>
      <TraderTradingOrdersScreen traderName="Thương lái Miền Tây" />
    </div>
  );
};

/**
 * Usage Notes:
 * 
 * 1. Tab Kho hàng (My Products):
 *    - Hiển thị danh sách sản phẩm đang bán
 *    - Nút FAB để tạo tin đăng mới
 *    - Chỉnh sửa và xem chi tiết sản phẩm
 * 
 * 2. Tab Nhu cầu mua (Buying Requests):
 *    - Danh sách yêu cầu từ người mua
 *    - Thông tin chi tiết: số lượng, giá, tiêu chuẩn
 *    - Nút Báo giá/Kết nối để gửi đề xuất
 * 
 * 3. Tab Quản lý Đơn hàng (Orders):
 *    - Trạng thái: Chờ xác nhận → Đã đặt cọc → Đang giao → Hoàn tất
 *    - Click vào đơn hàng để xem chi tiết
 *    - Gán nguồn cung từ vườn nông dân
 *    - Kích hoạt truy xuất nguồn gốc
 * 
 * 4. Chi tiết Đơn hàng:
 *    - Thông tin người mua và số tiền đã cọc
 *    - Gán nguồn cung (chọn lô hàng từ vườn)
 *    - Kích hoạt truy xuất nguồn gốc (QR code)
 *    - Xác nhận hoặc từ chối đơn hàng
 */

export default {
  BasicTraderTradingOrdersExample,
  CustomTraderNameExample,
  IntegrationExample,
};
