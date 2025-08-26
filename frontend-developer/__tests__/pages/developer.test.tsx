import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeveloperDashboard from '@/app/developer/page';

// Mock the tab components
jest.mock('@/app/developer/components', () => ({
  AgentsTab: () => <div data-testid="agents-tab">Agents Tab</div>,
  PhoneNumbersTab: () => <div data-testid="phone-numbers-tab">Phone Numbers Tab</div>,
  SMSTab: () => <div data-testid="sms-tab">SMS Tab</div>,
  WhatsAppTab: () => <div data-testid="whatsapp-tab">WhatsApp Tab</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Building2: () => <div data-testid="building-icon">Building</div>,
  Bot: () => <div data-testid="bot-icon">Bot</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  BarChart3: () => <div data-testid="chart-icon">Chart</div>,
  FileText: () => <div data-testid="file-icon">File</div>,
  MessageSquare: () => <div data-testid="message-icon">Message</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  LogOut: () => <div data-testid="logout-icon">Logout</div>,
  ArrowLeft: () => <div data-testid="arrow-icon">Arrow</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Activity: () => <div data-testid="activity-icon">Activity</div>,
  MoreHorizontal: () => <div data-testid="more-icon">More</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  TrendingUp: () => <div data-testid="trending-icon">Trending</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  Code: () => <div data-testid="code-icon">Code</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>,
  Moon: () => <div data-testid="moon-icon">Moon</div>,
}));

describe('DeveloperDashboard', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the developer dashboard with navigation items', () => {
      render(<DeveloperDashboard />);
      
      expect(screen.getAllByText('Overview')[0]).toBeInTheDocument();
      expect(screen.getByText('Agents')).toBeInTheDocument();
      expect(screen.getAllByText('Phone Numbers')[0]).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    });

    it('renders navigation categories', () => {
      render(<DeveloperDashboard />);
      
      expect(screen.getByText('MANAGE')).toBeInTheDocument();
      expect(screen.getByText('BUILD')).toBeInTheDocument();
      expect(screen.getByText('OBSERVE')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('allows switching between navigation items', async () => {
      render(<DeveloperDashboard />);
      
      const agentsNav = screen.getByText('Agents');
      await user.click(agentsNav);
      
      expect(screen.getByTestId('agents-tab')).toBeInTheDocument();
    });

    it('updates active navigation item when clicked', async () => {
      render(<DeveloperDashboard />);
      
      const phoneNumbersNav = screen.getAllByText('Phone Numbers')[0];
      await user.click(phoneNumbersNav);
      
      expect(screen.getByTestId('phone-numbers-tab')).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('shows agents tab when agents is selected', async () => {
      render(<DeveloperDashboard />);
      
      const agentsNav = screen.getByText('Agents');
      await user.click(agentsNav);
      
      expect(screen.getByTestId('agents-tab')).toBeInTheDocument();
    });

    it('shows phone numbers tab when phone numbers is selected', async () => {
      render(<DeveloperDashboard />);
      
      const phoneNumbersNav = screen.getAllByText('Phone Numbers')[0];
      await user.click(phoneNumbersNav);
      
      expect(screen.getByTestId('phone-numbers-tab')).toBeInTheDocument();
    });

    it('shows SMS tab when SMS is selected', async () => {
      render(<DeveloperDashboard />);
      
      const smsNav = screen.getByText('SMS');
      await user.click(smsNav);
      
      expect(screen.getByTestId('sms-tab')).toBeInTheDocument();
    });

    it('shows WhatsApp tab when WhatsApp is selected', async () => {
      render(<DeveloperDashboard />);
      
      const whatsappNav = screen.getByText('WhatsApp');
      await user.click(whatsappNav);
      
      expect(screen.getByTestId('whatsapp-tab')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('maintains state across navigation changes', async () => {
      render(<DeveloperDashboard />);
      
      // Navigate to Agents
      const agentsNav = screen.getByText('Agents');
      await user.click(agentsNav);
      
      expect(screen.getByTestId('agents-tab')).toBeInTheDocument();
      
      // Navigate back to Overview
      const overviewNav = screen.getAllByText('Overview')[0];
      await user.click(overviewNav);
      
      // Should show overview content
      expect(screen.getAllByText('Overview')[0]).toBeInTheDocument();
    });

    it('handles multiple rapid navigation clicks', async () => {
      render(<DeveloperDashboard />);
      
      const agentsNav = screen.getByText('Agents');
      const phoneNumbersNav = screen.getAllByText('Phone Numbers')[0];
      
      await user.click(agentsNav);
      await user.click(phoneNumbersNav);
      
      expect(screen.getByTestId('phone-numbers-tab')).toBeInTheDocument();
    });
  });
});
