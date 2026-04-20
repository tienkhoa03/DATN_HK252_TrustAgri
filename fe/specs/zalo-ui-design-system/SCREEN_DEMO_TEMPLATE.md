# Template: Tạo Demo cho Screen

## Mục đích
Đảm bảo tất cả màn hình có demo tương tác và được link vào trang chủ để dễ dàng xem và test.

## Checklist cho mỗi Screen

Khi implement một screen mới, bạn phải tạo các file sau:

### 1. ✅ Component chính
**File:** `src/screens/{role}/{ScreenName}.tsx`

```typescript
/**
 * {Screen Name}
 * {Description}
 * 
 * Requirements: {X.X-X.X}
 */

import React from 'react';
// ... imports

export interface {ScreenName}Props {
  // Props definition
}

export const {ScreenName}: React.FC<{ScreenName}Props> = ({
  // Props with defaults
}) => {
  // Component implementation
  return (
    <ScreenLayout>
      {/* Screen content */}
    </ScreenLayout>
  );
};

export default {ScreenName};
```

### 2. ✅ File Demo (REQUIRED)
**File:** `src/screens/{role}/{ScreenName}.demo.tsx`

```typescript
/**
 * {Screen Name} Demo
 * Interactive demo for testing the screen
 */

import React, { useState } from 'react';
import { {ScreenName} } from './{ScreenName}';

export const {ScreenName}Demo: React.FC = () => {
  const [state, setState] = useState(/* initial state */);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Demo Controls */}
      <div style={{
        padding: '16px',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ddd',
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>
          🎮 Demo: {Screen Name}
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Control buttons */}
          <button onClick={() => {/* action */}}>
            Action 1
          </button>
          <button onClick={() => {/* action */}}>
            Action 2
          </button>
        </div>
        
        {/* Activity Log */}
        {logs.length > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            maxHeight: '120px',
            overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
              📋 Nhật ký hoạt động:
            </h3>
            {logs.map((log, index) => (
              <div key={index} style={{ fontSize: '12px', color: '#666', padding: '4px 0' }}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen Demo */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <{ScreenName}
          // Props
          onAction={(data) => {
            addLog(`Action: ${data}`);
          }}
        />
      </div>
    </div>
  );
};

export default {ScreenName}Demo;
```

### 3. ✅ File Examples
**File:** `src/screens/{role}/{ScreenName}.example.tsx`

```typescript
/**
 * {Screen Name} Examples
 * Demonstrates various usage scenarios
 */

import React from 'react';
import { {ScreenName} } from './{ScreenName}';

/**
 * Example 1: Basic Usage
 */
export const BasicExample: React.FC = () => {
  return (
    <{ScreenName}
      // Basic props
    />
  );
};

/**
 * Example 2: Advanced Usage
 */
export const AdvancedExample: React.FC = () => {
  return (
    <{ScreenName}
      // Advanced props
    />
  );
};

// Add more examples as needed

export default BasicExample;
```

### 4. ✅ File README
**File:** `src/screens/{role}/{ScreenName}.README.md`

```markdown
# {Screen Name}

## Overview
{Brief description of the screen}

## Requirements
This component implements the following requirements:
- **X.1**: {Requirement description}
- **X.2**: {Requirement description}

## Features
- Feature 1
- Feature 2

## Usage

### Basic Usage
\`\`\`tsx
import { {ScreenName} } from './screens/{role}/{ScreenName}';

function App() {
  return (
    <{ScreenName}
      // Props
    />
  );
}
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | type | default | description |

## Design Specifications

### Colors
- Color 1: #XXXXXX
- Color 2: #XXXXXX

### Typography
- Title: 18px, semibold
- Body: 16px, regular

## Accessibility
- ARIA attributes
- Keyboard navigation
- Touch targets

## Related Components
- Component 1
- Component 2
```

### 5. ✅ Export trong index.ts
**File:** `src/screens/{role}/index.ts`

```typescript
export * from './{ScreenName}';
```

