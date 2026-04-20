# Design Document: Screen Folder Refactoring

## Overview

This design outlines the approach for refactoring the screen file organization from a flat structure to a feature-based folder hierarchy. The refactoring will improve code organization, maintainability, and discoverability by grouping all files related to each screen feature into dedicated subfolders.

## Architecture

### Current Structure
```
src/screens/
├── buyer/
│   ├── BuyerMarketplaceScreen.tsx
│   ├── BuyerMarketplaceScreen.demo.tsx
│   ├── BuyerMarketplaceScreen.example.tsx
│   ├── BuyerMarketplaceScreen.README.md
│   ├── BUYER_MARKETPLACE_IMPLEMENTATION_SUMMARY.md
│   ├── [other screen files...]
│   └── index.ts
├── farmer/
├── guest/
└── trader/
```

### Target Structure
```
src/screens/
├── buyer/
│   ├── marketplace/
│   │   ├── BuyerMarketplaceScreen.tsx
│   │   ├── BuyerMarketplaceScreen.demo.tsx
│   │   ├── BuyerMarketplaceScreen.example.tsx
│   │   ├── BuyerMarketplaceScreen.README.md
│   │   ├── BUYER_MARKETPLACE_IMPLEMENTATION_SUMMARY.md
│   │   └── index.ts
│   ├── digital-twin-monitor/
│   ├── orders-proposals/
│   ├── post-buying-request/
│   ├── product-detail/
│   ├── profile-notification/
│   └── index.ts
├── farmer/
│   ├── contracts/
│   ├── dashboard/
│   ├── farm-profile/
│   ├── market-connect/
│   ├── process/
│   └── index.ts
├── guest/
│   ├── home-market-news/
│   ├── product-detail/
│   ├── traceability-scan/
│   └── index.ts
└── trader/
    ├── dashboard/
    ├── profile-news/
    ├── standard-library/
    ├── supply-monitor/
    ├── trading-orders/
    └── index.ts
```

## Components and Interfaces

### File Organization Mapping

