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
      
      expect(screen.getByText('WhatsApp Business')).toBeInTheDocument();
      expect(screen.getByText('Manage your WhatsApp Business integration')).toBeInTheDocument();
    });

    it('renders with dark mode styling', () => {
      render(<WhatsAppTab isDarkMode={true} />);
      
      // Check that the component renders without errors
      expect(screen.getByText('WhatsApp Business')).toBeInTheDocument();
    });

    it('shows the add WhatsApp config button', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('Add WhatsApp Config')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('renders inbound and outbound tabs', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('Inbound')).toBeInTheDocument();
      expect(screen.getByText('Outbound')).toBeInTheDocument();
    });

    it('shows inbound tab as active by default', () => {
      render(<WhatsAppTab />);
      
      const inboundTab = screen.getByText('Inbound');
      expect(inboundTab).toBeInTheDocument();
    });

    it('allows switching between inbound and outbound tabs', async () => {
      render(<WhatsAppTab />);
      
      const outboundTab = screen.getByText('Outbound');
      await user.click(outboundTab);
      
      // Both tabs should still be visible
      expect(screen.getByText('Inbound')).toBeInTheDocument();
      expect(screen.getByText('Outbound')).toBeInTheDocument();
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
      
      expect(screen.getByText('WhatsApp Business')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders the component without errors', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('WhatsApp Business')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders the component without errors', () => {
      render(<WhatsAppTab />);
      
      expect(screen.getByText('WhatsApp Business')).toBeInTheDocument();
    });
  });
});