### 6. ✅ Thêm vào trang chủ (REQUIRED)
**File:** `src/pages/index.tsx`

#### Bước 1: Import demo component
```typescript
// Import {Screen Name} Demo
import { {ScreenName}Demo } from "@/screens/{role}/{ScreenName}.demo";
```

#### Bước 2: Thêm vào type DemoScreen
```typescript
type DemoScreen = 'menu' | 'normal' | ... | '{screenId}';
```

#### Bước 3: Thêm button vào menu
```typescript
<Text.Title size="small" className="mb-2 mt-6">
  {Icon} {Category Name}
</Text.Title>

<Button
  fullWidth
  onClick={() => setCurrentScreen('{screenId}')}
  className="mb-2 bg-{color}-500 text-white"
>
  {Icon} {Screen Display Name}
</Button>
```

#### Bước 4: Thêm vào renderDemoScreen
```typescript
const renderDemoScreen = () => {
  switch (currentScreen) {
    // ... existing cases
    case '{screenId}':
      return <{ScreenName}Demo />;
    default:
      return null;
  }
};
```

## Ví dụ hoàn chỉnh: Farmer Control Screen

### Files đã tạo:
1. ✅ `src/screens/farmer/FarmerControlScreen.tsx`
2. ✅ `src/screens/farmer/FarmerControlScreen.demo.tsx`
3. ✅ `src/screens/farmer/FarmerControlScreen.example.tsx`
4. ✅ `src/screens/farmer/FarmerControlScreen.README.md`
5. ✅ `src/screens/farmer/index.ts` (updated)
6. ✅ `src/pages/index.tsx` (updated)

### Kết quả:
- Màn hình có thể xem tại trang chủ demo
- Click "🎛️ Điều khiển Thiết bị" để xem
- Demo có controls tương tác
- Activity log hiển thị hành động

## Quy tắc quan trọng

### ✅ PHẢI LÀM:
1. Tạo file `.demo.tsx` với interactive demo
2. Thêm link vào `src/pages/index.tsx`
3. Tạo demo controls để test các tính năng
4. Thêm activity log để theo dõi hành động
5. Sử dụng màu sắc phù hợp với vai trò:
   - Farmer: Green (#3EBB6C)
   - Trader: Blue (#0068FF)
   - Buyer: Purple
   - Guest: Orange

### ❌ KHÔNG NÊN:
1. Bỏ qua việc tạo demo file
2. Không link vào trang chủ
3. Demo không có controls
4. Không có activity log
5. Sử dụng màu sắc không nhất quán

## Testing Demo

Sau khi tạo demo, test các điểm sau:

1. ✅ Demo hiển thị đúng trong menu
2. ✅ Click vào button mở được demo
3. ✅ Demo controls hoạt động
4. ✅ Activity log cập nhật
5. ✅ Nút "Quay lại Menu" hoạt động
6. ✅ Không có lỗi console
7. ✅ Responsive trên mobile

## Checklist cuối cùng

Trước khi hoàn thành task, kiểm tra:

- [ ] Component chính đã implement đầy đủ requirements
- [ ] File `.demo.tsx` đã tạo với interactive controls
- [ ] File `.example.tsx` đã tạo với ít nhất 3 examples
- [ ] File `.README.md` đã tạo với tài liệu đầy đủ
- [ ] Export trong `index.ts`
- [ ] Import demo trong `src/pages/index.tsx`
- [ ] Thêm button vào menu
- [ ] Thêm case vào renderDemoScreen
- [ ] Test demo hoạt động đúng
- [ ] Không có lỗi TypeScript
- [ ] Không có lỗi console

## Tham khảo

Xem các screen đã implement:
- `src/screens/farmer/FarmerMonitoringScreen.*`
- `src/screens/farmer/FarmerAlertsScreen.*`
- `src/screens/farmer/FarmerControlScreen.*`

Xem trang chủ demo:
- `src/pages/index.tsx`
