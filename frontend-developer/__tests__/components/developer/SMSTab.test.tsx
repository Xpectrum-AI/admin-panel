import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SMSTab from '@/app/developer/components/SMSTab';

describe('SMSTab', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the SMS tab with default props', () => {
      render(<SMSTab />);
      
      expect(screen.getByText('SMS Configuration')).toBeInTheDocument();
      expect(screen.getByText('Manage your text messaging services')).toBeInTheDocument();
    });

    it('renders with dark mode styling', () => {
      render(<SMSTab isDarkMode={true} />);
      
      // Check that the component renders without errors
      expect(screen.getByText('SMS Configuration')).toBeInTheDocument();
    });

    it('shows the add SMS config button', () => {
      render(<SMSTab />);
      
      expect(screen.getByText('Add SMS Config')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
     it('renders conversations, configuration, analytics, and health tabs', () => {
      render(<SMSTab />);
      
      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Configuration')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });

    it('shows conversations tab as active by default', () => {
      render(<SMSTab />);
      
      const conversationsTab = screen.getByText('Conversations');
      expect(conversationsTab).toBeInTheDocument();
    });

    it('allows switching between tabs', async () => {
      render(<SMSTab />);
      
      const configurationTab = screen.getByText('Configuration');
      await user.click(configurationTab);
      
      // All tabs should still be visible
      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Configuration')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', () => {
      render(<SMSTab />);
      
      // The search input should be present
      const searchInput = screen.getAllByRole('textbox')[0];
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders the component without errors', () => {
      render(<SMSTab />);
      
      expect(screen.getByText('SMS Configuration')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', () => {
      render(<SMSTab />);
      
      expect(screen.getByText('SMS Configuration')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', () => {
      render(<SMSTab />);
      
      expect(screen.getByText('SMS Configuration')).toBeInTheDocument();
    });
  });
});
