/**
 * HomeBanner unit tests — FR-F07, FR-F08 (plan 2026-05-10-02)
 * Verifies 3 banner states: iot-alert, contract-pending, all-good
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HomeBanner } from '../HomeBanner';

describe('HomeBanner', () => {
  const noop = jest.fn();

  describe('iot-alert state', () => {
    it('should display alert count in banner text', () => {
      render(<HomeBanner kind="iot-alert" alertCount={3} onCta={noop} />);
      expect(screen.getByText(/3 cảnh báo IoT/i)).toBeInTheDocument();
    });

    it('should show "Xem cách xử lý" CTA button', () => {
      render(<HomeBanner kind="iot-alert" alertCount={1} onCta={noop} />);
      expect(screen.getByRole('button', { name: /Xem cách xử lý/i })).toBeInTheDocument();
    });

    it('should call onCta when CTA button is clicked', () => {
      const handleCta = jest.fn();
      render(<HomeBanner kind="iot-alert" alertCount={2} onCta={handleCta} />);
      fireEvent.click(screen.getByRole('button', { name: /Xem cách xử lý/i }));
      expect(handleCta).toHaveBeenCalledTimes(1);
    });

    it('CTA button should have min-height 44px (NFR-U01)', () => {
      render(<HomeBanner kind="iot-alert" alertCount={1} onCta={noop} />);
      const btn = screen.getByRole('button', { name: /Xem cách xử lý/i });
      const style = btn.getAttribute('style') ?? '';
      expect(style).toContain('44');
    });
  });

  describe('contract-pending state', () => {
    it('should display pending count in banner text', () => {
      render(<HomeBanner kind="contract-pending" pendingCount={2} onCta={noop} />);
      expect(screen.getByText(/2 yêu cầu hợp tác/i)).toBeInTheDocument();
    });

    it('should show "Xem ngay" CTA button', () => {
      render(<HomeBanner kind="contract-pending" pendingCount={1} onCta={noop} />);
      expect(screen.getByRole('button', { name: /Xem ngay/i })).toBeInTheDocument();
    });
  });

  describe('all-good state', () => {
    it('should display compliance percentage in banner', () => {
      render(<HomeBanner kind="all-good" complianceScore={87} onCta={noop} />);
      expect(screen.getByText(/87%/)).toBeInTheDocument();
    });

    it('should show "Xem chi tiết" CTA button', () => {
      render(<HomeBanner kind="all-good" complianceScore={100} onCta={noop} />);
      expect(screen.getByRole('button', { name: /Xem chi tiết/i })).toBeInTheDocument();
    });

    it('should show positive sentiment text', () => {
      render(<HomeBanner kind="all-good" complianceScore={90} onCta={noop} />);
      expect(screen.getByText(/Mọi thứ ổn định/i)).toBeInTheDocument();
    });
  });
});
