/**
 * Card Component Integration Test
 * Verifies Card component integrates correctly with design system
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../Card';
import { colors } from '../../../tokens/colors';
import { spacing } from '../../../tokens/spacing';
import { fontSize } from '../../../tokens/typography';

describe('Card Component Integration', () => {
  it('should use design system color tokens', () => {
    const { container } = render(<Card title="Test" status="success" />);
    const card = container.querySelector('.card');
    
    // Card should use background color from design tokens
    expect(card).toHaveStyle({
      backgroundColor: colors.background.primary,
    });
  });

  it('should use design system spacing tokens', () => {
    const { container } = render(<Card title="Test" />);
    const content = container.querySelector('.card-content');
    
    // Content should use spacing tokens
    expect(content).toHaveStyle({
      padding: spacing.md,
    });
  });

  it('should use design system typography tokens', () => {
    const { container } = render(<Card title="Test Title" />);
    const title = container.querySelector('.card-title');
    
    // Title should use typography tokens
    expect(title).toHaveStyle({
      fontSize: fontSize.h2,
    });
  });

  it('should maintain consistency with Button component shadow', () => {
    const { container } = render(<Card title="Test" />);
    const card = container.querySelector('.card');
    
    // Card should use consistent shadow with other components
    expect(card).toHaveStyle({
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    });
  });

  it('should use 8px border radius standard', () => {
    const { container } = render(<Card title="Test" />);
    const card = container.querySelector('.card');
    
    expect(card).toHaveStyle({
      borderRadius: '8px',
    });
  });
});
