/**
 * Spacing Design Tokens
 * Hệ thống spacing cho Zalo Mini App Nông nghiệp
 * 
 * Requirements: 8.1
 */

export interface SpacingToken {
  name: string;
  value: string;
  usage: string;
}

// Spacing scale
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

// Spacing tokens with metadata
export const spacingTokens: SpacingToken[] = [
  {
    name: 'xs',
    value: '4px',
    usage: 'Khoảng cách rất nhỏ giữa các phần tử liên quan',
  },
  {
    name: 'sm',
    value: '8px',
    usage: 'Khoảng cách nhỏ trong component',
  },
  {
    name: 'md',
    value: '16px',
    usage: 'Khoảng cách tiêu chuẩn giữa các component',
  },
  {
    name: 'lg',
    value: '24px',
    usage: 'Khoảng cách lớn giữa các section',
  },
  {
    name: 'xl',
    value: '32px',
    usage: 'Khoảng cách rất lớn giữa các nhóm nội dung',
  },
  {
    name: 'xxl',
    value: '48px',
    usage: 'Khoảng cách tối đa cho layout chính',
  },
];

export default spacing;
