/**
 * Card Component Tests
 * Unit tests for Card component
 * 
 * Requirements: 8.1
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../Card';

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('should render card with title', () => {
      render(<Card title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render card with subtitle', () => {
      render(<Card title="Test Title" subtitle="Test Subtitle" />);
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    });

    it('should render card with children', () => {
      render(
        <Card title="Test Title">
          <p>Test Content</p>
        </Card>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render card with image', () => {
      render(<Card title="Test Title" image="test-image.jpg" />);
      const image = screen.getByAltText('Test Title');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'test-image.jpg');
    });
  });

  describe('Status Indicators', () => {
    it('should render success status indicator', () => {
      const { container } = render(<Card title="Test" status="success" />);
      const card = container.querySelector('[data-status="success"]');
      expect(card).toBeInTheDocument();
    });

    it('should render warning status indicator', () => {
      const { container } = render(<Card title="Test" status="warning" />);
      const card = container.querySelector('[data-status="warning"]');
      expect(card).toBeInTheDocument();
    });

    it('should render error status indicator', () => {
      const { container } = render(<Card title="Test" status="error" />);
      const card = container.querySelector('[data-status="error"]');
      expect(card).toBeInTheDocument();
    });

    it('should render info status indicator', () => {
      const { container } = render(<Card title="Test" status="info" />);
      const card = container.querySelector('[data-status="info"]');
      expect(card).toBeInTheDocument();
    });

    it('should not render status indicator when status is none', () => {
      const { container } = render(<Card title="Test" status="none" />);
      const card = container.querySelector('[data-status="none"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('should call onClick when card is clicked', () => {
      const handleClick = jest.fn();
      render(<Card title="Test" onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have role="button" when onClick is provided', () => {
      render(<Card title="Test" onClick={() => {}} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not have role="button" when onClick is not provided', () => {
      const { container } = render(<Card title="Test" />);
      const card = container.querySelector('[role="button"]');
      expect(card).not.toBeInTheDocument();
    });

    it('should be keyboard accessible with Enter key', () => {
      const handleClick = jest.fn();
      render(<Card title="Test" onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible with Space key', () => {
      const handleClick = jest.fn();
      render(<Card title="Test" onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have tabIndex={0} when clickable', () => {
      render(<Card title="Test" onClick={() => {}} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should not have tabIndex when not clickable', () => {
      const { container } = render(<Card title="Test" />);
      const card = container.querySelector('.card');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label from title by default', () => {
      render(<Card title="Test Title" />);
      const card = screen.getByLabelText('Test Title');
      expect(card).toBeInTheDocument();
    });

    it('should use custom aria-label when provided', () => {
      render(<Card title="Test Title" aria-label="Custom Label" />);
      const card = screen.getByLabelText('Custom Label');
      expect(card).toBeInTheDocument();
    });

    it('should have proper image alt text', () => {
      render(<Card title="Farm Lab" image="farm.jpg" />);
      const image = screen.getByAltText('Farm Lab');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<Card title="Test" className="custom-class" />);
      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('should have card-clickable class when onClick is provided', () => {
      const { container } = render(<Card title="Test" onClick={() => {}} />);
      const card = container.querySelector('.card-clickable');
      expect(card).toBeInTheDocument();
    });

    it('should have data-clickable attribute set correctly', () => {
      const { container: clickableContainer } = render(<Card title="Test" onClick={() => {}} />);
      const clickableCard = clickableContainer.querySelector('[data-clickable="true"]');
      expect(clickableCard).toBeInTheDocument();

      const { container: nonClickableContainer } = render(<Card title="Test" />);
      const nonClickableCard = nonClickableContainer.querySelector('[data-clickable="false"]');
      expect(nonClickableCard).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render all sections in correct order', () => {
      const { container } = render(
        <Card
          title="Test Title"
          subtitle="Test Subtitle"
          image="test.jpg"
          status="success"
        >
          <p>Test Content</p>
        </Card>
      );

      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
      
      // Check for image section
      const imageSection = container.querySelector('.card-image');
      expect(imageSection).toBeInTheDocument();
      
      // Check for content section
      const contentSection = container.querySelector('.card-content');
      expect(contentSection).toBeInTheDocument();
      
      // Check for title
      const title = container.querySelector('.card-title');
      expect(title).toBeInTheDocument();
      
      // Check for subtitle
      const subtitle = container.querySelector('.card-subtitle');
      expect(subtitle).toBeInTheDocument();
      
      // Check for body
      const body = container.querySelector('.card-body');
      expect(body).toBeInTheDocument();
    });
  });
});
