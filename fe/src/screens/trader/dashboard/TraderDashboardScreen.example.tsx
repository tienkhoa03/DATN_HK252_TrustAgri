/**
 * Trader Dashboard Screen Examples
 * Các ví dụ sử dụng Trader Dashboard Screen
 */

import React from 'react';
import { TraderDashboardScreen } from './TraderDashboardScreen';

/**
 * Example 1: Basic Trader Dashboard
 * Màn hình dashboard cơ bản với dữ liệu mặc định
 */
export const BasicTraderDashboard = () => {
  return <TraderDashboardScreen />;
};

/**
 * Example 2: Trader Dashboard with Custom Data
 * Màn hình dashboard với dữ liệu tùy chỉnh
 */
export const CustomTraderDashboard = () => {
  return (
    <TraderDashboardScreen
      traderName="Nguyễn Văn A"
      companyName="Công ty TNHH Nông sản Xanh"
    />
  );
};

/**
 * Example 3: Trader Dashboard for Large Company
 * Màn hình dashboard cho công ty lớn
 */
export const LargeCompanyDashboard = () => {
  return (
    <TraderDashboardScreen
      traderName="Trần Thị B"
      companyName="Tập đoàn Nông nghiệp Việt Nam"
    />
  );
};

export default {
  BasicTraderDashboard,
  CustomTraderDashboard,
  LargeCompanyDashboard,
};
