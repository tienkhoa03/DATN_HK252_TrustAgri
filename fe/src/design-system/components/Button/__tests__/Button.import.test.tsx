/**
 * Button Component Import Test
 * Verifies the component can be imported and instantiated
 */

import React from 'react';
import { Button } from '../Button';
import type { ButtonProps, ButtonVariant, ButtonSize } from '../Button';

describe('Button Component Import', () => {
  test('should import Button component', () => {
    expect(Button).toBeDefined();
  });

  test('should import ButtonProps type', () => {
    const props: ButtonProps = {
      children: 'Test',
      variant: 'primary',
      size: 'medium',
    };
    expect(props).toBeDefined();
  });

  test('should import ButtonVariant type', () => {
    const variant: ButtonVariant = 'primary';
    expect(variant).toBeDefined();
  });

  test('should import ButtonSize type', () => {
    const size: ButtonSize = 'medium';
    expect(size).toBeDefined();
  });

  test('should create Button element without errors', () => {
    const element = React.createElement(Button, { children: 'Test' });
    expect(element).toBeDefined();
    expect(element.type).toBe(Button);
  });
});
