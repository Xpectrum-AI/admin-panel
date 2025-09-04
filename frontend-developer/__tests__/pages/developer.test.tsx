import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeveloperDashboard from '../../app/page';

// Mock the tab components
jest.mock('../../app/components', () => ({
  AgentsTab: ({ isDarkMode }: { isDarkMode?: boolean }) => <div data-testid="agents-tab">Agents Tab {isDarkMode ? 'Dark' : 'Light'}</div>,
  PhoneNumbersTab: ({ isDarkMode }: { isDarkMode?: boolean }) => <div data-testid="phone-numbers-tab">Phone Numbers Tab {isDarkMode ? 'Dark' : 'Light'}</div>,
  SMSTab: ({ isDarkMode }: { isDarkMode?: boolean }) => <div data-testid="sms-tab">SMS Tab {isDarkMode ? 'Dark' : 'Light'}</div>,
  WhatsAppTab: ({ isDarkMode }: { isDarkMode?: boolean }) => <div data-testid="whatsapp-tab">WhatsApp Tab {isDarkMode ? 'Dark' : 'Light'}</div>,
  OverviewTab: ({ isDarkMode }: { isDarkMode?: boolean }) => <div data-testid="overview-tab">Overview Tab {isDarkMode ? 'Dark' : 'Light'}</div>,
  Navbar: ({
    isDarkMode,
    activeTab,
    onChange,
    activeTitle,
    sidebarOpen,
    onToggleSidebar,
    onToggleDarkMode,
    onLogout
  }: any) => (
    <div data-testid="navbar">
      <span data-testid="active-tab">{activeTab}</span>
      <span data-testid="active-title">{activeTitle}</span>
      <span data-testid="dark-mode-state">{isDarkMode ? 'dark' : 'light'}</span>
    </div>
  ),
}));

// Mock external dependencies
jest.mock('@propelauth/react', () => ({
  useAuthInfo: () => ({
    user: { email: 'test@example.com', firstName: 'Test', lastName: 'User' },
    isLoggedIn: true,
  }),
  useLogoutFunction: () => jest.fn(() => Promise.resolve()),
}));

jest.mock('react-spinners', () => ({
  SyncLoader: () => <div data-testid="sync-loader">Loading...</div>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
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
    it('renders the developer dashboard with navbar', () => {
      render(<DeveloperDashboard />);

      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
    });

    it('renders with default Overview tab active', () => {
      render(<DeveloperDashboard />);

      expect(screen.getByTestId('active-tab')).toHaveTextContent('Overview');
      expect(screen.getByTestId('active-title')).toHaveTextContent('Overview');
    });

    it('renders in light mode by default', () => {
      render(<DeveloperDashboard />);

      expect(screen.getByTestId('dark-mode-state')).toHaveTextContent('light');
    });
  });


  describe('Content Rendering', () => {
    it('shows overview tab by default', () => {
      render(<DeveloperDashboard />);

      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
    });
  });




});
