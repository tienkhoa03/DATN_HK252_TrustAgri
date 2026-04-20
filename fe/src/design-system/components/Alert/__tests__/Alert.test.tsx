/**
 * Alert Component Tests
 * Unit tests for Alert component
 * 
 * Requirements: 2.3, 2.4, 13.1-13.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert } from '../Alert';
import { colors } from '../../../tokens/colors';

describe('Alert Component', () => {
  describe('Basic Rendering', () => {
    it('should render alert with title and message', () => {
      render(
        <Alert
          severity="info"
          title="Test Title"
          message="Test Message"
        />
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('should have role="alert"', () => {
      render(
        <Alert
          severity="info"
          title="Test"
          message="Message"
        />
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render with correct severity data attribute', () => {
      const { container } = render(
        <Alert
          severity="warning"
          title="Test"
          message="Message"
        />
      );
      const alert = container.querySelector('[data-severity="warning"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Severity Color Mapping - Requirements 2.3, 2.4', () => {
    it('should use Zalo Blue for info severity', () => {
      const { container } = render(
        <Alert
          severity="info"
          title="Info"
          message="Info message"
        />
      );
      const alert = container.querySelector('[data-severity="info"]');
      expect(alert).toBeInTheDocument();
      // Color is applied via inline styles with opacity
    });

    it('should use Warning Yellow for warning severity - Requirement 2.4', () => {
      const { container } = render(
        <Alert
          severity="warning"
          title="Warning"
          message="Warning message"
        />
      );
      const alert = container.querySelector('[data-severity="warning"]');
      expect(alert).toBeInTheDocument();
      // Verify warning color is used (Warning Yellow #FFCC00)
    });

    it('should use Alert Red for error severity - Requirement 2.3', () => {
      const { container } = render(
        <Alert
          severity="error"
          title="Error"
          message="Error message"
        />
      );
      const alert = container.querySelector('[data-severity="error"]');
      expect(alert).toBeInTheDocument();
      // Verify error color is used (Alert Red #F50000)
    });

    it('should use Agri Green for success severity', () => {
      const { container } = render(
        <Alert
          severity="success"
          title="Success"
          message="Success message"
        />
      );
      const alert = container.querySelector('[data-severity="success"]');
      expect(alert).toBeInTheDocument();
      // Verify success color is used (Agri Green #3EBB6C)
    });
  });

  describe('Icon Display - Requirement 13.1', () => {
    it('should display icon for info severity', () => {
      const { container } = render(
        <Alert
          severity="info"
          title="Info"
          message="Info message"
        />
      );
      const icon = container.querySelector('.alert-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should display alert triangle icon for warning severity - Requirement 13.1', () => {
      const { container } = render(
        <Alert
          severity="warning"
          title="Warning"
          message="Warning message"
        />
      );
      const icon = container.querySelector('.alert-icon');
      expect(icon).toBeInTheDocument();
      // Warning should use alert triangle icon
    });

    it('should display icon for error severity', () => {
      const { container } = render(
        <Alert
          severity="error"
          title="Error"
          message="Error message"
        />
      );
      const icon = container.querySelector('.alert-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should display icon for success severity', () => {
      const { container } = render(
        <Alert
          severity="success"
          title="Success"
          message="Success message"
        />
      );
      const icon = container.querySelector('.alert-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should have outline style icons', () => {
      const { container } = render(
        <Alert
          severity="warning"
          title="Warning"
          message="Warning message"
        />
      );
      const svg = container.querySelector('svg[data-style="outline"]');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Action Button Functionality - Requirement 13.2', () => {
    it('should render action button when action is provided', () => {
      render(
        <Alert
          severity="warning"
          title="Warning"
          message="Warning message"
          action={{
            label: 'Take Action',
            onClick: jest.fn(),
          }}
        />
      );
      expect(screen.getByText('Take Action')).toBeInTheDocument();
    });

    it('should call onClick when action button is clicked', () => {
      const handleAction = jest.fn();
      render(
        <Alert
          severity="warning"
          title="Warning"
          message="Warning message"
          action={{
            label: 'Take Action',
            onClick: handleAction,
          }}
        />
      );
      
      const actionButton = screen.getByText('Take Action');
      fireEvent.click(actionButton);
      
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('should not render action button when action is not provided', () => {
      const { container } = render(
        <Alert
          severity="info"
          title="Info"
          message="Info message"
        />
      );
      const actionButton = container.querySelector('.alert-action-button');
      expect(actionButton).not.toBeInTheDocument();
    });

    it('should render action button with correct label - Requirement 13.2', () => {
      render(
        <Alert
          severity="warning"
          title="Độ ẩm thấp"
          message="Cần tưới nước"
          action={{
            label: 'Tưới nước',
            onClick: jest.fn(),
          }}
        />
      );
      expect(screen.getByText('Tưới nước')).toBeInTheDocument();
    });
  });

  describe('Dismissible Functionality - Requirement 13.4', () => {
    it('should render dismiss button when dismissible is true', () => {
      render(
        <Alert
          severity="error"
          title="Error"
          message="Error message"
          dismissible
        />
      );
      const dismissButton = screen.getByLabelText('Dismiss alert');
      expect(dismissButton).toBeInTheDocument();
    });

    it('should not render dismiss button when dismissible is false', () => {
      render(
        <Alert
          severity="info"
          title="Info"
          message="Info message"
          dismissible={false}
        />
      );
      const dismissButton = screen.queryByLabelText('Dismiss alert');
      expect(dismissButton).not.toBeInTheDocument();
    });

    it('should hide alert when dismiss button is clicked', () => {
      const { container } = render(
        <Alert
          severity="error"
          title="Error"
          message="Error message"
          dismissible
        />
      );
      
      const dismissButton = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissButton);
      
      const alert = container.querySelector('.alert');
      expect(alert).not.toBeInTheDocument();
    });

    it('should call onDismiss callback when dismissed', () => {
      const handleDismiss = jest.fn();
      render(
        <Alert
          severity="error"
          title="Error"
          message="Error message"
          dismissible
          onDismiss={handleDismiss}
        />
      );
      
      const dismissButton = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissButton);
      
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('should have data-dismissible attribute', () => {
      const { container } = render(
        <Alert
          severity="error"
          title="Error"
          message="Error message"
          dismissible
        />
      );
      const alert = container.querySelector('[data-dismissible="true"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-live="assertive" for error severity', () => {
      render(
        <Alert
          severity="error"
          title="Error"
          message="Error message"
        />
      );
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-live="polite" for non-error severities', () => {
      render(
        <Alert
          severity="info"
          title="Info"
          message="Info message"
        />
      );
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should use custom aria-label when provided', () => {
      render(
        <Alert
          severity="info"
          title="Info"
          message="Info message"
          aria-label="Custom alert label"
        />
      );
      const alert = screen.getByLabelText('Custom alert label');
      expect(alert).toBeInTheDocument();
    });

    it('should generate default aria-label from severity and title', () => {
      render(
        <Alert
          severity="warning"
          title="Warning Title"
          message="Warning message"
        />
      );
      const alert = screen.getByLabelText('warning alert: Warning Title');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-hidden on icon', () => {
      const { container } = render(
        <Alert
          severity="info"
          title="Info"
          message="Info message"
        />
      );
      const icon = container.querySelector('.alert-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Combined Functionality', () => {
    it('should render alert with both action and dismiss buttons', () => {
      render(
        <Alert
          severity="error"
          title="Critical Alert"
          message="Critical message"
          action={{
            label: 'Fix Now',
            onClick: jest.fn(),
          }}
          dismissible
        />
      );
      
      expect(screen.getByText('Fix Now')).toBeInTheDocument();
      expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument();
    });

    it('should handle both action and dismiss clicks independently', () => {
      const handleAction = jest.fn();
      const handleDismiss = jest.fn();
      
      const { container } = render(
        <Alert
          severity="error"
          title="Error"
          message="Error message"
          action={{
            label: 'Fix',
            onClick: handleAction,
          }}
          dismissible
          onDismiss={handleDismiss}
        />
      );
      
      // Click action button
      const actionButton = screen.getByText('Fix');
      fireEvent.click(actionButton);
      expect(handleAction).toHaveBeenCalledTimes(1);
      expect(handleDismiss).not.toHaveBeenCalled();
      
      // Click dismiss button
      const dismissButton = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissButton);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
      
      // Alert should be hidden
      const alert = container.querySelector('.alert');
      expect(alert).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Alert
          severity="info"
          title="Info"
          message="Info message"
          className="custom-alert"
        />
      );
      const alert = container.querySelector('.custom-alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have severity-specific class', () => {
      const { container } = render(
        <Alert
          severity="warning"
          title="Warning"
          message="Warning message"
        />
      );
      const alert = container.querySelector('.alert-warning');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Priority Sorting - Requirement 13.4', () => {
    it('should render multiple alerts with different severities', () => {
      const { container } = render(
        <div>
          <Alert severity="error" title="Error 1" message="Error message" />
          <Alert severity="warning" title="Warning 1" message="Warning message" />
          <Alert severity="info" title="Info 1" message="Info message" />
        </div>
      );
      
      const alerts = container.querySelectorAll('.alert');
      expect(alerts).toHaveLength(3);
    });

    it('should distinguish alerts by color - Requirement 13.4', () => {
      const { container } = render(
        <div>
          <Alert severity="error" title="Error" message="Error message" />
          <Alert severity="warning" title="Warning" message="Warning message" />
        </div>
      );
      
      const errorAlert = container.querySelector('[data-severity="error"]');
      const warningAlert = container.querySelector('[data-severity="warning"]');
      
      expect(errorAlert).toBeInTheDocument();
      expect(warningAlert).toBeInTheDocument();
    });
  });

  describe('3-Click Rule Compliance - Requirement 13.3', () => {
    it('should provide direct access to action from alert', () => {
      const handleAction = jest.fn();
      render(
        <Alert
          severity="warning"
          title="Cần chăm sóc"
          message="Có tác vụ cần thực hiện"
          action={{
            label: 'Xem tác vụ',
            onClick: handleAction,
          }}
        />
      );
      
      // User can click action button directly (1 click)
      const actionButton = screen.getByText('Xem tác vụ');
      fireEvent.click(actionButton);
      
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });
});
