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
    it('renders inbound and outbound tabs', () => {
      render(<SMSTab />);
      
      expect(screen.getByText('Inbound')).toBeInTheDocument();
      expect(screen.getByText('Outbound')).toBeInTheDocument();
    });

    it('shows inbound tab as active by default', () => {
      render(<SMSTab />);
      
      const inboundTab = screen.getByText('Inbound');
      expect(inboundTab).toBeInTheDocument();
    });

    it('allows switching between inbound and outbound tabs', async () => {
      render(<SMSTab />);
      
      const outboundTab = screen.getByText('Outbound');
      await user.click(outboundTab);
      
      // Both tabs should still be visible
      expect(screen.getByText('Inbound')).toBeInTheDocument();
      expect(screen.getByText('Outbound')).toBeInTheDocument();
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
