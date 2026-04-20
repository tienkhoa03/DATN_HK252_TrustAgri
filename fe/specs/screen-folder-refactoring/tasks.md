# Implementation Plan: Screen Folder Refactoring

## Overview

This plan outlines the step-by-step implementation for refactoring screen files into feature-based subfolders. The refactoring will be done incrementally by user role (buyer, farmer, guest, trader) to minimize risk and allow for validation at each step.

## Tasks

- [x] 1. Refactor Buyer Screens
  - Create subfolders and move all buyer screen files into feature-based organization
  - _Requirements: 1.1-1.8, 5.1, 6.1-6.3, 7.1-7.3, 8.1-8.3_

  - [x] 1.1 Create buyer screen subfolders
    - Create directories: digital-twin-monitor, marketplace, orders-proposals, post-buying-request, product-detail, profile-notification
    - _Requirements: 1.1_

  - [x] 1.2 Move BuyerDigitalTwinMonitorScreen files
    - Move all BuyerDigitalTwinMonitorScreen.* files to digital-twin-monitor/
    - Move BUYER_DIGITAL_TWIN_MONITOR_IMPLEMENTATION_SUMMARY.md
    - Create digital-twin-monitor/index.ts with export
    - _Requirements: 1.2, 6.1-6.3, 7.1_

  - [x] 1.3 Move BuyerMarketplaceScreen files
    - Move all BuyerMarketplaceScreen.* files to marketplace/
    - Move BUYER_MARKETPLACE_IMPLEMENTATION_SUMMARY.md
    - Create marketplace/index.ts with export
    - _Requirements: 1.3, 6.1-6.3, 7.1_

  - [x] 1.4 Move BuyerOrdersProposalsScreen files
    - Move all BuyerOrdersProposalsScreen.* files to orders-proposals/
    - Move BUYER_ORDERS_PROPOSALS_IMPLEMENTATION_SUMMARY.md
    - Create orders-proposals/index.ts with export
    - _Requirements: 1.4, 6.1-6.3, 7.1_

  - [x] 1.5 Move BuyerPostBuyingRequestScreen files
    - Move all BuyerPostBuyingRequestScreen.* files to post-buying-request/
    - Move BUYER_POST_BUYING_REQUEST_IMPLEMENTATION_SUMMARY.md
    - Create post-buying-request/index.ts with export
    - _Requirements: 1.5, 6.1-6.3, 7.1_

  - [x] 1.6 Move BuyerProductDetailScreen files
    - Move all BuyerProductDetailScreen.* files to product-detail/
    - Move BUYER_PRODUCT_DETAIL_IMPLEMENTATION_SUMMARY.md
    - Create product-detail/index.ts with export
    - _Requirements: 1.6, 6.1-6.3, 7.1_

  - [x] 1.7 Move BuyerProfileNotificationScreen files
    - Move all BuyerProfileNotificationScreen.* files to profile-notification/
    - Move BUYER_PROFILE_NOTIFICATION_IMPLEMENTATION_SUMMARY.md
    - Create profile-notification/index.ts with export
    - _Requirements: 1.7, 6.1-6.3, 7.1_

  - [x] 1.8 Update buyer index.ts
    - Update src/screens/buyer/index.ts to export from new subfolders
    - Maintain same export names as before refactoring
    - _Requirements: 5.1, 5.5_

- [x] 2. Refactor Farmer Screens
  - Create subfolders and move all farmer screen files into feature-based organization
  - _Requirements: 2.1-2.8, 5.2, 6.1-6.3, 7.1-7.3, 8.1-8.3_

  - [x] 2.1 Create farmer screen subfolders
    - Create directories: contracts, dashboard, farm-profile, market-connect, process
    - _Requirements: 2.1_

  - [x] 2.2 Move FarmerContractsScreen files
    - Move all FarmerContractsScreen.* files to contracts/
    - Move FARMER_CONTRACTS_IMPLEMENTATION_SUMMARY.md
    - Move FarmerContractsScreen.test-simple.tsx to contracts/
    - Create contracts/index.ts with export
    - _Requirements: 2.2, 6.1-6.3, 7.1, 8.1-8.3_

  - [x] 2.3 Move FarmerDashboardScreen files
    - Move all FarmerDashboardScreen.* files to dashboard/
    - Create dashboard/index.ts with export
    - _Requirements: 2.3, 6.1-6.3, 7.1_

  - [x] 2.4 Move FarmerFarmProfileScreen files
    - Move all FarmerFarmProfileScreen.* files to farm-profile/
    - Move FARM_PROFILE_IMPLEMENTATION_SUMMARY.md
    - Create farm-profile/index.ts with export
    - _Requirements: 2.4, 6.1-6.3, 7.1_

  - [x] 2.5 Move FarmerMarketConnectScreen files
    - Move all FarmerMarketConnectScreen.* files to market-connect/
    - Move MARKET_CONNECT_IMPLEMENTATION_SUMMARY.md
    - Move FarmerMarketConnectScreen.test-simple.tsx to market-connect/
    - Create market-connect/index.ts with export
    - _Requirements: 2.5, 6.1-6.3, 7.1, 8.1-8.3_

  - [x] 2.6 Move FarmerProcessScreen files
    - Move all FarmerProcessScreen.* files to process/
    - Move FARMER_PROCESS_IMPLEMENTATION_SUMMARY.md
    - Create process/index.ts with export
    - _Requirements: 2.6, 6.1-6.3, 7.1_

  - [x] 2.7 Update farmer index.ts
    - Update src/screens/farmer/index.ts to export from new subfolders
    - Maintain same export names as before refactoring
    - Keep general documentation files in farmer root (DEMO_UPDATES.md, IMPLEMENTATION_SUMMARY.md, etc.)
    - _Requirements: 2.8, 5.2, 5.5_

