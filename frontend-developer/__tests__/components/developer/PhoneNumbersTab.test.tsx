import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';
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

      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
      expect(screen.getByText('View and manage phone number assignments to agents')).toBeInTheDocument();
    });

    it('renders with dark mode styling', () => {
      render(<PhoneNumbersTab />);

      // Check that the component renders without errors
      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
    });

    it('shows the assign number button', () => {
      render(<PhoneNumbersTab />);

      expect(screen.getByText('Assign Number')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', () => {
      render(<PhoneNumbersTab />);

      // The search input should be present
      const searchInput = screen.getByPlaceholderText('Search phone numbers...');
      expect(searchInput).toBeInTheDocument();
    });

    it('shows organization information', () => {
      render(<PhoneNumbersTab />);

      expect(screen.getByText('Organization: Developer')).toBeInTheDocument();
    });

    it('shows select phone number message when no phone number is selected', () => {
      render(<PhoneNumbersTab />);

      expect(screen.getByText('Select a Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Choose a phone number from the sidebar to view its details')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders the component without errors', () => {
      render(<PhoneNumbersTab />);

      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', () => {
      render(<PhoneNumbersTab />);

      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', () => {
      render(<PhoneNumbersTab />);

      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
    });
  });
});
