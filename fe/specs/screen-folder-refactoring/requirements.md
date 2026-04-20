# Requirements Document

## Introduction

This specification defines the requirements for refactoring the screen file organization structure. Currently, all screen files for each user role (buyer, farmer, guest, trader) are stored in flat directories. The goal is to reorganize these files into feature-based subfolders where each screen and its related files are grouped together.

## Glossary

- **Screen**: A React component representing a full page/view in the application (e.g., BuyerMarketplaceScreen)
- **Feature Folder**: A subdirectory containing all files related to a specific screen feature
- **Related Files**: Files associated with a screen including the main component (.tsx), demo files (.demo.tsx), example files (.example.tsx), README files, implementation summaries, and test files
- **User Role Folder**: Top-level directories for each user type (buyer, farmer, guest, trader)
- **Index File**: The index.ts file that exports all screens from a user role folder
- **Import Path**: The file path used in import statements throughout the codebase

## Requirements

### Requirement 1: Organize Buyer Screens

**User Story:** As a developer, I want buyer screen files organized into feature-based subfolders, so that related files are grouped together and easier to maintain.

#### Acceptance Criteria

1. THE System SHALL create a subfolder for each buyer screen feature within src/screens/buyer/
2. THE System SHALL move all files related to BuyerDigitalTwinMonitorScreen into src/screens/buyer/digital-twin-monitor/
3. THE System SHALL move all files related to BuyerMarketplaceScreen into src/screens/buyer/marketplace/
4. THE System SHALL move all files related to BuyerOrdersProposalsScreen into src/screens/buyer/orders-proposals/
5. THE System SHALL move all files related to BuyerPostBuyingRequestScreen into src/screens/buyer/post-buying-request/
6. THE System SHALL move all files related to BuyerProductDetailScreen into src/screens/buyer/product-detail/
7. THE System SHALL move all files related to BuyerProfileNotificationScreen into src/screens/buyer/profile-notification/
8. WHEN files are moved, THE System SHALL preserve all file contents without modification

### Requirement 2: Organize Farmer Screens

**User Story:** As a developer, I want farmer screen files organized into feature-based subfolders, so that related files are grouped together and easier to maintain.

#### Acceptance Criteria

1. THE System SHALL create a subfolder for each farmer screen feature within src/screens/farmer/
2. THE System SHALL move all files related to FarmerContractsScreen into src/screens/farmer/contracts/
3. THE System SHALL move all files related to FarmerDashboardScreen into src/screens/farmer/dashboard/
4. THE System SHALL move all files related to FarmerFarmProfileScreen into src/screens/farmer/farm-profile/
5. THE System SHALL move all files related to FarmerMarketConnectScreen into src/screens/farmer/market-connect/
6. THE System SHALL move all files related to FarmerProcessScreen into src/screens/farmer/process/
7. WHEN files are moved, THE System SHALL preserve all file contents without modification
8. THE System SHALL keep general documentation files (DEMO_UPDATES.md, IMPLEMENTATION_SUMMARY.md, etc.) in the farmer root directory

### Requirement 3: Organize Guest Screens

**User Story:** As a developer, I want guest screen files organized into feature-based subfolders, so that related files are grouped together and easier to maintain.

#### Acceptance Criteria

1. THE System SHALL create a subfolder for each guest screen feature within src/screens/guest/
2. THE System SHALL move all files related to GuestHomeMarketNewsScreen into src/screens/guest/home-market-news/
3. THE System SHALL move all files related to GuestProductDetailScreen into src/screens/guest/product-detail/
4. THE System SHALL move all files related to GuestTraceabilityScanResultScreen into src/screens/guest/traceability-scan/
5. WHEN files are moved, THE System SHALL preserve all file contents without modification

### Requirement 4: Organize Trader Screens

**User Story:** As a developer, I want trader screen files organized into feature-based subfolders, so that related files are grouped together and easier to maintain.

#### Acceptance Criteria

1. THE System SHALL create a subfolder for each trader screen feature within src/screens/trader/
2. THE System SHALL move all files related to TraderDashboardScreen into src/screens/trader/dashboard/
3. THE System SHALL move all files related to TraderProfileNewsScreen into src/screens/trader/profile-news/
4. THE System SHALL move all files related to TraderStandardLibraryScreen into src/screens/trader/standard-library/
5. THE System SHALL move all files related to TraderSupplyMonitorScreen into src/screens/trader/supply-monitor/
6. THE System SHALL move all files related to TraderTradingOrdersScreen into src/screens/trader/trading-orders/
7. WHEN files are moved, THE System SHALL preserve all file contents without modification

### Requirement 5: Update Index Files

**User Story:** As a developer, I want index files updated to reflect the new folder structure, so that imports continue to work correctly.

#### Acceptance Criteria

1. THE System SHALL update src/screens/buyer/index.ts to export from the new subfolder structure
2. THE System SHALL update src/screens/farmer/index.ts to export from the new subfolder structure
3. THE System SHALL update src/screens/guest/index.ts to export from the new subfolder structure
4. THE System SHALL update src/screens/trader/index.ts to export from the new subfolder structure
5. WHEN updating index files, THE System SHALL maintain the same export names as before the refactoring

### Requirement 6: Create Feature Index Files

**User Story:** As a developer, I want each feature subfolder to have its own index file, so that exports are properly managed at the feature level.

#### Acceptance Criteria

1. THE System SHALL create an index.ts file in each new feature subfolder
2. WHEN creating feature index files, THE System SHALL export the main screen component
3. THE System SHALL use named exports for screen components
4. THE System SHALL follow the pattern: export { ScreenName } from './ScreenName'

### Requirement 7: Maintain File Naming Conventions

**User Story:** As a developer, I want file naming conventions preserved during the refactoring, so that file identification remains consistent.

#### Acceptance Criteria

1. THE System SHALL preserve original filenames when moving files to subfolders
2. THE System SHALL use kebab-case for subfolder names (e.g., digital-twin-monitor, market-connect)
3. THE System SHALL maintain PascalCase for component filenames (e.g., BuyerMarketplaceScreen.tsx)
4. THE System SHALL preserve file extensions (.tsx, .md, .ts) without modification

### Requirement 8: Preserve Test Files

**User Story:** As a developer, I want test files moved with their associated screens, so that tests remain co-located with the code they test.

#### Acceptance Criteria

1. WHEN a screen has associated test files, THE System SHALL move them to the same feature subfolder
2. THE System SHALL preserve the __tests__ subdirectory structure if it exists
3. THE System SHALL move test files with naming patterns like *.test.tsx and *.test-simple.tsx to the appropriate feature folder