- [x] 3. Refactor Guest Screens
  - Create subfolders and move all guest screen files into feature-based organization
  - _Requirements: 3.1-3.5, 5.3, 6.1-6.3, 7.1-7.3_

  - [x] 3.1 Create guest screen subfolders
    - Create directories: home-market-news, product-detail, traceability-scan
    - _Requirements: 3.1_

  - [x] 3.2 Move GuestHomeMarketNewsScreen files
    - Move all GuestHomeMarketNewsScreen.* files to home-market-news/
    - Move GUEST_HOME_MARKET_NEWS_IMPLEMENTATION_SUMMARY.md
    - Create home-market-news/index.ts with export
    - _Requirements: 3.2, 6.1-6.3, 7.1_

  - [x] 3.3 Move GuestProductDetailScreen files
    - Move all GuestProductDetailScreen.* files to product-detail/
    - Move GUEST_PRODUCT_DETAIL_IMPLEMENTATION_SUMMARY.md
    - Create product-detail/index.ts with export
    - _Requirements: 3.3, 6.1-6.3, 7.1_

  - [x] 3.4 Move GuestTraceabilityScanResultScreen files
    - Move all GuestTraceabilityScanResultScreen.* files to traceability-scan/
    - Move GUEST_TRACEABILITY_SCAN_IMPLEMENTATION_SUMMARY.md
    - Create traceability-scan/index.ts with export
    - _Requirements: 3.4, 6.1-6.3, 7.1_

  - [x] 3.5 Update guest index.ts
    - Update src/screens/guest/index.ts to export from new subfolders
    - Maintain same export names as before refactoring
    - _Requirements: 5.3, 5.5_

- [x] 4. Refactor Trader Screens
  - Create subfolders and move all trader screen files into feature-based organization
  - _Requirements: 4.1-4.7, 5.4, 6.1-6.3, 7.1-7.3_

  - [x] 4.1 Create trader screen subfolders
    - Create directories: dashboard, profile-news, standard-library, supply-monitor, trading-orders
    - _Requirements: 4.1_

  - [x] 4.2 Move TraderDashboardScreen files
    - Move all TraderDashboardScreen.* files to dashboard/
    - Move TRADER_DASHBOARD_IMPLEMENTATION_SUMMARY.md
    - Create dashboard/index.ts with export
    - _Requirements: 4.2, 6.1-6.3, 7.1_

  - [x] 4.3 Move TraderProfileNewsScreen files
    - Move all TraderProfileNewsScreen.* files to profile-news/
    - Move TRADER_PROFILE_NEWS_IMPLEMENTATION_SUMMARY.md
    - Create profile-news/index.ts with export
    - _Requirements: 4.3, 6.1-6.3, 7.1_

  - [x] 4.4 Move TraderStandardLibraryScreen files
    - Move all TraderStandardLibraryScreen.* files to standard-library/
    - Move TRADER_STANDARD_LIBRARY_IMPLEMENTATION_SUMMARY.md
    - Create standard-library/index.ts with export
    - _Requirements: 4.4, 6.1-6.3, 7.1_

  - [x] 4.5 Move TraderSupplyMonitorScreen files
    - Move all TraderSupplyMonitorScreen.* files to supply-monitor/
    - Move TRADER_SUPPLY_MONITOR_IMPLEMENTATION_SUMMARY.md
    - Create supply-monitor/index.ts with export
    - _Requirements: 4.5, 6.1-6.3, 7.1_

  - [x] 4.6 Move TraderTradingOrdersScreen files
    - Move all TraderTradingOrdersScreen.* files to trading-orders/
    - Move TRADER_TRADING_ORDERS_IMPLEMENTATION_SUMMARY.md
    - Create trading-orders/index.ts with export
    - _Requirements: 4.6, 6.1-6.3, 7.1_

  - [x] 4.7 Update trader index.ts
    - Update src/screens/trader/index.ts to export from new subfolders
    - Maintain same export names as before refactoring
    - _Requirements: 5.4, 5.5_

- [x] 5. Verification and Cleanup
  - Verify the refactoring is complete and the application works correctly
  - _Requirements: All_

  - [x] 5.1 Verify file structure
    - Check that all screen files are in their respective subfolders
    - Verify no screen files remain in role root directories
    - Confirm all index.ts files are created
    - _Requirements: 1.1-7.3_

  - [x] 5.2 Verify imports and exports
    - Check that all index files export correctly
    - Verify no broken imports in the codebase
    - Test that screens can be imported from their new locations
    - _Requirements: 5.1-5.5, 6.1-6.4_

  - [x] 5.3 Build verification
    - Run the build process to ensure no compilation errors
    - Verify TypeScript resolves all imports correctly
    - _Requirements: All_

  - [ ]* 5.4 Run existing tests
    - Execute the test suite to ensure no regressions
    - Verify all tests pass with the new structure
    - _Requirements: All_

## Notes

- Each user role refactoring (tasks 1-4) can be done independently
- Verification should be done after each role refactoring to catch issues early
- The task marked with `*` is optional for faster completion
- All file moves preserve original file contents
- Index files use named exports for consistency
