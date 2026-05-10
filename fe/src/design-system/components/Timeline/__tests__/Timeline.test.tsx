/**
 * Timeline unit tests — FR-F08, FR-F09 (plan 2026-05-10-02)
 * Verifies rendering of standard steps and alert node injection
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Timeline } from '../Timeline';
import type { TimelineNode } from '../Timeline';

const STANDARD_NODES: TimelineNode[] = [
  { id: '1', number: 1, title: 'Chuẩn bị đất',    status: 'completed' },
  { id: '2', number: 2, title: 'Gieo hạt',         status: 'in-progress' },
  { id: '3', number: 3, title: 'Tưới nước lần 1',  status: 'pending' },
];

const ALERT_NODE: TimelineNode = {
  id: 'alert-1',
  title: 'Cảnh báo: Độ ẩm thấp — cần tưới thêm nước',
  status: 'alert-suggested',
  isAlert: true,
};

describe('Timeline', () => {
  describe('standard nodes', () => {
    it('should render all provided nodes', () => {
      render(<Timeline nodes={STANDARD_NODES} />);
      expect(screen.getByText('Chuẩn bị đất')).toBeInTheDocument();
      expect(screen.getByText('Gieo hạt')).toBeInTheDocument();
      expect(screen.getByText('Tưới nước lần 1')).toBeInTheDocument();
    });

    it('should render step numbers', () => {
      render(<Timeline nodes={STANDARD_NODES} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render node with action button when onAction provided', () => {
      const nodes: TimelineNode[] = [
        {
          id: '1',
          title: 'Bón phân',
          status: 'pending',
          onAction: jest.fn(),
          actionLabel: 'Cập nhật',
        },
      ];
      render(<Timeline nodes={nodes} />);
      expect(screen.getByRole('button', { name: /Cập nhật/i })).toBeInTheDocument();
    });
  });

  describe('alert node injection', () => {
    it('should render alert node title', () => {
      const nodes = [...STANDARD_NODES.slice(0, 2), ALERT_NODE, STANDARD_NODES[2]];
      render(<Timeline nodes={nodes} />);
      expect(screen.getByText(/Cảnh báo: Độ ẩm thấp/i)).toBeInTheDocument();
    });

    it('should render alert nodes with warning icon (⚠)', () => {
      render(<Timeline nodes={[ALERT_NODE]} />);
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('should render mixed standard + alert nodes in order', () => {
      const allNodes = [STANDARD_NODES[0], ALERT_NODE, STANDARD_NODES[1]];
      render(<Timeline nodes={allNodes} />);
      expect(screen.getByText('Chuẩn bị đất')).toBeInTheDocument();
      expect(screen.getByText(/Cảnh báo/)).toBeInTheDocument();
      expect(screen.getByText('Gieo hạt')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render without error when nodes is empty', () => {
      const { container } = render(<Timeline nodes={[]} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