#### Buyer Screens
- **digital-twin-monitor/**: BuyerDigitalTwinMonitorScreen.*
- **marketplace/**: BuyerMarketplaceScreen.*
- **orders-proposals/**: BuyerOrdersProposalsScreen.*
- **post-buying-request/**: BuyerPostBuyingRequestScreen.*
- **product-detail/**: BuyerProductDetailScreen.*
- **profile-notification/**: BuyerProfileNotificationScreen.*

#### Farmer Screens
- **contracts/**: FarmerContractsScreen.*
- **dashboard/**: FarmerDashboardScreen.*
- **farm-profile/**: FarmerFarmProfileScreen.*
- **market-connect/**: FarmerMarketConnectScreen.*
- **process/**: FarmerProcessScreen.*

#### Guest Screens
- **home-market-news/**: GuestHomeMarketNewsScreen.*
- **product-detail/**: GuestProductDetailScreen.*
- **traceability-scan/**: GuestTraceabilityScanResultScreen.*

#### Trader Screens
- **dashboard/**: TraderDashboardScreen.*
- **profile-news/**: TraderProfileNewsScreen.*
- **standard-library/**: TraderStandardLibraryScreen.*
- **supply-monitor/**: TraderSupplyMonitorScreen.*
- **trading-orders/**: TraderTradingOrdersScreen.*

### Index File Structure

#### Feature-Level Index (e.g., src/screens/buyer/marketplace/index.ts)
```typescript
export { BuyerMarketplaceScreen } from './BuyerMarketplaceScreen';
```

#### Role-Level Index (e.g., src/screens/buyer/index.ts)
```typescript
export { BuyerDigitalTwinMonitorScreen } from './digital-twin-monitor';
export { BuyerMarketplaceScreen } from './marketplace';
export { BuyerOrdersProposalsScreen } from './orders-proposals';
export { BuyerPostBuyingRequestScreen } from './post-buying-request';
export { BuyerProductDetailScreen } from './product-detail';
export { BuyerProfileNotificationScreen } from './profile-notification';
```

## Data Models

### File Move Operation
```typescript
interface FileMoveOperation {
  sourcePath: string;      // Original file path
  targetPath: string;      // New file path in subfolder
  fileType: 'component' | 'demo' | 'example' | 'readme' | 'summary' | 'test';
}

interface ScreenRefactoring {
  screenName: string;      // e.g., "BuyerMarketplaceScreen"
  folderName: string;      // e.g., "marketplace"
  rolePath: string;        // e.g., "src/screens/buyer"
  files: FileMoveOperation[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Preservation
*For any* file moved during refactoring, the file content SHALL remain identical before and after the move operation.
**Validates: Requirements 1.8, 2.7, 3.5, 4.7**

### Property 2: Complete File Migration
*For any* screen component, all related files (demo, example, README, implementation summary, tests) SHALL be moved to the same feature subfolder.
**Validates: Requirements 1.1-1.7, 2.1-2.6, 3.1-3.4, 4.1-4.6**

### Property 3: Export Consistency
*For any* screen component, the export name in the updated index files SHALL match the export name before refactoring.
**Validates: Requirements 5.5**

### Property 4: Naming Convention Preservation
*For any* file moved during refactoring, the filename SHALL remain unchanged from its original name.
**Validates: Requirements 7.1**

### Property 5: Subfolder Naming Convention
*For any* created subfolder, the folder name SHALL use kebab-case format.
**Validates: Requirements 7.2**

### Property 6: Index File Creation
*For any* feature subfolder created, an index.ts file SHALL exist that exports the main screen component.
**Validates: Requirements 6.1, 6.2**

## Error Handling

### File System Errors
- **Missing Source File**: If a file to be moved doesn't exist, log a warning and continue with other files
- **Target Directory Creation Failure**: If subfolder creation fails, abort the operation for that screen and report the error
- **File Move Failure**: If a file move operation fails, attempt to rollback any partial moves for that screen

### Import Resolution Errors
- **Broken Imports**: After refactoring, verify that all imports resolve correctly
- **Missing Exports**: Ensure all index files properly export their components

## Testing Strategy

### Unit Tests
- Test file path transformation logic (screen name → folder name conversion)
- Test index file generation for various screen configurations
- Test kebab-case conversion for folder names
- Test file pattern matching (identifying related files for each screen)

### Property-Based Tests
- **Property 1**: Generate random file contents, perform move operation, verify content unchanged
- **Property 2**: Generate random screen configurations, verify all related files moved together
- **Property 3**: Generate random export configurations, verify export names preserved
- **Property 4**: Generate random filenames, verify names unchanged after move
- **Property 5**: Generate random screen names, verify subfolder names use kebab-case
- **Property 6**: Generate random feature subfolders, verify index.ts exists and exports correctly

### Integration Tests
- Test complete refactoring workflow for a single user role
- Verify imports work correctly after refactoring
- Test that the application builds successfully after refactoring
- Verify no broken imports or missing files

### Manual Verification
- Build the application after refactoring
- Run existing tests to ensure no regressions
- Verify file structure matches the target architecture
- Check that all screen components are accessible through their index files

## Implementation Notes

### Refactoring Approach
1. Create target subfolder structure
2. Move files to new locations
3. Create feature-level index files
4. Update role-level index files
5. Verify no broken imports
6. Clean up empty directories

### File Pattern Matching
Files related to a screen follow these patterns:
- Main component: `{ScreenName}.tsx`
- Demo file: `{ScreenName}.demo.tsx` or `{ScreenName}.demo-simple.tsx`
- Example file: `{ScreenName}.example.tsx`
- README: `{ScreenName}.README.md`
- Implementation summary: `{SCREEN_NAME}_IMPLEMENTATION_SUMMARY.md`
- Test files: `{ScreenName}.test.tsx`, `{ScreenName}.test-simple.tsx`

### Special Cases
- **Farmer folder**: Keep general documentation files (DEMO_UPDATES.md, IMPLEMENTATION_SUMMARY.md, SCREEN_LAYOUT_GUIDE.md, etc.) in the root farmer directory
- **Test directories**: If a `__tests__` directory exists, preserve it within the feature folder
- **Shared files**: Files not matching any screen pattern remain in the role root directory

### Folder Name Derivation
Screen name → Folder name conversion:
- Remove role prefix (Buyer, Farmer, Guest, Trader)
- Remove "Screen" suffix
- Convert PascalCase to kebab-case
- Examples:
  - BuyerMarketplaceScreen → marketplace
  - FarmerMarketConnectScreen → market-connect
  - GuestTraceabilityScanResultScreen → traceability-scan
  - TraderStandardLibraryScreen → standard-library
