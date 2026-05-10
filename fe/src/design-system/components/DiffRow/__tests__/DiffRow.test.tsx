/**
 * DiffRow unit tests — FR-F05 (plan 2026-05-10-02)
 * Verifies highlight behavior for changed vs unchanged fields
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DiffRow } from '../DiffRow';

describe('DiffRow', () => {
  describe('unchanged field', () => {
    it('should render both old and new values', () => {
      render(<DiffRow label="Sản lượng" oldValue="100 kg" newValue="100 kg" changed={false} />);
      const cells = screen.getAllByText('100 kg');
      expect(cells.length).toBe(2);
    });

    it('should not render arrow icon when unchanged', () => {
      const { container } = render(
        <DiffRow label="Giá" oldValue={50000} newValue={50000} changed={false} />,
      );
      // No arrow element when unchanged
      const arrows = container.querySelectorAll('[data-testid="diff-arrow"]');
      expect(arrows.length).toBe(0);
    });

    it('should display the field label', () => {
      render(<DiffRow label="Ngày giao" oldValue="2024-01-01" newValue="2024-01-01" changed={false} />);
      expect(screen.getByText('Ngày giao')).toBeInTheDocument();
    });
  });

  describe('changed field', () => {
    it('should render old and new values', () => {
      render(<DiffRow label="Giá" oldValue={50000} newValue={60000} changed />);
      expect(screen.getByText('50000')).toBeInTheDocument();
      expect(screen.getByText('60000')).toBeInTheDocument();
    });

    it('should render arrow icon to indicate change', () => {
      const { container } = render(
        <DiffRow label="Giá" oldValue={50000} newValue={60000} changed />,
      );
      const arrow = container.querySelector('[data-testid="diff-arrow"]');
      expect(arrow).toBeInTheDocument();
    });

    it('should visually mark the new value (has data-changed attribute)', () => {
      const { container } = render(
        <DiffRow label="Sản lượng" oldValue="100 kg" newValue="150 kg" changed />,
      );
      const changedCell = container.querySelector('[data-changed="true"]');
      expect(changedCell).toBeInTheDocument();
    });
  });

  describe('formatValue prop', () => {
    it('should format values using provided formatter', () => {
      const format = (v: string | number) => `${Number(v).toLocaleString('vi-VN')} đ`;
      render(
        <DiffRow
          label="Đơn giá"
          oldValue={50000}
          newValue={60000}
          changed
          formatValue={format}
        />,
      );
      expect(screen.getByText('50.000 đ')).toBeInTheDocument();
      expect(screen.getByText('60.000 đ')).toBeInTheDocument();
    });
  });
});
