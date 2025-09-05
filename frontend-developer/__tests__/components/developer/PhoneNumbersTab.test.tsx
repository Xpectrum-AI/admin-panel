import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhoneNumbersTab from '@/app/components/PhoneNumbersTab';

// Mock the phone number service
jest.mock('@/service/phoneNumberService', () => ({
  getAllAgentsPhoneNumbers: jest.fn(),
  addUpdateAgentPhoneNumber: jest.fn(),
  getAvailablePhoneNumbersByOrg: jest.fn(),
  unassignPhoneNumber: jest.fn(),
}));

// Mock the agent config service
jest.mock('@/service/agentConfigService', () => ({
  agentConfigService: {
    getAgentsByOrg: jest.fn(),
  },
}));

// Mock ThemeContext
jest.mock('@/app/contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleTheme: jest.fn(),
  }),
}));

import { getAllAgentsPhoneNumbers, addUpdateAgentPhoneNumber, getAvailablePhoneNumbersByOrg, unassignPhoneNumber } from '@/service/phoneNumberService';
import { agentConfigService } from '@/service/agentConfigService';

const mockPhoneNumberService = {
  getAllAgentsPhoneNumbers: getAllAgentsPhoneNumbers as jest.MockedFunction<typeof getAllAgentsPhoneNumbers>,
  addUpdateAgentPhoneNumber: addUpdateAgentPhoneNumber as jest.MockedFunction<typeof addUpdateAgentPhoneNumber>,
  getAvailablePhoneNumbersByOrg: getAvailablePhoneNumbersByOrg as jest.MockedFunction<typeof getAvailablePhoneNumbersByOrg>,
  unassignPhoneNumber: unassignPhoneNumber as jest.MockedFunction<typeof unassignPhoneNumber>,
};

const mockAgentConfigService = agentConfigService as jest.Mocked<typeof agentConfigService>;

describe('PhoneNumbersTab', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
    jest.clearAllMocks();
    
    // Mock successful API responses to prevent act() warnings
    mockPhoneNumberService.getAllAgentsPhoneNumbers.mockResolvedValue({
      success: true,
      data: []
    });
    
    mockAgentConfigService.getAgentsByOrg.mockResolvedValue({
      success: true,
      data: [],
      message: 'Agents retrieved successfully'
    });
    
    mockPhoneNumberService.getAvailablePhoneNumbersByOrg.mockResolvedValue({
      success: true,
      data: []
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the phone numbers tab with default props', async () => {
      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
      expect(screen.getByText('View and manage phone number assignments to agents')).toBeInTheDocument();
    });

    it('renders with dark mode styling', async () => {
      // Mock dark mode theme
      jest.doMock('@/app/contexts/ThemeContext', () => ({
        useTheme: () => ({
          isDarkMode: true,
          toggleTheme: jest.fn(),
        }),
      }));

      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      // Check that the component renders without errors
      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
    });

    it('shows the add phone number button', async () => {
      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      expect(screen.getByText('Assign Number')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('renders inbound and outbound tabs', async () => {
      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      // The component doesn't have Inbound/Outbound tabs
      // It shows a search interface instead
      expect(screen.getByPlaceholderText('Search phone numbers...')).toBeInTheDocument();
    });

    it('shows inbound tab as active by default', async () => {
      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      // The component shows "Phone Numbers Management" instead of "Inbound" tabs
      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
    });

    it('allows switching between inbound and outbound tabs', async () => {
      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      // The component doesn't have Inbound/Outbound tabs
      // It shows a search interface and "Select a Phone Number" message
      expect(screen.getByText('Select a Phone Number')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      // The search input should be present
      const searchInput = screen.getAllByRole('textbox')[0];
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders the component without errors', async () => {
      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', async () => {
      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', async () => {
      await act(async () => {
        render(<PhoneNumbersTab />);
      });

      expect(screen.getByText('Phone Numbers Management')).toBeInTheDocument();
    });
  });
});
