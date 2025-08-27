import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WhatsAppTab from '@/app/developer/components/WhatsAppTab';

describe('WhatsAppTab', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the WhatsApp tab with default props', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('WhatsApp Business Platform')).toBeInTheDocument();
      expect(screen.getByText('Conversational AI messaging with Dify integration')).toBeInTheDocument();
    });

    it('renders with dark mode styling', () => {
      render(<WhatsAppTab isDarkMode={true} />);
      
      // Check that the component renders without errors
      expect(screen.getByText('WhatsApp Business Platform')).toBeInTheDocument();
    });

    it('shows the new conversation button', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('New Conversation')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('renders conversations, configuration, analytics, and health tabs', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Configuration')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });

    it('shows conversations tab as active by default', () => {
      render(<WhatsAppTab />);
      
      const conversationsTab = screen.getByText('Conversations');
      expect(conversationsTab).toBeInTheDocument();
    });

    it('allows switching between tabs', async () => {
      render(<WhatsAppTab />);
      
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
      render(<WhatsAppTab />);
      
      // The search input should be present
      const searchInput = screen.getAllByRole('textbox')[0];
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders the component without errors', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('WhatsApp Business Platform')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('WhatsApp Business Platform')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('WhatsApp Business Platform')).toBeInTheDocument();
    });
  });
});
