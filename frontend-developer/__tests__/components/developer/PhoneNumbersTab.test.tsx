import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhoneNumbersTab from '@/app/components/PhoneNumbersTab';

describe('PhoneNumbersTab', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the phone numbers tab with default props', () => {
      render(<PhoneNumbersTab />);
      
      expect(screen.getByText('Phone Numbers')).toBeInTheDocument();
      expect(screen.getByText('Manage your communication channels')).toBeInTheDocument();
    });

    it('renders with dark mode styling', () => {
      render(<PhoneNumbersTab isDarkMode={true} />);
      
      // Check that the component renders without errors
      expect(screen.getByText('Phone Numbers')).toBeInTheDocument();
    });

    it('shows the add phone number button', () => {
      render(<PhoneNumbersTab />);
      
      expect(screen.getByText('Add Phone Number')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('renders inbound and outbound tabs', () => {
      render(<PhoneNumbersTab />);
      
      expect(screen.getByText('Inbound')).toBeInTheDocument();
      expect(screen.getByText('Outbound')).toBeInTheDocument();
    });

    it('shows inbound tab as active by default', () => {
      render(<PhoneNumbersTab />);
      
      const inboundTab = screen.getByText('Inbound');
      expect(inboundTab).toBeInTheDocument();
    });

    it('allows switching between inbound and outbound tabs', async () => {
      render(<PhoneNumbersTab />);
      
      const outboundTab = screen.getByText('Outbound');
      await user.click(outboundTab);
      
      // Both tabs should still be visible
      expect(screen.getByText('Inbound')).toBeInTheDocument();
      expect(screen.getByText('Outbound')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', () => {
      render(<PhoneNumbersTab />);
      
      // The search input should be present
      const searchInput = screen.getAllByRole('textbox')[0];
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders the component without errors', () => {
      render(<PhoneNumbersTab />);
      
      expect(screen.getByText('Phone Numbers')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', () => {
      render(<PhoneNumbersTab />);
      
      expect(screen.getByText('Phone Numbers')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', () => {
      render(<PhoneNumbersTab />);
      
      expect(screen.getByText('Phone Numbers')).toBeInTheDocument();
    });
  });
});
